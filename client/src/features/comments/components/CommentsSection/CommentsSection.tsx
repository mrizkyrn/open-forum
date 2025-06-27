import ErrorFetching from '@/components/feedback/ErrorFetching';
import LoadingIndicator from '@/components/feedback/LoadingIndicator';
import MainButton from '@/components/ui/buttons/MainButton';
import { CommentCard } from '@/features/comments/components';
import { commentApi } from '@/features/comments/services';
import { Comment, CommentSortBy } from '@/features/comments/types';
import { useDropdown } from '@/hooks/useDropdown';
import { SortOrder } from '@/types/SearchTypes';
import { getFromCurrentUrl } from '@/utils/helpers';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Calendar, ChevronDown, Loader2, MessageCircle, ThumbsUp } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface CommentsSectionProps {
  discussionId: number;
  commentCount: number;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ discussionId, commentCount }) => {
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyMention, setReplyMention] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<CommentSortBy>(CommentSortBy.createdAt);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.ASC);
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);
  const [hasInitiallyHighlighted, setHasInitiallyHighlighted] = useState(false);
  const [forceShowReplies, setForceShowReplies] = useState<number | null>(null);

  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdown = useDropdown(sortDropdownRef as React.RefObject<HTMLElement>);

  const urlCommentId = getFromCurrentUrl('comment') ? Number(getFromCurrentUrl('comment')) : null;

  // Fetch the specific comment from URL
  const { data: specificComment, isLoading: isLoadingSpecific } = useQuery({
    queryKey: ['comment', urlCommentId],
    queryFn: () => commentApi.getCommentById(urlCommentId!),
    enabled: !!urlCommentId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch parent comment if the specific comment is a reply
  const { data: parentComment, isLoading: isLoadingParent } = useQuery({
    queryKey: ['comment', specificComment?.parentId],
    queryFn: () => commentApi.getCommentById(specificComment!.parentId!),
    enabled: !!specificComment?.parentId,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingComments,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['comments', discussionId, sortBy, sortOrder],
    queryFn: ({ pageParam = 1 }) => commentApi.getCommentsByDiscussion(discussionId, pageParam, 5, sortBy, sortOrder),
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined),
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });

  // Set highlighted comment and scroll to it
  useEffect(() => {
    if (urlCommentId && specificComment && !hasInitiallyHighlighted) {
      setHighlightedCommentId(urlCommentId);
      setHasInitiallyHighlighted(true);

      // If it's a reply comment, force show its parent's replies
      if (specificComment.parentId && parentComment) {
        setForceShowReplies(specificComment.parentId);
      }

      // Scroll to the comment after a short delay
      setTimeout(() => {
        const commentElement = document.getElementById(`comment-${urlCommentId}`);
        if (commentElement) {
          commentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 300);

      // Remove highlight after 4 seconds
      setTimeout(() => {
        setHighlightedCommentId(null);
      }, 4000);
    }
  }, [urlCommentId, specificComment, parentComment, hasInitiallyHighlighted]);

  useEffect(() => {
    setHasInitiallyHighlighted(false);
  }, [urlCommentId]);

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

  const regularComments = useMemo(() => data?.pages.flatMap((page) => page.items) || [], [data]);

  // Combine specific comment with regular comments, handling replies
  const allComments = useMemo(() => {
    if (!specificComment) return regularComments;

    if (specificComment.parentId && parentComment) {
      const isParentInRegular = regularComments.some((comment) => comment.id === parentComment.id);

      if (isParentInRegular) {
        return regularComments;
      } else {
        return [parentComment, ...regularComments];
      }
    } else {
      const isCommentInRegular = regularComments.some((comment) => comment.id === specificComment.id);

      if (isCommentInRegular) {
        return regularComments;
      } else {
        return [specificComment, ...regularComments];
      }
    }
  }, [specificComment, parentComment, regularComments]);

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

  const isLoading = isLoadingComments || (urlCommentId && (isLoadingSpecific || isLoadingParent));

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
        {allComments.length > 0 && (
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

      {allComments.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-4 text-center text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <>
          {/* Comments */}
          {allComments.map((comment: Comment) => (
            <div
              key={comment.id}
              id={`comment-${comment.id}`}
              className={`transition-all duration-300 ${
                highlightedCommentId === comment.id ? 'rounded-lg bg-blue-50 px-2' : ''
              }`}
            >
              <CommentCard
                comment={comment}
                onToggleReply={handleToggleReply}
                showReplyForm={activeReplyId === comment.id}
                replyMention={activeReplyId === comment.id ? replyMention : null}
                forceShowReplies={forceShowReplies === comment.id}
                highlightedReplyId={highlightedCommentId}
              />
            </div>
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
