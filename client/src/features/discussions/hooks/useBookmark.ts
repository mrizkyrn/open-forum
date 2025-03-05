import { useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionApi } from '@/features/discussions/services/discussionApi';
import { Discussion } from '@/features/discussions/types';

export function useBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      discussionId,
      isCurrentlyBookmarked,
    }: {
      discussionId: number | string;
      isCurrentlyBookmarked: boolean;
    }) => {
      if (isCurrentlyBookmarked) {
        await discussionApi.unbookmarkDiscussion(discussionId);
        return { isBookmarked: false };
      } else {
        await discussionApi.bookmarkDiscussion(discussionId);
        return { isBookmarked: true };
      }
    },

    // Optimistically update the UI
    onMutate: async ({ discussionId, isCurrentlyBookmarked }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['discussions'] });

      // Snapshot the previous value
      const previousDiscussions = queryClient.getQueryData(['discussions']);

      // Optimistically update the discussions list
      queryClient.setQueryData(['discussions'], (old: any) => {
        if (!old?.items) return old;

        return {
          ...old,
          items: old.items.map((discussion: Discussion) => {
            if (discussion.id !== discussionId) return discussion;

            return {
              ...discussion,
              isBookmarked: !isCurrentlyBookmarked,
            };
          }),
        };
      });

      // Also update single discussion if it's in cache
      queryClient.setQueryData(['discussion', discussionId], (oldData: Discussion | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          isBookmarked: !isCurrentlyBookmarked,
        };
      });

      return { previousDiscussions };
    },

    // If the mutation fails, roll back to the previous value
    onError: (error, _variables, context) => {
      if (context?.previousDiscussions) {
        queryClient.setQueryData(['discussions'], context.previousDiscussions);
      }
      console.error('Bookmark mutation failed:', error);
    },

    // Always refetch after error or success
    onSettled: (_data, _error, { discussionId }) => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      queryClient.invalidateQueries({ queryKey: ['discussion', discussionId] });
    },
  });
}
