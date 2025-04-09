import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisChannels } from 'src/core/redis/redis.constants';
import { EntityManager, Repository } from 'typeorm';
import { RedisService } from '../../core/redis/redis.service';
import { UserService } from '../user/user.service';
import { CommentMention } from './entities/comment-mention.entity';

@Injectable()
export class CommentMentionService {
  private readonly logger = new Logger(CommentMentionService.name);

  constructor(
    @InjectRepository(CommentMention)
    private readonly mentionRepository: Repository<CommentMention>,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {}

  async processMentions(
    content: string,
    commentId: number,
    discussionId: number,
    authorId: number,
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

      // Filter out the author from mentions (don't notify yourself)
      const filteredUsers = mentionedUsers.filter((user) => user.id !== authorId);

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

      // Notify mentioned users via Redis (for realtime notifications)
      await this.redisService.publish(RedisChannels.USER_MENTIONED, {
        content,
        userIds: filteredUsers.map((user) => user.id),
        discussionId,
        commentId,
        authorId,
      });
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
    entityManager?: EntityManager,
  ): Promise<void> {
    const manager = entityManager || this.mentionRepository.manager;
    // Remove existing mentions for this comment
    await manager.delete(CommentMention, { commentId });

    // Process new mentions
    await this.processMentions(content, commentId, discussionId, authorId, manager);
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
}
