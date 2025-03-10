export interface CreateDiscussionRequest {
  content: string;
  isAnonymous: boolean;
  tags?: string[];
}

export enum DiscussionSortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  commentCount = 'commentCount',
  upvoteCount = 'upvoteCount',
  downvoteCount = 'downvoteCount',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface SearchDiscussionDto {
  page: number;
  limit: number;
  search?: string;
  sortOrder: SortOrder;
  tags?: string[];
  sortBy: DiscussionSortBy;
  authorId?: number;
  isAnonymous?: boolean;
  spaceId?: number;
}
