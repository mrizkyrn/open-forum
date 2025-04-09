import { User } from '@/features/users/types';
import { Attachment } from '@/types/AttachmentTypes';
import { SearchDto } from '@/types/SearchTypes';

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

export interface CreateDiscussionDto {
  content: string;
  isAnonymous: boolean;
  tags: string[];
  files?: File[];
  spaceId: number;
}

export interface UpdateDiscussionDto {
  content?: string;
  isAnonymous?: boolean;
  tags?: string[];
  files?: File[];
  attachmentsToRemove: number[];
}

export enum DiscussionSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  commentCount = 'commentCount',
  voteCount = 'voteCount',
}

export interface SearchDiscussionDto extends SearchDto {
  tags?: string[];
  sortBy?: DiscussionSortBy;
  authorId?: number;
  isAnonymous?: boolean;
  spaceId?: number;
  onlyFollowedSpaces?: boolean;
}
