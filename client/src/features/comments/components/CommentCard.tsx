import { useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Comment } from '@/features/comments/types';
import { commentApi } from '@/features/comments/services/commentApi';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import AvatarImage from '@/features/users/components/AvatarImage';
import CommentCardBody from './CommentCardBody';
import CommentCardHeader from './CommentCardHeader';
import CommentCardFooter from './CommentCardFooter';
import CommentForm from './CommentForm';
import LoadingSpinner from '@/components/feedback/LoadingSpinner';

interface CommentCardProps {
  comment: Comment;
  isReply?: boolean;
  showReplyForm?: boolean;
  onToggleReply?: (commentId: number) => void;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  isReply = false,
  showReplyForm = false,
  onToggleReply,
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: repliesData,
    fetchNextPage: fetchNextReplies,
    hasNextPage: hasMoreReplies,
    isFetchingNextPage: isFetchingMoreReplies,
    isLoading: isLoadingReplies,
    isError: isErrorReplies,
  } = useInfiniteQuery({
    queryKey: ['commentReplies', comment.id],
    queryFn: ({ pageParam = 1 }) => commentApi.getCommentReplies(comment.id, pageParam, 3),
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined),
    enabled: showReplies && comment.replyCount > 0,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });

  const replies = repliesData?.pages.flatMap((page) => page.items) || [];

  const handleReplyClick = () => {
    if (onToggleReply) {
      onToggleReply(comment.id);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await commentApi.deleteComment(comment.id);
      toast.success('Comment deleted successfully');

      queryClient.invalidateQueries({ queryKey: ['comments', comment.discussionId] });

      if (isReply && comment.parentId) {
        queryClient.invalidateQueries({ queryKey: ['commentReplies', comment.parentId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['commentReplies', comment.id] });
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setShowDeleteModal(false);
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleReport = () => {
    console.log('Report comment', comment.id);
  };

  const handleFormClickOutside = () => {
    if (onToggleReply) {
      onToggleReply(comment.id);
    }
  };

  const renderReplies = () => {
    if (!showReplies) return null;

    if (isLoadingReplies && !isFetchingMoreReplies) {
      return <LoadingSpinner text="Loading replies..." />;
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

    return (
      <div className="mt-2 flex flex-col gap-2">
        {/* Display all replies from all pages */}
        {replies.map((reply) => (
          <CommentCard
            key={reply.id}
            comment={reply}
            isReply={true}
            onToggleReply={onToggleReply}
            showReplyForm={showReplyForm && reply.id === comment.id}
          />
        ))}

        {/* Load more replies button */}
        {hasMoreReplies && (
          <div className="mt-1 ml-8">
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
                'Load more replies'
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="w-full border-t border-t-gray-300 pt-2">
        <div className="flex gap-2">
          <AvatarImage avatarUrl={comment.author.avatarUrl} fullName={comment.author.fullName} size={10} />
          <div className="flex flex-1 flex-col gap-1">
            {/* Comment header */}
            <CommentCardHeader
              author={comment.author}
              createdAt={comment.createdAt}
              isEditing={isEditing}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
              onReport={handleReport}
            />

            {/* Edit form */}
            {isEditing ? (
              <CommentForm
                discussionId={comment.discussionId}
                isReply={isReply}
                parentId={comment.parentId}
                initialValue={comment.content}
                existingAttachments={comment.attachments}
                isEditing={true}
                commentId={comment.id}
                onCancel={handleCancelEdit}
                onSuccess={() => {
                  setIsEditing(false);
                }}
                initialFocus={true}
              />
            ) : (
              <>
                {/* Comment body */}
                <CommentCardBody content={comment.content} attachments={comment.attachments} />

                {/* Comment footer */}
                <CommentCardFooter
                  commentId={comment.id}
                  upvoteCount={comment.upvoteCount}
                  downvoteCount={comment.downvoteCount}
                  voteStatus={comment.voteStatus}
                  replyCount={comment.replyCount}
                  showReplyForm={showReplyForm}
                  showReplies={showReplies}
                  isReply={isReply}
                  onToggleReply={handleReplyClick}
                  onToggleShowReplies={() => setShowReplies((prev) => !prev)}
                />
              </>
            )}

            {/* Reply form */}
            {showReplyForm && (
              <div className="mt-2">
                <CommentForm
                  discussionId={comment.discussionId}
                  isReply={true}
                  parentId={comment.id}
                  onClickOutside={handleFormClickOutside}
                  initialFocus={true}
                  onSuccess={() => {
                    if (onToggleReply) {
                      onToggleReply(comment.id);
                    }
                    setShowReplies(true);
                  }}
                />
              </div>
            )}

            {/* Replies section */}
            {renderReplies()}
          </div>
        </div>
      </div>
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        isDeleting={isDeleting}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default CommentCard;
