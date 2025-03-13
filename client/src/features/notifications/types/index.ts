/**
 * Types of notifications supported by the system
 */
export enum NotificationType {
  COMMENT_ON_DISCUSSION = 'comment_on_discussion',
  REPLY_TO_COMMENT = 'reply_to_comment',
  MENTION = 'mention',
  REPORT_STATUS_UPDATE = 'report_status_update',
  SPACE_FOLLOW = 'space_follow',
  CONTENT_MODERATION = 'content_moderation',
  DISCUSSION_UPVOTE = 'discussion_upvote',
  COMMENT_UPVOTE = 'comment_upvote',
}

/**
 * Types of entities that can be associated with notifications
 */
export enum NotificationEntityType {
  DISCUSSION = 'discussion',
  COMMENT = 'comment',
  REPORT = 'report',
  DISCUSSION_SPACE = 'discussion_space',
  USER = 'user',
}

/**
 * User who triggered the notification (actor)
 */
export interface NotificationActor {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

/**
 * Notification data structure from API
 */
export interface Notification {
  id: number;
  createdAt: string;
  type: NotificationType;
  entityType: NotificationEntityType;
  entityId: number;
  isRead: boolean;
  data: Record<string, any>;
  actor?: NotificationActor;
}

/**
 * Query parameters for fetching notifications
 */
export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

/**
 * Response for unread notification count
 */
export interface NotificationCountResponse {
  count: number;
}

/**
 * DTO for marking notifications as read
 */
export interface MarkNotificationsReadDto {
  ids: number[];
}