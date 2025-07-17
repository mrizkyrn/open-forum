import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import { VoteCountsResponseDto, VoteDto, VoteResponseDto } from './dto';
import { Vote, VoteEntityType, VoteValue } from './entities/vote.entity';

@Injectable()
export class VoteService {
  private readonly logger = new Logger(VoteService.name);

  // Configuration constants
  private static readonly NOTIFICATION_DEDUPLICATION_WINDOW = 60 * 60 * 1000; // 1 hour
  private static readonly CONTENT_PREVIEW_MAX_LENGTH = 75;

  // In-memory cache for recent vote operations to prevent spam
  private readonly recentVoteCache = new Map<string, number>();
  private static readonly VOTE_COOLDOWN_MS = 1000; // 1 second cooldown

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

  // ==================== CORE VOTE OPERATIONS ====================

  /**
   * Vote on a discussion
   * @param userId - ID of the user casting the vote
   * @param discussionId - ID of the discussion to vote on
   * @param voteDto - Vote data containing the vote value
   * @returns Vote response or null if vote was removed
   * @throws NotFoundException if discussion not found
   * @throws BadRequestException if vote operation is invalid
   */
  async voteDiscussion(userId: number, discussionId: number, voteDto: VoteDto): Promise<VoteResponseDto | null> {
    if (!voteDto) {
      throw new BadRequestException('Vote data is required');
    }

    this.logger.log(`User ${userId} voting on discussion ${discussionId} with value ${voteDto.value}`);

    this.validateVoteDto(voteDto);
    await this.checkVoteCooldown(userId, VoteEntityType.DISCUSSION, discussionId);

    return this.voteEntity(userId, VoteEntityType.DISCUSSION, discussionId, voteDto.value);
  }

  /**
   * Vote on a comment
   * @param userId - ID of the user casting the vote
   * @param commentId - ID of the comment to vote on
   * @param voteDto - Vote data containing the vote value
   * @returns Vote response or null if vote was removed
   * @throws NotFoundException if comment not found
   * @throws BadRequestException if vote operation is invalid
   */
  async voteComment(userId: number, commentId: number, voteDto: VoteDto): Promise<VoteResponseDto | null> {
    if (!voteDto) {
      throw new BadRequestException('Vote data is required');
    }

    this.logger.log(`User ${userId} voting on comment ${commentId} with value ${voteDto.value}`);

    this.validateVoteDto(voteDto);
    await this.checkVoteCooldown(userId, VoteEntityType.COMMENT, commentId);

    return this.voteEntity(userId, VoteEntityType.COMMENT, commentId, voteDto.value);
  }

  /**
   * Get user's vote status for a specific entity
   * @param userId - ID of the user
   * @param entityType - Type of entity (discussion or comment)
   * @param entityId - ID of the entity
   * @returns Vote value (1 for upvote, -1 for downvote) or null if not voted
   * @throws NotFoundException if entity not found
   */
  async getUserVoteStatus(userId: number, entityType: VoteEntityType, entityId: number): Promise<number | null> {
    this.logger.debug(`Getting vote status for user ${userId} on ${entityType} ${entityId}`);

    try {
      // Validate entity exists
      await this.validateEntityExists(entityType, entityId);

      const vote = await this.voteRepository.findOne({
        where: {
          userId,
          entityType,
          entityId,
        },
      });

      return vote ? vote.value : null;
    } catch (error) {
      this.logger.error(`Error getting user vote status for user ${userId} on ${entityType} ${entityId}`, error);
      throw error;
    }
  }

  /**
   * Get vote counts for a specific entity
   * @param entityType - Type of entity (discussion or comment)
   * @param entityId - ID of the entity
   * @returns Vote counts including upvotes, downvotes, and total
   * @throws NotFoundException if entity not found
   */
  async getVoteCounts(entityType: VoteEntityType, entityId: number): Promise<VoteCountsResponseDto> {
    this.logger.debug(`Getting vote counts for ${entityType} ${entityId}`);

    try {
      const entity = await this.getEntityWithVoteCounts(entityType, entityId);

      return VoteCountsResponseDto.create(entity.upvoteCount || 0, entity.downvoteCount || 0);
    } catch (error) {
      this.logger.error(`Error getting vote counts for ${entityType} ${entityId}`, error);
      throw error;
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get total vote count
   * @returns Total number of votes
   */
  async getTotalVoteCount(): Promise<number> {
    return this.voteRepository.count();
  }

  /**
   * Get vote count within date range
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Number of votes in date range
   */
  async getVoteCountByDateRange(startDate: Date, endDate: Date): Promise<number> {
    return this.voteRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });
  }

