import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { NotificationEntityType, NotificationType } from '../notification/entities/notification.entity';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../user/user.service';
import { CommentMention } from './entities/comment-mention.entity';

@Injectable()
export class CommentMentionService {
  private readonly logger = new Logger(CommentMentionService.name);

  constructor(
    @InjectRepository(CommentMention)
    private readonly mentionRepository: Repository<CommentMention>,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  async processMentions(
    content: string,
    commentId: number,
    discussionId: number,
    authorId: number,
    parentId?: number,
    parentCommentAuthorId?: number,
    entityManager?: EntityManager,
  ): Promise<void> {
    // Extract usernames from @mentions in the comment
    const mentionedUsernames = this.extractMentions(content);
    if (mentionedUsernames.length === 0) {
      return;
    }

    try {
      // Find existing users with the mentioned usernames
      const mentionedUsers = await this.findMentionedUsers(mentionedUsernames);

      // Filter out the author from mentions
      const filteredUsers = mentionedUsers.filter((user) => {
        // Don't mention yourself
        if (user.id === authorId) return false;

        // Don't mention the person you're replying to (they'll get a reply notification)
        if (parentCommentAuthorId && user.id === parentCommentAuthorId) return false;

        return true;
      });

      if (filteredUsers.length === 0) {
        return;
      }

      // Create mention records
      const mentions = filteredUsers.map((user) => {
        return this.mentionRepository.create({
          userId: user.id,
          commentId,
        });
      });

      // Use the provided entity manager or fall back to repository
      const manager = entityManager || this.mentionRepository.manager;
      await manager.save(CommentMention, mentions);

      await this.notificationService.createBatchNotifications(
        {
          recipientIds: filteredUsers.map((user) => user.id),
          actorId: authorId,
          type: NotificationType.USER_MENTIONED,
          entityType: NotificationEntityType.COMMENT,
          entityId: commentId,
          data: {
            discussionId: discussionId,
            parentCommentId: parentId,
            commentId: commentId,
            contentPreview: this.truncateContent(content, 75),
            url: `/discussions/${discussionId}?comment=${commentId}`,
          },
        },
        undefined, // No transaction needed here
      );
    } catch (error) {
      this.logger.error(`Error processing mentions: ${error.message}`, error.stack);
      throw error; // Re-throw to propagate to transaction
    }
  }

  async updateMentions(
    content: string,
    commentId: number,
    discussionId: number,
    authorId: number,
    parentId?: number,
    parentCommentAuthorId?: number,
    entityManager?: EntityManager,
  ): Promise<void> {
    const manager = entityManager || this.mentionRepository.manager;
    // Remove existing mentions for this comment
    await manager.delete(CommentMention, { commentId });

    // Process new mentions
    await this.processMentions(content, commentId, discussionId, authorId, parentId, parentCommentAuthorId, manager);
  }

  private extractMentions(content: string): string[] {
    // Match @username pattern (username can contain letters, numbers, dots, underscores)
    const mentionRegex = /@([a-zA-Z0-9._]+)/g;
    const matches = content.match(mentionRegex) || [];

    // Remove @ symbol and return unique usernames
    return [...new Set(matches.map((match) => match.substring(1)))];
  }

  private async findMentionedUsers(usernames: string[]): Promise<any[]> {
    if (usernames.length === 0) return [];

    return this.userService.findManyByUsernames(usernames);
  }

  async getMentionsForUser(userId: number): Promise<CommentMention[]> {
    return this.mentionRepository.find({
      where: { userId },
      relations: ['comment', 'comment.author'],
      order: { createdAt: 'DESC' },
    });
  }

  private truncateContent(content: string, maxLength: number): string {
    if (!content) return '';
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  }
}
