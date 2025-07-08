import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AnalyticService } from '../analytic/analytic.service';
import { ActivityEntityType, ActivityType } from '../analytic/entities/user-activity.entity';
import { CommentService } from '../comment/comment.service';
import { Comment } from '../comment/entities/comment.entity';
import { DiscussionService } from '../discussion/discussion.service';
import { Discussion } from '../discussion/entities/discussion.entity';
import { NotificationEntityType, NotificationType } from '../notification/entities/notification.entity';
import { NotificationService } from '../notification/notification.service';
import { VoteDto } from './dto/vote-dto';
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
    private readonly analyticService: AnalyticService,
  ) {}

  // ----- Core Vote Operations -----

  async voteDiscussion(userId: number, discussionId: number, voteDto: VoteDto): Promise<VoteResponseDto | null> {
    return this.voteEntity(userId, VoteEntityType.DISCUSSION, discussionId, voteDto.value);
  }

  async voteComment(userId: number, commentId: number, voteDto: VoteDto): Promise<VoteResponseDto | null> {
    return this.voteEntity(userId, VoteEntityType.COMMENT, commentId, voteDto.value);
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
      const recipientId = entity.authorId;

      // Determine parent entity info for analytics
      let discussionId = entityId;
      if (entityType === VoteEntityType.COMMENT) {
        discussionId = (entity as Comment).discussionId;
      }

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
      let voteAction: 'added' | 'removed' | 'changed' = 'added';
      let oldVoteValue: VoteValue | null = null;

      // Handle vote based on existing state
      if (existingVote) {
        oldVoteValue = existingVote.value;

        // If same vote exists, remove it (toggle behavior)
        if (existingVote.value === value) {
          await queryRunner.manager.remove(existingVote);
          voteAction = 'removed';

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
          voteAction = 'changed';

          // Update counts
          if (value === VoteValue.UPVOTE) {
            await service.incrementUpvoteCount(entityId, queryRunner.manager);
            await service.decrementDownvoteCount(entityId, queryRunner.manager);
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
        voteAction = 'added';

        // Update counts
        if (value === VoteValue.UPVOTE) {
          await service.incrementUpvoteCount(entityId, queryRunner.manager);
        } else {
          await service.incrementDownvoteCount(entityId, queryRunner.manager);
        }
      }

      await queryRunner.commitTransaction();

      // Handle notifications
      if (value === VoteValue.UPVOTE || recipientId !== userId) {
        // Define notification types based on entity
        const notificationType =
          entityType === VoteEntityType.DISCUSSION
            ? NotificationType.DISCUSSION_UPVOTE
            : NotificationType.COMMENT_UPVOTE;

        const notificationEntityType =
          entityType === VoteEntityType.DISCUSSION ? NotificationEntityType.DISCUSSION : NotificationEntityType.COMMENT;

        // Prepare notification data
        const notificationData: Record<string, any> = {};

        // Add entity-specific data
        if (entityType === VoteEntityType.DISCUSSION) {
          // For discussions, just include the discussion ID
          notificationData.discussionId = entityId;
          notificationData.url = `/discussions/${entityId}`;

          // Optionally fetch the discussion to include content preview
          try {
            const discussion = await this.discussionService.getDiscussionEntity(entityId);
            if (discussion?.content) {
              notificationData.contentPreview = this.truncateContent(discussion.content, 75);
            }
          } catch (discussionError) {
            this.logger.warn(`Could not fetch discussion ${entityId} for notification: ${discussionError.message}`);
          }
        } else {
          // For comments, include both comment and discussion IDs
          notificationData.commentId = entityId;
          notificationData.discussionId = discussionId;
          notificationData.url = `/discussions/${discussionId}?comment=${entityId}`;

          // Fetch the comment to include content preview
          try {
            const comment = await this.commentService.getCommentEntity(entityId);
            if (comment?.content) {
              notificationData.contentPreview = this.truncateContent(comment.content, 75);
            }
          } catch (commentError) {
            this.logger.warn(`Could not fetch comment ${entityId} for notification: ${commentError.message}`);
          }
        }

        // Create the notification
        await this.notificationService.createNotificationIfNotExists(
          {
            recipientId: recipientId,
            actorId: userId,
            type: notificationType,
            entityType: notificationEntityType,
            entityId: entityId,
            data: notificationData,
          },
          60, // Deduplicate within 1 hour window
        );
      }

      // Record analytic
      const activityType =
        entityType === VoteEntityType.DISCUSSION ? ActivityType.VOTE_DISCUSSION : ActivityType.VOTE_COMMENT;
      const activityEntityType =
        entityType === VoteEntityType.DISCUSSION ? ActivityEntityType.DISCUSSION : ActivityEntityType.COMMENT;
      await this.analyticService.recordActivity(userId, activityType, activityEntityType, entityId, {
        voteValue: value,
        discussionId: discussionId,
        recipientId: recipientId,
        action: voteAction,
      });

      return result ? VoteResponseDto.fromEntity(result) : null;
    } catch (error) {
      this.logger.error(`Error voting on ${entityType} ${entityId}: ${error.message}`, error.stack);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private truncateContent(content: string, maxLength: number): string {
    if (!content) return '';
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  }
}
