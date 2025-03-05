import { useInfiniteQuery } from '@tanstack/react-query';
import { discussionApi } from '@/features/discussions/services/discussionApi';

interface UseInfiniteDiscussionsOptions {
  limit?: number;
  tags?: string[];
  searchQuery?: string;
}

export function useInfiniteDiscussions(options: UseInfiniteDiscussionsOptions = {}) {
  const { limit = 5, tags, searchQuery } = options;

  return useInfiniteQuery({
    queryKey: ['discussions', 'infinite', { limit, tags, searchQuery }],
    queryFn: async ({ pageParam = 1 }) => {
      return await discussionApi.getDiscussions(pageParam, limit);
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
