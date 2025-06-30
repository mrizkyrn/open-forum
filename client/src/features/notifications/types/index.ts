// ===== CORE ENTITIES =====

import { PaginationParams } from '@/shared/types/RequestTypes';

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

export interface NotificationActor {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

// ===== REQUEST TYPES =====

export interface MarkNotificationsReadRequest {
  ids: number[];
}

// ===== RESPONSE TYPES =====

export interface NotificationCountResponse {
  count: number;
}

// ===== QUERY PARAMETERS =====

export interface NotificationQueryParams extends PaginationParams {
  isRead?: boolean;
}

// ===== ENUMS =====

export enum NotificationType {
  NEW_COMMENT = 'new_comment',
  NEW_DISCUSSION = 'new_discussion',
  NEW_REPLY = 'new_reply',
  DISCUSSION_UPVOTE = 'discussion_upvote',
  COMMENT_UPVOTE = 'comment_upvote',
  REPORT_REVIEWED = 'report_reviewed',
  USER_MENTIONED = 'user_mentioned',
}

export enum NotificationEntityType {
  DISCUSSION = 'discussion',
  COMMENT = 'comment',
  REPORT = 'report',
  DISCUSSION_SPACE = 'discussion_space',
  USER = 'user',
}
