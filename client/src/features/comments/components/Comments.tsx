import { useState } from 'react';
import CommentCard from './CommentCard';
import { Comment } from '../types/commentTypes';
import { useInfiniteQuery } from '@tanstack/react-query';
import { commentApi } from '../services/commentApi';
import { Loader2 } from 'lucide-react';

interface CommentsProps {
  discussionId: number;
}

const Comments: React.FC<CommentsProps> = ({ discussionId }) => {
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['comments', discussionId],
    queryFn: ({ pageParam = 1 }) => commentApi.getCommentsByDiscussion(discussionId, pageParam, 3),
    getNextPageParam: (lastPage) => 
      lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined,
    initialPageParam: 1,
  });

  // Toggle reply form for a specific comment
  const handleToggleReply = (commentId: number) => {
    setActiveReplyId((prev) => (prev === commentId ? null : commentId));
  };

  // Flatten comments from all pages
  const comments = data?.pages.flatMap(page => page.items) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="animate-spin text-green-600" size={24} />
        <span className="ml-2 text-gray-600">Loading comments...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center">
        <p className="text-red-600">Failed to load comments</p>
        <button
          onClick={() => refetch()}
          className="mt-2 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
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
        <div className="flex justify-center mt-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 text-sm transition-colors"
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