import { User } from '@/features/users/types';
import { VoteValue } from '@/features/votes/services/voteApi';
import { Attachment } from '@/shared/types/AttachmentTypes';
import { BaseQueryParams } from '@/shared/types/RequestTypes';

// ===== CORE ENTITIES =====

export interface Comment {
  id: number;
  content: string | null;
  author: User;
  isEdited: boolean;
  discussionId: number;
  parentId: number | null;
  replies?: Comment[];
  replyCount: number;
  upvoteCount: number;
  downvoteCount: number;
  createdAt: Date;
  updatedAt: Date;
  attachments: Attachment[];
  voteStatus?: VoteValue | null;
  isDeleted?: boolean;
}

// ===== REQUEST TYPES =====

export interface CreateCommentRequest {
  content: string;
  parentId?: number | null;
  files?: File[];
}

export interface UpdateCommentRequest {
  content: string;
  attachmentsToRemove: number[];
  files?: File[];
}

// ===== QUERY PARAMETERS =====

export interface CommentQueryParams extends BaseQueryParams {
  sortBy?: CommentSortBy;
}

// ===== ENUMS =====

export enum CommentSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  upvoteCount = 'upvoteCount',
  replyCount = 'replyCount',
}
