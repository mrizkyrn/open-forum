import { discussionApi } from '@/features/discussions/services';
import { DiscussionSortBy } from '@/features/discussions/types';
import { SortOrder } from '@/types/SearchTypes';
import { useInfiniteQuery } from '@tanstack/react-query';

interface UseInfiniteDiscussionsOptions {
  limit?: number;
  tags?: string[];
  search?: string;
  sortBy?: DiscussionSortBy;
  sortOrder?: SortOrder;
  authorId?: number;
  spaceId?: number;
  isAnonymous?: boolean;
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
  } = options;

  return useInfiniteQuery({
    queryKey: ['discussions', { limit, tags, spaceId, search, sortBy, sortOrder, authorId, isAnonymous }],
    queryFn: async ({ pageParam = 1 }) => {
      return await discussionApi.getDiscussions({
        page: pageParam,
        limit,
        tags,
        spaceId,
        search,
        sortBy,
        sortOrder,
        authorId,
        isAnonymous,
      });
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
