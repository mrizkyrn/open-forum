import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Pageable } from '../../common/interfaces/pageable.interface';
import { RedisChannels } from '../../core/redis/redis.constants';
import { RedisService } from '../../core/redis/redis.service';
import { VoteEntityType } from '../vote/entities/vote.entity';
import { ActivitySortBy, SearchActivityDto } from './dto/search-activity.dto';
import { ActivityEntityType, ActivityType, UserActivity } from './entities/user-activity.entity';

@Injectable()
export class AnalyticService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticService.name);

  constructor(
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    this.subscribeToRedisEvents();
  }

  private subscribeToRedisEvents() {
    // Subscribe to discussion creation events
    this.redisService
      .subscribe(RedisChannels.DISCUSSION_CREATED, async (message) => {
        try {
          const data = JSON.parse(message);

          // Record the activity
          await this.recordActivity(
            data.authorId,
            ActivityType.CREATE_DISCUSSION,
            ActivityEntityType.DISCUSSION,
            data.discussionId,
            {
              spaceId: data.spaceId,
              isAnonymous: data.isAnonymous,
              hasTags: data.hasTags,
              hasAttachments: data.hasAttachments,
              content: data.content,
            },
          );
        } catch (error) {
          this.logger.error(`Error processing discussion created event for analytics: ${error.message}`);
        }
      })
      .catch((error) => {
        this.logger.error(`Failed to subscribe to discussion events in analytics: ${error.message}`);
      });

    // Subscribe to comment creation events
    this.redisService
      .subscribe(RedisChannels.COMMENT_CREATED, async (message) => {
        try {
          const data = JSON.parse(message);

          // Record the activity
          await this.recordActivity(
            data.authorId,
            ActivityType.CREATE_COMMENT,
            ActivityEntityType.COMMENT,
            data.commentId,
            {
              spaceId: data.spaceId,
              discussionId: data.discussionId,
              parentId: data.parentId,
              content: data.content,
              hasAttachments: data.hasAttachments,
              isReply: data.isReply,
            },
          );
        } catch (error) {
          this.logger.error(`Error processing comment created event for analytics: ${error.message}`);
        }
      })
      .catch((error) => {
        this.logger.error(`Failed to subscribe to comment events in analytics: ${error.message}`);
      });

    // Subscribe to vote update events
    this.redisService
      .subscribe(RedisChannels.VOTE_UPDATED, async (message) => {
        try {
          const data = JSON.parse(message);
          const activityType =
            data.entityType === VoteEntityType.DISCUSSION ? ActivityType.VOTE_DISCUSSION : ActivityType.VOTE_COMMENT;
          const activityEntityType =
            data.entityType === VoteEntityType.DISCUSSION ? ActivityEntityType.DISCUSSION : ActivityEntityType.COMMENT;

          // Record the activity
          await this.recordActivity(data.userId, activityType, activityEntityType, data.entityId, {
            voteValue: data.voteValue,
            discussionId: data.discussionId,
            recepentId: data.recipientId,
            action: data.voteAction,
          });
        } catch (error) {
          this.logger.error(`Error processing vote updated event for analytics: ${error.message}`);
        }
      })
      .catch((error) => {
        this.logger.error(`Failed to subscribe to vote events in analytics: ${error.message}`);
      });
  }

  // ----- Activity Recording Methods -----

  async recordActivity(
    userId: number,
    type: ActivityType,
    entityType: ActivityEntityType,
    entityId: number,
    metadata: Record<string, any> = {},
    request?: Request,
  ): Promise<UserActivity | null> {
    try {
      const activity = this.userActivityRepository.create({
        type,
        entityType,
        entityId,
        userId,
        metadata,
        ipAddress: request?.ip,
        userAgent: request?.headers['user-agent'],
      });

      return await this.userActivityRepository.save(activity);
    } catch (error) {
      this.logger.error(`Failed to record user activity: ${error.message}`, error.stack);
      // Non-blocking - we don't want activity logging to prevent main operations
      return null;
    }
  }

  async recordMultipleActivities(
    activities: {
      type: ActivityType;
      entityType: ActivityEntityType;
      entityId: number;
      userId: number;
      metadata?: Record<string, any>;
    }[],
    request?: Request,
  ): Promise<UserActivity[]> {
    const activityEntities = activities.map((activity) =>
      this.userActivityRepository.create({
        ...activity,
        ipAddress: request?.ip,
        userAgent: request?.headers['user-agent'],
      }),
    );

    return await this.userActivityRepository.save(activityEntities);
  }

  // ----- Analytics Query Methods -----

  async searchActivities(searchDto: SearchActivityDto): Promise<Pageable<UserActivity>> {
    try {
      const { page, limit } = searchDto;
      const offset = (page - 1) * limit;

      const queryBuilder = this.buildActivitySearchQuery(searchDto, offset, limit);
      const [activities, totalItems] = await queryBuilder.getManyAndCount();

      return this.createPaginatedResponse(activities, totalItems, page, limit);
    } catch (error) {
      this.logger.error(`Error searching activities: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getMostActiveUsers(
    timeframeStart: Date,
    limit: number = 10,
  ): Promise<{ userId: number; activityCount: number }[]> {
    const result = await this.userActivityRepository
      .createQueryBuilder('activity')
      .select('activity.userId', 'userId')
      .addSelect('COUNT(activity.id)', 'activityCount')
      .where('activity.createdAt >= :timeframeStart', { timeframeStart })
      .groupBy('activity.userId')
      .orderBy('COUNT(activity.id)', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((item) => ({
      userId: Number(item.userId),
      activityCount: Number(item.activityCount),
    }));
  }

  async getActivityCountsByType(timeframeStart: Date): Promise<Record<ActivityType, number>> {
    const result = await this.userActivityRepository
      .createQueryBuilder('activity')
      .select('activity.type', 'type')
      .addSelect('COUNT(activity.id)', 'count')
      .where('activity.createdAt >= :timeframeStart', { timeframeStart })
      .groupBy('activity.type')
      .getRawMany();

    // Initialize with all activity types set to 0
    const countsByType = Object.values(ActivityType).reduce(
      (acc, type) => {
        acc[type] = 0;
        return acc;
      },
      {} as Record<ActivityType, number>,
    );

    // Update with actual counts
    result.forEach((item) => {
      countsByType[item.type] = Number(item.count);
    });

    return countsByType;
  }

  // ----- User Engagement Methods -----

  async getUserEngagementScore(userId: number, days: number = 30): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activityCounts = await this.userActivityRepository
      .createQueryBuilder('activity')
      .select('activity.type', 'type')
      .addSelect('COUNT(activity.id)', 'count')
      .where('activity.userId = :userId', { userId })
      .andWhere('activity.createdAt >= :startDate', { startDate })
      .groupBy('activity.type')
      .getRawMany();

    // Define weights for different activities
    const weights = {
      [ActivityType.CREATE_DISCUSSION]: 5,
      [ActivityType.CREATE_COMMENT]: 3,
      [ActivityType.VOTE_DISCUSSION]: 0.5,
      [ActivityType.VOTE_COMMENT]: 0.3,
      [ActivityType.BOOKMARK_DISCUSSION]: 1,
      [ActivityType.FOLLOW_SPACE]: 1,
      [ActivityType.UNFOLLOW_SPACE]: -1,
      [ActivityType.REPORT_CONTENT]: 3,
      [ActivityType.EDIT_DISCUSSION]: 2,
      [ActivityType.EDIT_COMMENT]: 1,
      [ActivityType.DELETE_DISCUSSION]: -3,
      [ActivityType.DELETE_COMMENT]: -2,
    };

    // Calculate weighted score
    let score = 0;
    for (const activity of activityCounts) {
      const type = activity.type as ActivityType;
      const count = Number(activity.count);
      score += (weights[type] || 0.1) * count;
    }

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  // ----- Helper Methods -----

  private buildActivitySearchQuery(
    searchDto: SearchActivityDto,
    offset: number,
    limit: number,
  ): SelectQueryBuilder<UserActivity> {
    const { sortBy = ActivitySortBy.createdAt, sortOrder = 'DESC' } = searchDto;

    const queryBuilder = this.userActivityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .orderBy(`activity.${sortBy}`, sortOrder)
      .skip(offset)
      .take(limit);

    // Apply filters
    this.applyActivityFilters(queryBuilder, searchDto);

    return queryBuilder;
  }

  private applyActivityFilters(queryBuilder: SelectQueryBuilder<UserActivity>, searchDto: SearchActivityDto): void {
    if (searchDto.userId) {
      queryBuilder.andWhere('activity.userId = :userId', { userId: searchDto.userId });
    }

    if (searchDto.types && searchDto.types.length > 0) {
      queryBuilder.andWhere('activity.type IN (:...types)', { types: searchDto.types });
    }

    if (searchDto.entityType) {
      queryBuilder.andWhere('activity.entityType = :entityType', { entityType: searchDto.entityType });
    }

    if (searchDto.entityId) {
      queryBuilder.andWhere('activity.entityId = :entityId', { entityId: searchDto.entityId });
    }

    if (searchDto.startDate && searchDto.endDate) {
      queryBuilder.andWhere('activity.createdAt BETWEEN :startDate AND :endDate', {
        startDate: searchDto.startDate,
        endDate: searchDto.endDate,
      });
    } else if (searchDto.startDate) {
      queryBuilder.andWhere('activity.createdAt >= :startDate', { startDate: searchDto.startDate });
    } else if (searchDto.endDate) {
      queryBuilder.andWhere('activity.createdAt <= :endDate', { endDate: searchDto.endDate });
    }

    if (searchDto.ipAddress) {
      queryBuilder.andWhere('activity.ipAddress = :ipAddress', { ipAddress: searchDto.ipAddress });
    }
  }

  private createPaginatedResponse<T>(items: T[], totalItems: number, page: number, limit: number): Pageable<T> {
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      meta: {
        totalItems,
        itemsPerPage: limit,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
