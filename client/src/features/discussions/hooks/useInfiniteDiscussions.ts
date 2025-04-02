import { discussionApi } from '@/features/discussions/services';
import { DiscussionSortBy } from '@/features/discussions/types';
import { SortOrder } from '@/types/SearchTypes';
import { useInfiniteQuery } from '@tanstack/react-query';

export type DiscussionFeedType = 'regular' | 'bookmarked';

interface UseInfiniteDiscussionsOptions {
  limit?: number;
  tags?: string[];
  search?: string;
  sortBy?: DiscussionSortBy;
  sortOrder?: SortOrder;
  authorId?: number;
  spaceId?: number;
  isAnonymous?: boolean;
  feedType?: DiscussionFeedType;
}

export function useInfiniteDiscussions(options: UseInfiniteDiscussionsOptions = {}) {
  const {
    limit = 5,
    tags,
    search,
    sortBy = DiscussionSortBy.createdAt,
    sortOrder = SortOrder.DESC,
    authorId,
    spaceId,
    isAnonymous,
    feedType = 'regular',
  } = options;

  return useInfiniteQuery({
    queryKey: ['discussions', feedType, { limit, tags, spaceId, search, sortBy, sortOrder, authorId, isAnonymous }],
    queryFn: async ({ pageParam = 1 }) => {
      const params = { limit, tags, search, sortBy, sortOrder, authorId, spaceId, isAnonymous };
      const queryParams = { ...params, page: pageParam };
      
      // Choose the right API method based on feedType
      if (feedType === 'bookmarked') {
        return await discussionApi.getBookmarkedDiscussions(queryParams);
      }
      
      // Default to regular discussions
      return await discussionApi.getDiscussions(queryParams);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Return the next page number or undefined if no more pages
      return lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      // Return the previous page number or undefined if on first page
      return firstPage.meta.hasPreviousPage ? firstPage.meta.currentPage - 1 : undefined;
    },
  });
}
