import { useState } from 'react';
import CommentCard from './CommentCard';
import { Comment } from '../types/commentTypes';
import { useInfiniteQuery } from '@tanstack/react-query';
import { commentApi } from '../services/commentApi';
import { Loader2 } from 'lucide-react';
import LoadingSpinner from '@/components/feedback/LoadingSpinner';
import ErrorFetching from '@/components/feedback/ErrorFetching';

interface CommentsProps {
  discussionId: number;
}

const Comments: React.FC<CommentsProps> = ({ discussionId }) => {
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useInfiniteQuery({
    queryKey: ['comments', discussionId],
    queryFn: ({ pageParam = 1 }) => commentApi.getCommentsByDiscussion(discussionId, pageParam, 3),
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined),
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });

  // Toggle reply form
  const handleToggleReply = (commentId: number) => {
    setActiveReplyId((prev) => (prev === commentId ? null : commentId));
  };

  const comments = data?.pages.flatMap((page) => page.items) || [];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <ErrorFetching text="Failed to fetch comments" onRetry={refetch} />;
  }

  return comments.length === 0 ? (
    <div className="rounded-lg bg-gray-50 p-4 text-center text-gray-500">No comments yet. Be the first to comment!</div>
  ) : (
    <div className="flex flex-col gap-4">
      {/* Render all comments from all pages */}
      {comments.map((comment: Comment) => (
        <CommentCard
          key={comment.id}
          isReply={false}
          comment={comment}
          onToggleReply={handleToggleReply}
          showReplyForm={activeReplyId === comment.id}
        />
      ))}

      {/* Load more button */}
      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading more...
              </>
            ) : (
              'Load more comments'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Comments;
