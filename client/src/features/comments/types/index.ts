import { User } from '@/features/users/types';
import { VoteValue } from '@/features/votes/services/voteApi';
import { Attachment } from '@/types/AttachmentTypes';
import { SearchDto } from '@/types/SearchTypes';

export interface Comment {
  id: number;
  content: string;
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
}

export interface CreateCommentDto {
  content: string;
  discussionId: number;
  parentId?: number | null;
}

export interface UpdateCommentDto {
  content: string;
  attachmentsToRemove: number[];
}

export enum CommentSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  upvoteCount = 'upvoteCount',
  replyCount = 'replyCount',
}

export interface SearchCommentDto extends SearchDto {
  sortBy: CommentSortBy;
}
