import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { isCommentCreatedEvent, isVoteUpdatedEvent } from 'src/core/redis/redis.interface';
import { RedisChannels } from '../../core/redis/redis.constants';
import { RedisService } from '../../core/redis/redis.service';
import { VoteEntityType } from '../vote/entities/vote.entity';
import { AnalyticService } from './analytic.service';
import { ActivityEntityType, ActivityType } from './entities/user-activity.entity';

@Injectable()
export class AnalyticEventService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticEventService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly analyticService: AnalyticService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing AnalyticEventService...');
    await this.initializeSubscriptions();
    this.logger.log('AnalyticEventService initialized successfully.');
  }

  /**
   * Initialize Redis event subscriptions
   */
  async initializeSubscriptions() {
    this.subscribeToDiscussionEvents();
    this.subscribeToCommentEvents();
    this.subscribeToVoteEvents();
  }

  /**
   * Subscribe to discussion creation events
   */
  private subscribeToDiscussionEvents() {
    this.redisService
      .subscribe(RedisChannels.DISCUSSION_CREATED, async (message) => {
        try {
          const data = JSON.parse(message);

          // Record the activity
          await this.analyticService.recordActivity(
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
  }

  /**
   * Subscribe to comment creation events
   */
  private subscribeToCommentEvents() {
    this.redisService
      .subscribe(RedisChannels.COMMENT_CREATED, async (message) => {
        try {
          const data = JSON.parse(message);

          // Validate event using type guard
          if (!isCommentCreatedEvent(data)) {
            this.logger.warn('Invalid comment event data received');
            return;
          }

          // Record the activity
          await this.analyticService.recordActivity(
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
              isReply: !!data.parentId,
            },
          );
        } catch (error) {
          this.logger.error(`Error processing comment created event for analytics: ${error.message}`);
        }
      })
      .catch((error) => {
        this.logger.error(`Failed to subscribe to comment events in analytics: ${error.message}`);
      });
  }

  /**
   * Subscribe to vote update events
   */
  private subscribeToVoteEvents() {
    this.redisService
      .subscribe(RedisChannels.VOTE_UPDATED, async (message) => {
        try {
          const data = JSON.parse(message);

          // Validate event using type guard
          if (!isVoteUpdatedEvent(data)) {
            this.logger.warn('Invalid vote event data received');
            return;
          }

          const activityType =
            data.entityType === VoteEntityType.DISCUSSION ? ActivityType.VOTE_DISCUSSION : ActivityType.VOTE_COMMENT;
          const activityEntityType =
            data.entityType === VoteEntityType.DISCUSSION ? ActivityEntityType.DISCUSSION : ActivityEntityType.COMMENT;

          // Record the activity
          await this.analyticService.recordActivity(data.userId, activityType, activityEntityType, data.entityId, {
            voteValue: data.voteValue,
            discussionId: data.discussionId,
            recipientId: data.recipientId,
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
}
