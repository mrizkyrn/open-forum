import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CommentService } from '../comment/comment.service';
import { Comment } from '../comment/entities/comment.entity';
import { DiscussionService } from '../discussion/discussion.service';
import { Discussion } from '../discussion/entities/discussion.entity';
import { NotificationEntityType, NotificationType } from '../notification/entities/notification.entity';
import { NotificationService } from '../notification/notification.service';
import { VoteCountsDto, VoteResponseDto } from './dto/vote-response.dto';
import { Vote, VoteEntityType, VoteValue } from './entities/vote.entity';

@Injectable()
export class VoteService {
  private readonly logger = new Logger(VoteService.name);

  constructor(
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    @Inject(forwardRef(() => DiscussionService))
    private readonly discussionService: DiscussionService,
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
    private readonly notificationService: NotificationService,
  ) {}

  // ----- Core Vote Operations -----

  async voteDiscussion(userId: number, discussionId: number, value: VoteValue): Promise<VoteResponseDto | null> {
    return this.voteEntity(userId, VoteEntityType.DISCUSSION, discussionId, value);
  }

  async voteComment(userId: number, commentId: number, value: VoteValue): Promise<VoteResponseDto | null> {
    return this.voteEntity(userId, VoteEntityType.COMMENT, commentId, value);
  }

