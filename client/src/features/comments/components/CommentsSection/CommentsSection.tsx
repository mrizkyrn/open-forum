import ErrorFetching from '@/components/feedback/ErrorFetching';
import LoadingIndicator from '@/components/feedback/LoadingIndicator';
import MainButton from '@/components/ui/buttons/MainButton';
import { CommentCard } from '@/features/comments/components';
import { commentApi } from '@/features/comments/services';
import { Comment, CommentSortBy } from '@/features/comments/types';
import { useDropdown } from '@/hooks/useDropdown';
import { SortOrder } from '@/types/SearchTypes';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Calendar, ChevronDown, Loader2, MessageCircle, ThumbsUp } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

interface CommentsSectionProps {
  discussionId: number;
  commentCount: number;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ discussionId, commentCount }) => {
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyMention, setReplyMention] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<CommentSortBy>(CommentSortBy.createdAt);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.ASC);

  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdown = useDropdown(sortDropdownRef as React.RefObject<HTMLElement>);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useInfiniteQuery({
    queryKey: ['comments', discussionId, sortBy, sortOrder],
    queryFn: ({ pageParam = 1 }) => commentApi.getCommentsByDiscussion(discussionId, pageParam, 25, sortBy, sortOrder),
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined),
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });

  const handleToggleReply = (commentId: number, mentionUsername?: string) => {
    setActiveReplyId((prev) => {
      if (prev === commentId || prev !== null) {
        setReplyMention(null);
      }

      if (mentionUsername) {
        setReplyMention(`@${mentionUsername} `);
      }

      return prev === commentId ? null : commentId;
    });
  };

  const comments = data?.pages.flatMap((page) => page.items) || [];

  // Get the sort option display text
  const getSortOptionText = useMemo(() => {
    switch (sortBy) {
      case CommentSortBy.createdAt:
        return sortOrder === SortOrder.DESC ? 'Newest' : 'Oldest';
      case CommentSortBy.upvoteCount:
        return 'Most Voted';
      case CommentSortBy.replyCount:
        return 'Most Replies';
      default:
        return 'Oldest';
    }
  }, [sortBy, sortOrder]);

  const handleSortChange = (newSortBy: CommentSortBy, newSortOrder?: SortOrder) => {
    setSortBy(newSortBy);
    if (newSortOrder !== undefined) {
      setSortOrder(newSortOrder);
    }
    sortDropdown.close();
  };

  if (isLoading) {
    return <LoadingIndicator fullWidth />;
  }

  if (isError) {
    return <ErrorFetching text="Failed to fetch comments" onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header section with sort options */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-medium">Comments {commentCount > 0 && `(${commentCount})`}</h3>

        {/* Sort dropdown */}
        {comments.length > 0 && (
          <div ref={sortDropdownRef} className="relative">
            <MainButton onClick={sortDropdown.toggle} rightIcon={<ChevronDown size={14} />} variant="outline" size="sm">
              Sort: {getSortOptionText}
            </MainButton>

            {sortDropdown.isOpen && (
              <div className="absolute top-full right-0 z-10 mt-1 w-48 rounded-md bg-white py-1 shadow-md">
                <button
                  onClick={() => {
                    handleSortChange(CommentSortBy.createdAt);
                    setSortOrder(SortOrder.ASC);
                  }}
                  className={`flex w-full items-center px-4 py-2 text-sm ${
                    sortBy === CommentSortBy.createdAt && sortOrder === SortOrder.ASC
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700'
                  } hover:bg-gray-100`}
                >
                  <Calendar size={14} className="mr-2 rotate-180" />
                  Oldest
                </button>
                <button
                  onClick={() => {
                    handleSortChange(CommentSortBy.createdAt);
                    setSortOrder(SortOrder.DESC);
                  }}
                  className={`flex w-full items-center px-4 py-2 text-sm ${
                    sortBy === CommentSortBy.createdAt && sortOrder === SortOrder.DESC
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700'
                  } hover:bg-gray-100`}
                >
                  <Calendar size={14} className="mr-2" />
                  Newest
                </button>
                <button
                  onClick={() => {
                    handleSortChange(CommentSortBy.upvoteCount);
                    setSortOrder(SortOrder.DESC);
                  }}
                  className={`flex w-full items-center px-4 py-2 text-sm ${
                    sortBy === CommentSortBy.upvoteCount ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } hover:bg-gray-100`}
                >
                  <ThumbsUp size={14} className="mr-2" />
                  Most Voted
                </button>
                <button
                  onClick={() => {
                    handleSortChange(CommentSortBy.replyCount);
                    setSortOrder(SortOrder.DESC);
                  }}
                  className={`flex w-full items-center px-4 py-2 text-sm ${
                    sortBy === CommentSortBy.replyCount ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } hover:bg-gray-100`}
                >
                  <MessageCircle size={14} className="mr-2" />
                  Most Replies
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {comments.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-4 text-center text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <>
          {/* Comments */}
          {comments.map((comment: Comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onToggleReply={handleToggleReply}
              showReplyForm={activeReplyId === comment.id}
              replyMention={activeReplyId === comment.id ? replyMention : null}
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
        </>
      )}
    </div>
  );
};

export default CommentsSection;
