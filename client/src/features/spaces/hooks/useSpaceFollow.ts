import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { spaceApi } from '../services';

export const useSpaceFollow = () => {
  const queryClient = useQueryClient();
  const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({});

  const followMutation = useMutation({
    mutationFn: (spaceId: number) => spaceApi.followSpace(spaceId),
    onMutate: async (spaceId) => {
      // Set optimistic update state
      setFollowingMap((prev) => ({ ...prev, [spaceId]: true }));

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['spaces'] });
      await queryClient.cancelQueries({ queryKey: ['space', spaceId] });
      await queryClient.cancelQueries({ queryKey: ['popularSpaces'] });

      // Snapshot the previous value
      const previousSpaces = queryClient.getQueryData(['spaces']);

      // Optimistically update spaces list
      queryClient.setQueryData(['spaces'], (old: any) => {
        if (!old || !old.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((space: any) =>
              space.id === spaceId ? { ...space, isFollowing: true, followerCount: space.followerCount + 1 } : space,
            ),
          })),
        };
      });

      // Optimistically update single space
      queryClient.setQueryData(['space', spaceId], (old: any) => {
        if (!old) return old;
        return { ...old, isFollowing: true, followerCount: old.followerCount + 1 };
      });

      return { previousSpaces };
    },
    onSuccess: (_, spaceId) => {
      // Clear loading state
      setFollowingMap((prev) => ({ ...prev, [spaceId]: false }));

      // Update cache for the single space query
      queryClient.invalidateQueries({ queryKey: ['space', spaceId] });

      // Show success message
      toast.success('Space followed successfully');
    },
    onError: (error, spaceId, context) => {
      // Clear loading state
      setFollowingMap((prev) => ({ ...prev, [spaceId]: false }));

      // Revert optimistic updates
      if (context?.previousSpaces) {
        queryClient.setQueryData(['spaces'], context.previousSpaces);
      }

      // Show error message
      toast.error('Failed to follow space');
      console.error(error);
    },
    onSettled: () => {
      // Invalidate queries to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['space'] });
      queryClient.invalidateQueries({ queryKey: ['popularSpaces'] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (spaceId: number) => spaceApi.unfollowSpace(spaceId),
    onMutate: async (spaceId) => {
      // Set optimistic update state
      setFollowingMap((prev) => ({ ...prev, [spaceId]: true }));

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['spaces'] });
      await queryClient.cancelQueries({ queryKey: ['space', spaceId] });
      await queryClient.cancelQueries({ queryKey: ['popularSpaces'] });

      // Snapshot the previous value
      const previousSpaces = queryClient.getQueryData(['spaces']);

      // Optimistically update spaces list
      queryClient.setQueryData(['spaces'], (old: any) => {
        if (!old || !old.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((space: any) =>
              space.id === spaceId
                ? { ...space, isFollowing: false, followerCount: Math.max(0, space.followerCount - 1) }
                : space,
            ),
          })),
        };
      });

      // Optimistically update single space
      queryClient.setQueryData(['space', spaceId], (old: any) => {
        if (!old) return old;
        return { ...old, isFollowing: false, followerCount: Math.max(0, old.followerCount - 1) };
      });

      return { previousSpaces };
    },
    onSuccess: (_, spaceId) => {
      // Clear loading state
      setFollowingMap((prev) => ({ ...prev, [spaceId]: false }));

      // Update cache for the single space query
      queryClient.invalidateQueries({ queryKey: ['space', spaceId] });

      // Show success message
      toast.success('Space unfollowed');
    },
    onError: (error, spaceId, context) => {
      // Clear loading state
      setFollowingMap((prev) => ({ ...prev, [spaceId]: false }));

      // Revert optimistic updates
      if (context?.previousSpaces) {
        queryClient.setQueryData(['spaces'], context.previousSpaces);
      }

      // Show error message
      toast.error('Failed to unfollow space');
      console.error(error);
    },
    onSettled: () => {
      // Invalidate queries to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['space'] });
      queryClient.invalidateQueries({ queryKey: ['popularSpaces'] });
    },
  });

  return {
    followSpace: followMutation.mutate,
    unfollowSpace: unfollowMutation.mutate,
    isLoading: followMutation.isPending || unfollowMutation.isPending,
    followingMap, // Track which spaces have pending follow/unfollow operations
  };
};
