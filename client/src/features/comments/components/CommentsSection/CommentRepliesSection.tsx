import { CommentCard } from '@/features/comments/components';
import { commentApi } from '@/features/comments/services';
import { Comment } from '@/features/comments/types';
import LoadingIndicator from '@/shared/components/feedback/LoadingIndicator';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface CommentRepliesSectionProps {
  comment: Comment;
  showReplies: boolean;
  highlightedReplyId?: number | null;
  onToggleReply?: (commentId: number, replyToUsername?: string) => void;
}

const CommentRepliesSection: React.FC<CommentRepliesSectionProps> = ({
  comment,
  showReplies,
  highlightedReplyId,
  onToggleReply,
}) => {
  const {
    data: repliesData,
    fetchNextPage: fetchNextReplies,
    hasNextPage: hasMoreReplies,
    isFetchingNextPage: isFetchingMoreReplies,
    isLoading: isLoadingReplies,
    isError: isErrorReplies,
  } = useInfiniteQuery({
    queryKey: ['commentReplies', comment.id],
    queryFn: ({ pageParam = 1 }) => commentApi.getCommentReplies(comment.id, pageParam, 15),
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined),
    enabled: showReplies && comment.replyCount > 0,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });

  const handleNestedReply = (username: string) => {
    if (onToggleReply) {
      onToggleReply(comment.id, username);
    }
  };

  const replies = repliesData?.pages.flatMap((page) => page.items) || [];

  if (isLoadingReplies && !isFetchingMoreReplies) {
    return <LoadingIndicator size="sm" fullWidth />;
  }

  if (isErrorReplies) {
    return (
      <div className="mt-2 py-2 pl-8">
        <p className="text-xs text-red-500">Failed to load replies. Please try again.</p>
      </div>
    );
  }

  if (!replies || replies.length === 0) {
    return (
      <div className="mt-2 py-2 pl-8">
        <p className="text-xs text-gray-500">No replies yet.</p>
      </div>
    );
  }

  const remainingReplies = comment.replyCount - replies.length;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {/* Display all replies from all pages */}
      {replies.map((reply) => (
        <div
          key={reply.id}
          id={`comment-${reply.id}`}
          className={`transition-all duration-300 ${
            highlightedReplyId === reply.id ? 'rounded-lg bg-blue-50 px-2' : ''
          }`}
        >
          <CommentCard comment={reply} isReply={true} onToggleReply={() => handleNestedReply(reply.author.username)} />
        </div>
      ))}

      {/* Load more replies button */}
      {hasMoreReplies && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => fetchNextReplies()}
            disabled={isFetchingMoreReplies}
            className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            {isFetchingMoreReplies ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Loading more replies...
              </>
            ) : (
              `Load more replies (${remainingReplies} remaining)`
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentRepliesSection;
