import { ReportStatus, ReportTargetType } from '../../report/entities/report.entity';
import { NotificationType } from '../entities/notification.entity';

/**
 * Base interface for all notification data types
 */
export interface BaseNotificationData {
  /** URL to navigate to when notification is clicked */
  url: string;
}

/**
 * Data for NEW_DISCUSSION notification type
 */
export interface NewDiscussionNotificationData extends BaseNotificationData {
  /** The discussion ID that was created */
  discussionId: number;
  /** The space ID the discussion was posted in */
  spaceId?: number;
  /** The title or preview of the discussion */
  contentPreview: string;
  /** Whether the discussion is anonymous */
  isAnonymous?: boolean;
}

/**
 * Data for NEW_COMMENT notification type
 */
export interface NewCommentNotificationData extends BaseNotificationData {
  /** The discussion ID the comment was posted on */
  discussionId: number;
  /** The comment ID that was created */
  commentId: number;
  /** The title or preview of the discussion */
  discussionPreview: string;
  /** Preview of the comment content */
  contentPreview: string;
}

/**
 * Data for NEW_REPLY notification type
 */
export interface NewReplyNotificationData extends BaseNotificationData {
  /** The discussion ID this reply belongs to */
  discussionId: number;
  /** The parent comment ID this reply responds to */
  parentCommentId: number;
  /** The reply comment ID */
  replyId: number;
  /** Preview of the parent comment */
  parentCommentPreview: string;
  /** Preview of the reply comment */
  contentPreview: string;
}

/**
 * Data for DISCUSSION_UPVOTE notification type
 */
export interface DiscussionUpvoteNotificationData extends BaseNotificationData {
  /** The discussion ID that was upvoted */
  discussionId: number;
  /** The discussion preview */
  discussionPreview: string;
  /** Current upvote count */
  upvoteCount: number;
}

/**
 * Data for COMMENT_UPVOTE notification type
 */
export interface CommentUpvoteNotificationData extends BaseNotificationData {
  /** The comment ID that was upvoted */
  commentId: number;
  /** The discussion ID the comment belongs to */
  discussionId: number;
  /** Preview of the comment content */
  commentPreview: string;
  /** Current upvote count */
  upvoteCount: number;
}

/**
 * Data for REPORT_REVIEWED notification type
 */
export interface ReportReviewedNotificationData extends BaseNotificationData {
  /** The report ID that was reviewed */
  reportId: number;
  /** The type of content that was reported */
  targetType: ReportTargetType;
  /** The ID of the reported content */
  targetId: number;
  /** The status decision (resolved/dismissed) */
  status: ReportStatus;
  /** Whether the reported content was removed */
  isContentDeleted: boolean;
}

/**
 * Data for USER_MENTIONED notification type
 */
export interface UserMentionedNotificationData extends BaseNotificationData {
  /** The comment ID where the mention occurred */
  commentId: number;
  /** The discussion ID the comment belongs to */
  discussionId: number;
  /** Preview of the comment with the mention */
  commentPreview: string;
  /** Whether the mention is in an anonymous comment */
  isAnonymous?: boolean;
}

/**
 * Union type of all notification data types
 */
export type NotificationData =
  | NewCommentNotificationData
  | NewDiscussionNotificationData
  | NewReplyNotificationData
  | DiscussionUpvoteNotificationData
  | CommentUpvoteNotificationData
  | ReportReviewedNotificationData
  | UserMentionedNotificationData;

/**
 * Type mapping from notification type to corresponding data type
 */
export type NotificationDataTypeMap = {
  [NotificationType.NEW_COMMENT]: NewCommentNotificationData;
  [NotificationType.NEW_DISCUSSION]: NewDiscussionNotificationData;
  [NotificationType.NEW_REPLY]: NewReplyNotificationData;
  [NotificationType.DISCUSSION_UPVOTE]: DiscussionUpvoteNotificationData;
  [NotificationType.COMMENT_UPVOTE]: CommentUpvoteNotificationData;
  [NotificationType.REPORT_REVIEWED]: ReportReviewedNotificationData;
  [NotificationType.USER_MENTIONED]: UserMentionedNotificationData;
};

/**
 * Helper function to validate notification data based on notification type
 */
export function validateNotificationData<T extends NotificationType>(
  type: T,
  data: any,
): data is NotificationDataTypeMap[T] {
  // Basic validation logic - can be extended with more detailed validation
  const requiredFields: Record<NotificationType, string[]> = {
    [NotificationType.NEW_COMMENT]: ['discussionId', 'commentId', 'url'],
    [NotificationType.NEW_DISCUSSION]: ['discussionId', 'url'],
    [NotificationType.NEW_REPLY]: ['discussionId', 'parentCommentId', 'replyId', 'url'],
    [NotificationType.DISCUSSION_UPVOTE]: ['discussionId', 'url'],
    [NotificationType.COMMENT_UPVOTE]: ['commentId', 'discussionId', 'url'],
    [NotificationType.REPORT_REVIEWED]: ['reportId', 'targetType', 'targetId', 'status', 'url'],
    [NotificationType.USER_MENTIONED]: ['commentId', 'discussionId', 'url'],
  };

  if (!data || typeof data !== 'object') return false;

  const fields = requiredFields[type];
  return fields.every((field) => field in data);
}
