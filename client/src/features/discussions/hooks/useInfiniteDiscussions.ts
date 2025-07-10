import { discussionApi } from '@/features/discussions/services';
import { DiscussionQueryParams, DiscussionSortBy } from '@/features/discussions/types';
import { SortOrder } from '@/shared/types/RequestTypes';
import { useInfiniteQuery } from '@tanstack/react-query';

export type DiscussionFeedType = 'regular' | 'bookmarked' | 'space';

export interface UseInfiniteDiscussionsOptions extends Partial<DiscussionQueryParams> {
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
    onlyFollowedSpaces,
    feedType = 'regular',
  } = options;

  return useInfiniteQuery({
    queryKey: [
      'discussions',
      feedType,
      { limit, tags, spaceId, search, sortBy, sortOrder, authorId, isAnonymous, onlyFollowedSpaces },
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const params: DiscussionQueryParams = {
        page: pageParam,
        limit,
        tags,
        search,
        sortBy,
        sortOrder,
        authorId,
        spaceId,
        isAnonymous,
        onlyFollowedSpaces,
      };

      // Choose the right API method based on feedType
      if (feedType === 'bookmarked') {
        return await discussionApi.getBookmarkedDiscussions(params);
      }

      // Default to regular discussions
      return await discussionApi.getDiscussions(params);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.meta.hasPreviousPage ? firstPage.meta.currentPage - 1 : undefined;
    },
  });
}
