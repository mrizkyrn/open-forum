import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { isCommentCreatedEvent, isReportReviewedEvent, isVoteUpdatedEvent } from 'src/core/redis/redis.interface';
import { RedisChannels } from '../../core/redis/redis.constants';
import { RedisService } from '../../core/redis/redis.service';
import { CommentService } from '../comment/comment.service';
import { DiscussionService } from '../discussion/discussion.service';
import { VoteEntityType, VoteValue } from '../vote/entities/vote.entity';
import { NotificationEntityType, NotificationType } from './entities/notification.entity';
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
    this.subscribeToVoteEvents();
    this.subscribeToMentionEvents();
    this.subscribeToReportEvents();
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
          const contentPreview = this.truncateContent(content, 75);

          if (parentId) {
            // This is a reply to another comment
            const parentComment = await this.commentService.getCommentEntity(parentId);

            if (parentComment && parentComment.authorId !== authorId) {
              await this.notificationService.createNotificationIfNotExists(
                {
                  recipientId: parentComment.authorId,
                  actorId: authorId,
                  type: NotificationType.NEW_REPLY,
                  entityType: NotificationEntityType.COMMENT,
                  entityId: commentId,
                  data: {
                    discussionId,
                    parentCommentId: parentComment.id,
                    replyId: commentId,
                    contentPreview: this.truncateContent(content, 75),
                    url: `/discussions/${discussionId}?comment=${commentId}`,
                  },
                },
                5,
              );
            }
          } else {
            // Comment on a discussion
            if (discussion.authorId !== authorId) {
              await this.notificationService.createNotificationIfNotExists(
                {
                  recipientId: discussion.authorId,
                  actorId: authorId,
                  type: NotificationType.NEW_COMMENT,
                  entityType: NotificationEntityType.COMMENT,
                  entityId: commentId,
                  data: {
                    discussionId,
                    commentId,
                    contentPreview,
                    url: `/discussions/${discussionId}?comment=${commentId}`,
                  },
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

  /**
   * Subscribe to vote updated events
   */
  private async subscribeToVoteEvents() {
    this.redisService
      .subscribe(RedisChannels.VOTE_UPDATED, async (message) => {
        try {
          const data = JSON.parse(message);

          // Validate event using type guard
          if (!isVoteUpdatedEvent(data)) {
            this.logger.warn('Invalid vote event data received');
            return;
          }

          // Only notify for upvotes and when recipient isn't the voter
          if (!data.shouldNotify || data.voteValue !== VoteValue.UPVOTE || data.userId === data.recipientId) {
            return;
          }

          // Define notification types based on entity
          const notificationType =
            data.entityType === VoteEntityType.DISCUSSION
              ? NotificationType.DISCUSSION_UPVOTE
              : NotificationType.COMMENT_UPVOTE;

          const notificationEntityType =
            data.entityType === VoteEntityType.DISCUSSION
              ? NotificationEntityType.DISCUSSION
              : NotificationEntityType.COMMENT;

          // Prepare notification data
          const notificationData: Record<string, any> = {};

          // Add entity-specific data
          if (data.entityType === VoteEntityType.DISCUSSION) {
            // For discussions, just include the discussion ID
            notificationData.discussionId = data.entityId;
            notificationData.url = `/discussions/${data.entityId}`;

            // Optionally fetch the discussion to include content preview
            try {
              const discussion = await this.discussionService.getDiscussionEntity(data.entityId);
              if (discussion?.content) {
                notificationData.contentPreview = this.truncateContent(discussion.content, 75);
              }
            } catch (discussionError) {
              this.logger.warn(
                `Could not fetch discussion ${data.entityId} for notification: ${discussionError.message}`,
              );
            }
          } else {
            // For comments, include both comment and discussion IDs
            notificationData.commentId = data.entityId;
            notificationData.discussionId = data.discussionId;
            notificationData.url = `/discussions/${data.discussionId}?comment=${data.entityId}`;

            // Fetch the comment to include content preview
            try {
              const comment = await this.commentService.getCommentEntity(data.entityId);
              if (comment?.content) {
                notificationData.contentPreview = this.truncateContent(comment.content, 75);
              }
            } catch (commentError) {
              this.logger.warn(`Could not fetch comment ${data.entityId} for notification: ${commentError.message}`);
            }
          }

          // Create the notification
          await this.notificationService.createNotificationIfNotExists(
            {
              recipientId: data.recipientId,
              actorId: data.userId,
              type: notificationType,
              entityType: notificationEntityType,
              entityId: data.entityId,
              data: notificationData,
            },
            60, // Deduplicate within 1 hour window
          );
        } catch (error) {
          this.logger.error(`Error processing vote notification: ${error.message}`, error.stack);
        }
      })
      .catch((error) => {
        this.logger.error(`Failed to subscribe to vote events: ${error.message}`);
      });
  }

  /**
   * Subscribe to user mention events
   */
  private async subscribeToMentionEvents() {
    this.redisService
      .subscribe(RedisChannels.USER_MENTIONED, async (message) => {
        try {
          const data = JSON.parse(message);

          // Create notification for each mentioned user
          await this.notificationService.createBatchNotifications(
            {
              recipientIds: data.userIds,
              actorId: data.authorId,
              type: NotificationType.USER_MENTIONED,
              entityType: NotificationEntityType.COMMENT,
              entityId: data.commentId,
              data: {
                discussionId: data.discussionId,
                commentId: data.commentId,
                contentPreview: this.truncateContent(data.content, 75),
                url: `/discussions/${data.discussionId}?comment=${data.commentId}`,
              },
            },
            undefined, // No transaction needed here
          );
        } catch (error) {
          this.logger.error(`Error processing mention notification: ${error.message}`, error.stack);
        }
      })
      .catch((error) => {
        this.logger.error(`Failed to subscribe to mention events: ${error.message}`);
      });
  }

  /**
   * Subscribe to report handling events
   */
  private async subscribeToReportEvents() {
    this.redisService
      .subscribe(RedisChannels.REPORT_REVIEWED, async (message) => {
        try {
          const data = JSON.parse(message);

          // Validate event using type guard
          if (!isReportReviewedEvent(data)) {
            this.logger.warn('Invalid report event data received');
            return;
          }

          const notifications: Promise<any>[] = [];

          // 1. Notify content author if requested and if we have their ID
          if (data.targetAuthorId && data.notifyAuthor) {
            const authorMessage = this.getReportAuthorMessage(data.isContentDeleted, data.targetType);

            notifications.push(
              this.notificationService.createNotificationIfNotExists(
                {
                  recipientId: data.targetAuthorId,
                  actorId: data.reviewerId,
                  type: NotificationType.REPORT_REVIEWED,
                  entityType: NotificationEntityType.REPORT,
                  entityId: data.reportId,
                  data: {
                    reportId: data.reportId,
                    discussionId: data.discussionId,
                    status: data.reportStatus,
                    targetType: data.targetType,
                    targetId: data.targetId,
                    contentPreview: data.contentPreview,
                    isContentDeleted: data.isContentDeleted,
                    note: data.note,
                    reasonText: data.reasonText,
                    message: authorMessage,
                    recipientType: 'content_author',
                    url: data.discussionId ? `/discussions/${data.discussionId}` : '/notifications',
                  },
                },
                10, // 10-minute deduplication window
              ),
            );
          }

          // 2. Notify reporter if requested and not the same as author
          if (data.notifyReporter && data.reporterId !== data.targetAuthorId) {
            const reporterMessage = this.getReportReporterMessage(data.isContentDeleted);

            notifications.push(
              this.notificationService.createNotificationIfNotExists(
                {
                  recipientId: data.reporterId,
                  actorId: data.reviewerId,
                  type: NotificationType.REPORT_REVIEWED,
                  entityType: NotificationEntityType.REPORT,
                  entityId: data.reportId,
                  data: {
                    reportId: data.reportId,
                    discussionId: data.discussionId,
                    status: data.reportStatus,
                    targetType: data.targetType,
                    targetId: data.targetId,
                    contentPreview: data.contentPreview,
                    isContentDeleted: data.isContentDeleted,
                    note: data.note,
                    reasonText: data.reasonText,
                    message: reporterMessage,
                    recipientType: 'reporter',
                    url: data.discussionId ? `/discussions/${data.discussionId}` : '/notifications',
                  },
                },
                10, // 10-minute deduplication window
              ),
            );
          }

          // Execute all notification promises in parallel
          if (notifications.length > 0) {
            await Promise.all(notifications);
          }
        } catch (error) {
          this.logger.error(`Error processing report notification: ${error.message}`, error.stack);
        }
      })
      .catch((error) => {
        this.logger.error(`Failed to subscribe to report events: ${error.message}`);
      });
  }

  /**
   * Helper method to truncate text content
   */
  private truncateContent(content: string, maxLength: number): string {
    if (!content) return '';
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  }

  private getReportAuthorMessage(isContentDeleted: boolean, contentType: string): string {
    return isContentDeleted
      ? `Your ${contentType} has been removed for violating our community guidelines.`
      : `Your ${contentType} was reported and has been reviewed by our moderators.`;
  }

  private getReportReporterMessage(isContentDeleted: boolean): string {
    return isContentDeleted
      ? 'Thank you for your report. The content has been removed.'
      : 'Your report has been reviewed.';
  }
}
