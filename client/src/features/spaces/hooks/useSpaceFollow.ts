import { useMutation, useQueryClient } from '@tanstack/react-query';
import { spaceApi } from '../services/spaceApi';
import { toast } from 'react-toastify';

export function useSpaceFollow() {
  const queryClient = useQueryClient();

  // Helper function to update cache
  const updateSpaceInCache = (spaceId: number, isFollowing: boolean) => {
    queryClient.setQueriesData({ queryKey: ['space'] }, (oldData: any) => {
      if (!oldData || oldData.id !== spaceId) return oldData;

      return {
        ...oldData,
        isFollowing: isFollowing,
        followerCount: isFollowing ? oldData.followerCount + 1 : oldData.followerCount - 1,
      };
    });

    queryClient.setQueriesData({ queryKey: ['spaces'] }, (oldData: any) => {
      if (!oldData || !oldData.items) return oldData;

      return {
        ...oldData,
        items: oldData.items.map((space: any) =>
          space.id === spaceId
            ? {
                ...space,
                isFollowing: isFollowing,
                followerCount: isFollowing ? space.followerCount + 1 : space.followerCount - 1,
              }
            : space,
        ),
      };
    });
  };

  const followMutation = useMutation({
    mutationFn: (spaceId: number) => spaceApi.followSpace(spaceId),
    onMutate: async (spaceId) => {
      await queryClient.cancelQueries({ queryKey: ['space'] });

      const previousSpaces = queryClient.getQueryData(['spaces']);
      const previousSpace = queryClient.getQueryData(['space', spaceId]);

      updateSpaceInCache(spaceId, true);

      return { previousSpaces, previousSpace, spaceId };
    },
    onSuccess: () => {
      toast.success('You are now following this space');
    },
    onError: (_error, _spaceId, context) => {
      if (context?.previousSpace) {
        queryClient.setQueryData(['space', context.spaceId], context.previousSpace);
      }
      if (context?.previousSpaces) {
        queryClient.setQueryData(['spaces'], context.previousSpaces);
      }
      toast.error('Failed to follow space');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['space'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (spaceId: number) => spaceApi.unfollowSpace(spaceId),
    onMutate: async (spaceId) => {
      await queryClient.cancelQueries({ queryKey: ['space'] });

      const previousSpaces = queryClient.getQueryData(['spaces']);
      const previousSpace = queryClient.getQueryData(['space', spaceId]);

      updateSpaceInCache(spaceId, false);

      return { previousSpaces, previousSpace, spaceId };
    },
    onSuccess: () => {
      toast.success('You have unfollowed this space');
    },
    onError: (_error, _spaceId, context) => {
      if (context?.previousSpace) {
        queryClient.setQueryData(['space', context.spaceId], context.previousSpace);
      }
      if (context?.previousSpaces) {
        queryClient.setQueryData(['spaces'], context.previousSpaces);
      }
      toast.error('Failed to unfollow space');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['space'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });

  return {
    followSpace: followMutation.mutate,
    unfollowSpace: unfollowMutation.mutate,
    isLoading: followMutation.isPending || unfollowMutation.isPending,
  };
}
