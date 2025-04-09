import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { commentApi } from '@/features/comments/services';
import { Comment } from '@/features/comments/types';
import UserAvatar from '@/features/users/components/UserAvatar';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'react-toastify';
import CommentForm from '../CommentForm/CommentForm';
import CommentRepliesSection from '../CommentsSection/CommentRepliesSection';
import CommentCardBody from './CommentCardBody';
import CommentCardFooter from './CommentCardFooter';
import CommentCardHeader from './CommentCardHeader';

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

  const handleReplyClick = () => {
    if (onToggleReply) {
      onToggleReply(comment.id);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handelEditCancel = () => {
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

  const handleFormClickOutside = () => {
    if (onToggleReply) {
      onToggleReply(comment.id);
    }
  };

  return (
    <>
      <div className="w-full border-t border-t-gray-300 pt-2">
        <div className="flex gap-2">
          {/* Avatar */}
          <UserAvatar
            fullName={comment.author.fullName}
            avatarUrl={comment.author.avatarUrl}
            username={comment.author.username}
            size={isReply ? 'sm' : 'md'}
          />

          {/* Comment content */}
          <div className="flex flex-1 flex-col gap-1">
            {/* Comment header */}
            <CommentCardHeader
              author={comment.author}
              commentId={comment.id}
              createdAt={comment.createdAt}
              isEdited={comment.isEdited}
              isEditing={isEditing}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
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
                onCancel={handelEditCancel}
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
            {showReplies && (
              <CommentRepliesSection
                comment={comment}
                showReplies={showReplies}
                showReplyForm={showReplyForm}
                onToggleReply={onToggleReply}
              />
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmButtonText="Delete"
        variant="danger"
        isProcessing={isDeleting}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default CommentCard;