  /**
   * Get vote time series data
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of date/count pairs
   */
  async getTimeSeries(startDate: Date, endDate: Date): Promise<{ date: string; count: string }[]> {
    this.logger.debug(`Getting vote time series from ${startDate} to ${endDate}`);

    return this.voteRepository
      .createQueryBuilder('vote')
      .select('DATE(vote.createdAt)', 'date')
      .addSelect('COUNT(vote.id)', 'count')
      .where('vote.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(vote.createdAt)')
      .orderBy('DATE(vote.createdAt)', 'ASC')
      .getRawMany();
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get vote entity with relations
   * @param id - Vote ID
   * @param relations - Relations to load
   * @returns Vote entity
   * @throws NotFoundException if vote not found
   */
  async getVoteEntity(id: number, relations: string[] = []): Promise<Vote> {
    const vote = await this.voteRepository.findOne({
      where: { id },
      relations,
    });

    if (!vote) {
      throw new NotFoundException(`Vote with ID ${id} not found`);
    }

    return vote;
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Validate vote DTO
   * @param voteDto - Vote DTO to validate
   * @throws BadRequestException if DTO is invalid
   */
  private validateVoteDto(voteDto: VoteDto): void {
    if (!voteDto) {
      throw new BadRequestException('Vote data is required');
    }

    if (!Object.values(VoteValue).includes(voteDto.value)) {
      throw new BadRequestException('Invalid vote value. Must be 1 (upvote) or -1 (downvote)');
    }
  }

  /**
   * Check vote cooldown to prevent spam
   * @param userId - User ID
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @throws BadRequestException if cooldown not elapsed
   */
  private async checkVoteCooldown(userId: number, entityType: VoteEntityType, entityId: number): Promise<void> {
    const cacheKey = `${userId}-${entityType}-${entityId}`;
    const lastVoteTime = this.recentVoteCache.get(cacheKey);
    const now = Date.now();

    if (lastVoteTime && now - lastVoteTime < VoteService.VOTE_COOLDOWN_MS) {
      throw new BadRequestException('Please wait before voting again');
    }

    this.recentVoteCache.set(cacheKey, now);

    // Cleanup old cache entries (keep only last 1000 entries)
    if (this.recentVoteCache.size > 1000) {
      const oldestKeys = Array.from(this.recentVoteCache.keys()).slice(0, 100);
      oldestKeys.forEach((key) => this.recentVoteCache.delete(key));
    }
  }

  /**
   * Validate that an entity exists
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @throws NotFoundException if entity doesn't exist
   */
  private async validateEntityExists(entityType: VoteEntityType, entityId: number): Promise<void> {
    try {
      if (entityType === VoteEntityType.DISCUSSION) {
        await this.discussionService.getDiscussionEntity(entityId);
      } else {
        await this.commentService.getCommentEntity(entityId);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`${entityType} with ID ${entityId} not found`);
      }
      throw error;
    }
  }

  /**
   * Get entity with vote counts
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @returns Entity with vote counts
   */
  private async getEntityWithVoteCounts(entityType: VoteEntityType, entityId: number): Promise<Discussion | Comment> {
    if (entityType === VoteEntityType.DISCUSSION) {
      return this.discussionService.getDiscussionEntity(entityId);
    } else {
      return this.commentService.getCommentEntity(entityId);
    }
  }

  /**
   * Get entity service based on entity type
   * @param entityType - Entity type
   * @returns Appropriate service
   */
  private getEntityService(entityType: VoteEntityType): DiscussionService | CommentService {
    return entityType === VoteEntityType.DISCUSSION ? this.discussionService : this.commentService;
  }

  /**
   * Record vote analytics
   * @param userId - User ID
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @param action - Vote action
   * @param voteValue - Vote value (optional)
   */
  private async recordVoteAnalytics(
    userId: number,
    entityType: VoteEntityType,
    entityId: number,
    action: 'added' | 'removed' | 'changed',
    voteValue?: VoteValue,
  ): Promise<void> {
    try {
      const activityType =
        entityType === VoteEntityType.DISCUSSION ? ActivityType.VOTE_DISCUSSION : ActivityType.VOTE_COMMENT;
      const activityEntityType =
        entityType === VoteEntityType.DISCUSSION ? ActivityEntityType.DISCUSSION : ActivityEntityType.COMMENT;

      // Get discussion ID for context
      let discussionId = entityId;
      if (entityType === VoteEntityType.COMMENT) {
        const comment = await this.commentService.getCommentEntity(entityId);
        discussionId = comment.discussionId;
      }

      await this.analyticService.recordActivity(userId, activityType, activityEntityType, entityId, {
        voteValue,
        discussionId,
        action,
      });
    } catch (error) {
      this.logger.warn(`Failed to record vote analytics for user ${userId} on ${entityType} ${entityId}`, error);
    }
  }

  /**
   * Truncate content for notifications
   * @param content - Content to truncate
   * @param maxLength - Maximum length
   * @returns Truncated content
   */
  private truncateContent(content: string, maxLength: number = VoteService.CONTENT_PREVIEW_MAX_LENGTH): string {
    if (!content) return '';
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  }

  /**
   * Core vote entity method - handles the main voting logic
   * @param userId - User ID
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @param value - Vote value
   * @returns Vote response or null if vote was removed
   */
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

      // Validate entity exists and get it
      const entity = await this.getEntityWithVoteCounts(entityType, entityId);
      const service = this.getEntityService(entityType);

      // Get recipient ID for notifications
      const recipientId = entity.authorId;

      // Determine discussion ID for analytics
      let discussionId = entityId;
      if (entityType === VoteEntityType.COMMENT) {
        discussionId = (entity as Comment).discussionId;
      }

      // Find existing vote within transaction
      const existingVote = await queryRunner.manager.findOne(Vote, {
        where: { userId, entityType, entityId },
        relations: ['user'],
      });

      let result: Vote | null = null;
      let voteAction: 'added' | 'removed' | 'changed' = 'added';

      // Handle vote based on existing state
      if (existingVote) {
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
          userId,
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

      // Handle notifications (only for upvotes and not self-votes)
      if (
        (voteAction === 'added' || voteAction === 'changed') &&
        value === VoteValue.UPVOTE &&
        recipientId !== userId
      ) {
        await this.sendVoteNotification(userId, entityType, entityId, discussionId, entity);
      }

      // Record analytics
      await this.recordVoteAnalytics(userId, entityType, entityId, voteAction, value);

      this.logger.log(
        `Vote operation completed: ${voteAction} ${value} for user ${userId} on ${entityType} ${entityId}`,
      );

      return result ? VoteResponseDto.fromEntity(result) : null;
    } catch (error) {
      this.logger.error(`Error voting on ${entityType} ${entityId} for user ${userId}`, error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Send vote notification
   * @param actorId - User who voted
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @param discussionId - Discussion ID
   * @param entity - Entity data
   */
  private async sendVoteNotification(
    actorId: number,
    entityType: VoteEntityType,
    entityId: number,
    discussionId: number,
    entity: Discussion | Comment,
  ): Promise<void> {
    try {
      // Define notification types based on entity
      const notificationType =
        entityType === VoteEntityType.DISCUSSION ? NotificationType.DISCUSSION_UPVOTE : NotificationType.COMMENT_UPVOTE;

      const notificationEntityType =
        entityType === VoteEntityType.DISCUSSION ? NotificationEntityType.DISCUSSION : NotificationEntityType.COMMENT;

      // Prepare notification data
      const notificationData: Record<string, any> = {};

      if (entityType === VoteEntityType.DISCUSSION) {
        notificationData.discussionId = entityId;
        notificationData.url = `/discussions/${entityId}`;
        if (entity.content) {
          notificationData.contentPreview = this.truncateContent(entity.content);
        }
      } else {
        notificationData.commentId = entityId;
        notificationData.discussionId = discussionId;
        notificationData.url = `/discussions/${discussionId}?comment=${entityId}`;
        if (entity.content) {
          notificationData.contentPreview = this.truncateContent(entity.content);
        }
      }

      // Create the notification with deduplication
      await this.notificationService.createNotificationIfNotExists(
        {
          recipientId: entity.authorId,
          actorId,
          type: notificationType,
          entityType: notificationEntityType,
          entityId,
          data: notificationData,
        },
        VoteService.NOTIFICATION_DEDUPLICATION_WINDOW / 1000, // Convert to seconds
      );
    } catch (error) {
      this.logger.warn(`Failed to send vote notification for ${entityType} ${entityId}`, error);
    }
  }
}
