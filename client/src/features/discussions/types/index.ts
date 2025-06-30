import { User } from '@/features/users/types';
import { Attachment } from '@/shared/types/AttachmentTypes';
import { BaseQueryParams } from '@/shared/types/RequestTypes';

// ===== CORE ENTITIES =====

export interface Discussion {
  id: number;
  content: string;
  isAnonymous: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  author?: User | null;
  space: {
    id: number;
    name: string;
    slug: string;
  };
  attachments: Attachment[];
  commentCount: number;
  upvoteCount: number;
  downvoteCount: number;
  isBookmarked?: boolean;
  voteStatus?: number | null;
}

// ===== REQUEST TYPES =====

export interface CreateDiscussionRequest {
  content: string;
  isAnonymous: boolean;
  tags: string[];
  files?: File[];
  spaceId: number;
}

export interface UpdateDiscussionRequest {
  content?: string;
  isAnonymous?: boolean;
  tags?: string[];
  files?: File[];
  attachmentsToRemove: number[];
}

// ===== RESPONSE TYPES =====

export interface PopularTagsResponse {
  tag: string;
  count: number;
}

// ===== QUERY PARAMETERS =====

export interface DiscussionQueryParams extends BaseQueryParams {
  tags?: string[];
  sortBy?: DiscussionSortBy;
  authorId?: number;
  isAnonymous?: boolean;
  spaceId?: number;
  onlyFollowedSpaces?: boolean;
}

// ===== ENUMS =====

export enum DiscussionSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  commentCount = 'commentCount',
  voteCount = 'voteCount',
}
