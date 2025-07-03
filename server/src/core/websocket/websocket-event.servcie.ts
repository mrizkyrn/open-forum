import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { isCommentCreatedEvent, isVoteUpdatedEvent } from 'src/core/redis/redis.interface';
import { RedisChannels } from '../redis/redis.constants';
import { RedisService } from '../redis/redis.service';
import { WebsocketGateway } from './websocket.gateway';

@Injectable()
export class WebsocketEventService implements OnModuleInit {
  private readonly logger = new Logger(WebsocketEventService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing WebSocketEventService...');
    await this.initializeSubscriptions();
    this.logger.log('WebSocketEventService initialized successfully.');
  }

  /**
   * Initialize Redis event subscriptions
   */
  async initializeSubscriptions() {
    this.subscribeToDiscussionEvents();
    this.subscribeToCommentEvents();
  }

  /**
   * Subscribe to discussion creation events
   */
  private subscribeToDiscussionEvents() {
    this.redisService
      .subscribe(RedisChannels.DISCUSSION_CREATED, (message) => {
        try {
          const data = JSON.parse(message);

          // Notify all users
          this.websocketGateway.notifyNewDiscussion(data.authorId, data.discussionId);

          // Notify space users if it's in a specific space
          if (data.spaceId !== 1) {
            this.websocketGateway.notifyNewSpaceDiscussion(data.authorId, data.spaceId, data.discussionId);
          }
        } catch (error) {
          this.logger.error(`Error processing discussion created event: ${error.message}`);
        }
      })
      .catch((error) => {
        this.logger.error(`Failed to subscribe to discussion events: ${error.message}`);
      });
  }

  /**
   * Subscribe to comment creation events
   */
  private subscribeToCommentEvents() {
    this.redisService
      .subscribe(RedisChannels.COMMENT_CREATED, (message) => {
        try {
          const data = JSON.parse(message);

          // Validate event using type guard
          if (!isCommentCreatedEvent(data)) {
            return;
          }

          // Send real-time update to the discussion channel
          this.websocketGateway.notifyNewComment({
            id: data.commentId,
            discussionId: data.discussionId,
            parentId: data.parentId,
          });
        } catch (error) {
          this.logger.error(`Error processing comment created event: ${error.message}`);
        }
      })
      .catch((error) => {
        this.logger.error(`Failed to subscribe to comment events: ${error.message}`);
      });
  }
}
