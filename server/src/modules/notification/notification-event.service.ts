import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { isCommentCreatedEvent } from 'src/core/redis/redis.interface';
import { RedisChannels } from '../../core/redis/redis.constants';
import { RedisService } from '../../core/redis/redis.service';
import { CommentService } from '../comment/comment.service';
import { DiscussionService } from '../discussion/discussion.service';
import { VoteEntityType, VoteValue } from '../vote/entities/vote.entity';
import { NotificationEntityType, NotificationType } from './entities/notification.entity';
import { NewCommentNotificationData, NewReplyNotificationData } from './interfaces/notification.interface';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationEventService implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
    private readonly commentService: CommentService,
    private readonly discussionService: DiscussionService,
  ) {}

  /**
   * Initialize the service and set up Redis subscriptions
   */
  async onModuleInit() {
    this.logger.log('Initializing NotificationEventService...');
    await this.initializeSubscriptions();
    this.logger.log('NotificationEventService initialized successfully.');
  }

  /**
   * Initialize Redis event subscriptions
   */
  async initializeSubscriptions() {
    this.subscribeToCommentEvents();
    // this.subscribeToVoteEvents();
    // this.subscribeToMentionEvents();
  }

  /**
   * Subscribe to comment created events
   */
  private async subscribeToCommentEvents() {
    this.redisService
      .subscribe(RedisChannels.COMMENT_CREATED, async (message) => {
        try {
          const data = JSON.parse(message);

          // Validate event using type guard
          if (!isCommentCreatedEvent(data)) {
            this.logger.warn('Invalid comment event data received');
            return;
          }

          const { commentId, discussionId, authorId, content, parentId } = data;
          const discussion = await this.discussionService.getDiscussionEntity(discussionId);
          const discussionPreview = this.truncateContent(discussion.content, 50);
          const contentPreview = this.truncateContent(content, 100);

          if (parentId) {
            // This is a reply to another comment
            const parentComment = await this.commentService.getCommentEntity(parentId);

            if (parentComment && parentComment.authorId !== authorId) {
              // Generate typed notification data
              const notificationData: NewReplyNotificationData = {
                discussionId,
                parentCommentId: parentComment.id,
                replyId: commentId,
                parentCommentPreview: this.truncateContent(parentComment.content, 100),
                contentPreview,
                url: `/discussions/${discussionId}?comment=${commentId}`,
              };

              // Create notification
              await this.notificationService.createNotificationIfNotExists(
                {
                  recipientId: parentComment.authorId,
                  actorId: authorId,
                  type: NotificationType.NEW_REPLY,
                  entityType: NotificationEntityType.COMMENT,
                  entityId: commentId,
                  data: notificationData,
                },
                5,
              );
            }
          } else {
            // Comment on a discussion
            if (discussion.authorId !== authorId) {
              // Generate typed notification data
              const notificationData: NewCommentNotificationData = {
                discussionId,
                commentId,
                discussionPreview,
                contentPreview,
                url: `/discussions/${discussionId}?comment=${commentId}`,
              };

              // Create notification
              await this.notificationService.createNotificationIfNotExists(
                {
                  recipientId: discussion.authorId,
                  actorId: authorId,
                  type: NotificationType.NEW_COMMENT,
                  entityType: NotificationEntityType.COMMENT,
                  entityId: commentId,
                  data: notificationData,
                },
                5,
              );
            }
          }
        } catch (error) {
          this.logger.error(`Error processing comment notification: ${error.message}`, error.stack);
        }
      })
      .catch((error) => {
        this.logger.error(`Failed to subscribe to comment events: ${error.message}`);
      });
  }

  // /**
  //  * Subscribe to vote events
  //  */
  // private async subscribeToVoteEvents() {
  //   this.redisService
  //     .subscribe(RedisChannels.VOTE_UPDATED, async (message) => {
  //       try {
  //         const data = JSON.parse(message);

  //         // Only process upvotes for users who aren't voting on their own content
  //         if (!data.shouldNotify || data.voteValue !== VoteValue.UPVOTE || data.userId === data.recipientId) {
  //           return;
  //         }

  //         // Define the notification type based on entity
  //         const notificationType =
  //           data.entityType === VoteEntityType.DISCUSSION
  //             ? NotificationType.DISCUSSION_UPVOTE
  //             : NotificationType.COMMENT_UPVOTE;

  //         const entityType =
  //           data.entityType === VoteEntityType.DISCUSSION
  //             ? NotificationEntityType.DISCUSSION
  //             : NotificationEntityType.COMMENT;

  //         // Build the appropriate notification data based on entity type
  //         let notificationData;

  //         if (data.entityType === VoteEntityType.DISCUSSION) {
  //           const discussion = await this.discussionService.getDiscussionEntity(data.entityId);
  //           notificationData = this.notificationFactoryService.createDiscussionUpvoteData(
  //             data.entityId,
  //             this.truncateContent(discussion.content, 100),
  //             data.upvoteCount || 1,
  //           );
  //         } else {
  //           const comment = await this.commentService.getCommentEntity(data.entityId);
  //           notificationData = this.notificationFactoryService.createCommentUpvoteData(
  //             data.entityId,
  //             comment.discussionId,
  //             this.truncateContent(comment.content, 100),
  //             data.upvoteCount || 1,
  //           );
  //         }

  //         // Create the notification
  //         await this.notificationService.createNotificationIfNotExists(
  //           {
  //             recipientId: data.recipientId,
  //             actorId: data.userId,
  //             type: notificationType,
  //             entityType,
  //             entityId: data.entityId,
  //             data: notificationData,
  //             clientRequestTime: data.clientRequestTime,
  //           },
  //           60, // Deduplicate within 1 hour window
  //         );
  //       } catch (error) {
  //         this.logger.error(`Error processing vote notification: ${error.message}`, error.stack);
  //       }
  //     })
  //     .catch((error) => {
  //       this.logger.error(`Failed to subscribe to vote events: ${error.message}`);
  //     });
  // }

  // /**
  //  * Subscribe to user mention events
  //  */
  // private async subscribeToMentionEvents() {
  //   this.redisService
  //     .subscribe(RedisChannels.USER_MENTIONED, async (message) => {
  //       try {
  //         const data = JSON.parse(message);
  //         const { userIds, authorId, commentId, discussionId, content } = data;

  //         // Skip if no users to notify
  //         if (!userIds?.length) return;

  //         const commentPreview = this.truncateContent(content, 100);

  //         // Create typed notification data
  //         const notificationData = this.notificationFactoryService.createUserMentionedData(
  //           commentId,
  //           discussionId,
  //           commentPreview,
  //           false,
  //         );

  //         // Create batch notifications
  //         await this.notificationService.createBatchNotifications({
  //           recipientIds: userIds,
  //           actorId: authorId,
  //           type: NotificationType.USER_MENTIONED,
  //           entityType: NotificationEntityType.COMMENT,
  //           entityId: commentId,
  //           data: notificationData,
  //         });
  //       } catch (error) {
  //         this.logger.error(`Error processing mention notification: ${error.message}`, error.stack);
  //       }
  //     })
  //     .catch((error) => {
  //       this.logger.error(`Failed to subscribe to mention events: ${error.message}`);
  //     });
  // }

  /**
   * Helper method to truncate text content
   */
  private truncateContent(content: string, maxLength: number): string {
    if (!content) return '';
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  }
}
