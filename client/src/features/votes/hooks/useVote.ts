import { voteApi, VoteValue } from '@/features/votes/services/voteApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface UseVoteProps {
  entityId: number;
  entityType: 'discussion' | 'comment';
  initialUpvotes: number;
  initialDownvotes: number;
  initialVoteStatus?: number | null;
  onVoteChange?: () => void;
}

export const useVote = ({
  entityId,
  entityType,
  initialUpvotes,
  initialDownvotes,
  initialVoteStatus = null,
  onVoteChange,
}: UseVoteProps) => {
  const [upvoteCount, setUpvoteCount] = useState(initialUpvotes);
  const [downvoteCount, setDownvoteCount] = useState(initialDownvotes);
  const [voteStatus, setVoteStatus] = useState<number | null | undefined>(initialVoteStatus);
  const queryClient = useQueryClient();

  const voteCount = upvoteCount - downvoteCount;

  const voteMutation = useMutation({
    mutationFn: ({ value }: { value: VoteValue }) =>
      entityType === 'discussion' ? voteApi.voteDiscussion(entityId, value) : voteApi.voteComment(entityId, value),

    onMutate: async ({ value }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [entityType + 's', entityId] });
      await queryClient.cancelQueries({ queryKey: ['votes', entityType, entityId] });

      const previousVoteStatus = voteStatus;
      let newUpvoteCount = upvoteCount;
      let newDownvoteCount = downvoteCount;
      let newVoteStatus: number | null = value;

      // Calculate new counts based on the voting action
      if (previousVoteStatus === value) {
        if (value === 1) newUpvoteCount -= 1;
        else newDownvoteCount -= 1;
        newVoteStatus = null;
      } else if (previousVoteStatus !== null && previousVoteStatus !== undefined) {
        if (value === 1) {
          newUpvoteCount += 1;
          newDownvoteCount -= 1;
        } else {
          newDownvoteCount += 1;
          newUpvoteCount -= 1;
        }
      } else {
        if (value === 1) newUpvoteCount += 1;
        else newDownvoteCount += 1;
      }

      // Update local state
      setUpvoteCount(newUpvoteCount);
      setDownvoteCount(newDownvoteCount);
      setVoteStatus(newVoteStatus);

      // Update the cache
      queryClient.setQueryData([entityType + 's', entityId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          upvoteCount: newUpvoteCount,
          downvoteCount: newDownvoteCount,
          voteStatus: newVoteStatus,
        };
      });

      return { previousVoteStatus, previousUpvoteCount: upvoteCount, previousDownvoteCount: downvoteCount };
    },

    onError: (err, _variables, context) => {
      if (!context) return;

      setVoteStatus(context.previousVoteStatus);
      setUpvoteCount(context.previousUpvoteCount);
      setDownvoteCount(context.previousDownvoteCount);

      console.error(`Vote on ${entityType} failed:`, err);
    },

    onSettled: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [entityType + 's', entityId] });
      queryClient.invalidateQueries({ queryKey: [entityType + 's'] });
      queryClient.invalidateQueries({ queryKey: ['votes', entityType, entityId] });

      // Add this invalidation for comment replies
      if (entityType === 'comment') {
        queryClient.invalidateQueries({ queryKey: ['commentReplies'] });
      }

      if (onVoteChange) onVoteChange();
    },
  });

  const handleVote = (value: VoteValue) => {
    if (voteMutation.isPending) return;
    voteMutation.mutate({ value });
  };

  return {
    upvoteCount,
    downvoteCount,
    voteStatus,
    voteCount,
    handleVote,
    isVoting: voteMutation.isPending,
  };
};