  async getUserVoteStatus(userId: number, entityType: VoteEntityType, entityId: number): Promise<number | null> {
    try {
      const vote = await this.voteRepository.findOne({
        where: {
          user: { id: userId },
          entityType,
          entityId,
        },
        relations: ['user'],
      });
      return vote ? vote.value : null;
    } catch (error) {
      this.logger.error(`Error getting user vote status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getVoteCounts(entityType: VoteEntityType, entityId: number): Promise<VoteCountsDto> {
    try {
      let entity: Discussion | Comment | null = null;

      if (entityType === VoteEntityType.DISCUSSION) {
        entity = await this.discussionService.getDiscussionEntity(entityId);
      } else {
        entity = await this.commentService.getCommentEntity(entityId);
      }

      if (!entity) {
        throw new NotFoundException('Entity not found');
      }

      return {
        upvotes: entity.upvoteCount || 0,
        downvotes: entity.downvoteCount || 0,
      };
    } catch (error) {
      this.logger.error(`Error getting vote counts: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ----- Other Operations -----

  async countByDateRange(start: Date, end: Date): Promise<number> {
    return this.voteRepository.count({
      where: { createdAt: Between(start, end) },
    });
  }

  async getTimeSeries(start: Date, end: Date): Promise<{ date: string; count: string }[]> {
    return this.voteRepository
      .createQueryBuilder('vote')
      .select(`DATE(vote.created_at)`, 'date')
      .addSelect(`COUNT(vote.id)`, 'count')
      .where('vote.created_at BETWEEN :start AND :end', {
        start,
        end,
      })
      .groupBy(`DATE(vote.created_at)`)
      .orderBy(`DATE(vote.created_at)`, 'ASC')
      .getRawMany();
  }

  // ----- Helper Methods -----

  private async voteEntity(
    userId: number,
    entityType: VoteEntityType,
    entityId: number,
    value: VoteValue,
  ): Promise<VoteResponseDto | null> {
    const queryRunner = this.voteRepository.manager.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Get entity and determine which service to use
      const service = entityType === VoteEntityType.DISCUSSION ? this.discussionService : this.commentService;

      // Get the entity (this validates it exists)
      const entity =
        entityType === VoteEntityType.DISCUSSION
          ? await this.discussionService.getDiscussionEntity(entityId)
          : await this.commentService.getCommentEntity(entityId);

      // Get the recipient ID for notification
      const recipientId = entityType === VoteEntityType.DISCUSSION ? entity.authorId : (entity as Comment).authorId;

      // Find existing vote within transaction
      const existingVote = await queryRunner.manager.findOne(Vote, {
        where: {
          user: { id: userId },
          entityType,
          entityId,
        },
        relations: ['user'],
      });

      let result: Vote | null = null;
      let shouldNotify = false;

      // Handle vote based on existing state
      if (existingVote) {
        // If same vote exists, remove it (toggle behavior)
        if (existingVote.value === value) {
          await queryRunner.manager.remove(existingVote);

          // Update counts
          if (value === VoteValue.UPVOTE) {
            await service.decrementUpvoteCount(entityId, queryRunner.manager);
          } else {
            await service.decrementDownvoteCount(entityId, queryRunner.manager);
          }
        } else {
          // Change vote direction
          existingVote.value = value;
          result = await queryRunner.manager.save(Vote, existingVote);

          // Update counts
          if (value === VoteValue.UPVOTE) {
            await service.incrementUpvoteCount(entityId, queryRunner.manager);
            await service.decrementDownvoteCount(entityId, queryRunner.manager);
            shouldNotify = true;
          } else {
            await service.incrementDownvoteCount(entityId, queryRunner.manager);
            await service.decrementUpvoteCount(entityId, queryRunner.manager);
          }
        }
      } else {
        // Create new vote
        const vote = queryRunner.manager.create(Vote, {
          user: { id: userId },
          entityType,
          entityId,
          value,
        });

        result = await queryRunner.manager.save(Vote, vote);

        // Update counts
        if (value === VoteValue.UPVOTE) {
          await service.incrementUpvoteCount(entityId, queryRunner.manager);
          shouldNotify = true;
        } else {
          await service.incrementDownvoteCount(entityId, queryRunner.manager);
        }
      }

      await queryRunner.commitTransaction();

      // Create notification after successful transaction
      if (shouldNotify && recipientId !== userId) {
        await this.createVoteNotification(entityType, entityId, userId, recipientId, value);
      }

      return result ? VoteResponseDto.fromEntity(result) : null;
    } catch (error) {
      this.logger.error(`Error voting on ${entityType} ${entityId}: ${error.message}`, error.stack);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createVoteNotification(
    entityType: VoteEntityType,
    entityId: number,
    voterId: number,
    recipientId: number,
    value: VoteValue,
  ): Promise<void> {
    // Only notify for upvotes and when recipient isn't the voter
    if (value !== VoteValue.UPVOTE || voterId === recipientId) {
      return;
    }

    try {
      // Define notification types based on entity
      const notificationType =
        entityType === VoteEntityType.DISCUSSION ? NotificationType.DISCUSSION_UPVOTE : NotificationType.COMMENT_UPVOTE;

      const notificationEntityType =
        entityType === VoteEntityType.DISCUSSION ? NotificationEntityType.DISCUSSION : NotificationEntityType.COMMENT;

      // Prepare notification data with enhanced context
      const notificationData: Record<string, any> = {};

      // Add entity-specific data
      if (entityType === VoteEntityType.DISCUSSION) {
        // For discussions, just include the discussion ID
        notificationData.discussionId = entityId;
      } else {
        // For comments, include both comment and parent discussion IDs
        const comment = await this.commentService.getCommentEntity(entityId);
        notificationData.commentId = entityId;
        notificationData.discussionId = comment.discussionId;

        // Add the comment content preview
        if (comment.content) {
          notificationData.contentPreview =
            comment.content.length > 100 ? `${comment.content.substring(0, 100)}...` : comment.content;
        }
      }

      await this.notificationService.createNotificationIfNotExists(
        {
          recipientId: recipientId,
          actorId: voterId,
          type: notificationType,
          entityType: notificationEntityType,
          entityId: entityId,
          data: notificationData,
        },
        60,
      ); // Deduplicate within 1 hour window
    } catch (error) {
      this.logger.error(`Error creating vote notification: ${error.message}`, error.stack);
      // Don't throw - notifications are non-critical
    }
  }
}
