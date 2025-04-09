/**
 * Types of notifications supported by the system
 */
export enum NotificationType {
  NEW_COMMENT = 'new_comment',
  NEW_DISCUSSION = 'new_discussion',
  NEW_REPLY = 'new_reply',
  DISCUSSION_UPVOTE = 'discussion_upvote',
  COMMENT_UPVOTE = 'comment_upvote',
  REPORT_REVIEWED = 'report_reviewed',
  USER_MENTIONED = 'user_mentioned',
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