import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import {
  CommentCardBody,
  CommentCardFooter,
  CommentCardHeader,
  CommentForm,
  CommentRepliesSection,
} from '@/features/comments/components';
import { commentApi } from '@/features/comments/services';
import { Comment } from '@/features/comments/types';
import UserAvatar from '@/features/users/components/UserAvatar';
import ConfirmationModal from '@/shared/components/modals/ConfirmationModal';

interface CommentCardProps {
  comment: Comment;
  isReply?: boolean;
  showReplyForm?: boolean;
  replyMention?: string | null;
  forceShowReplies?: boolean;
  highlightedReplyId?: number | null;
  onToggleReply?: (commentId: number, replyToUsername?: string) => void;
}

const CommentCard = ({
  comment,
  isReply = false,
  showReplyForm = false,
  replyMention = null,
  forceShowReplies = false,
  highlightedReplyId = null,
  onToggleReply,
}: CommentCardProps) => {
  const [showReplies, setShowReplies] = useState<boolean>(forceShowReplies || false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (forceShowReplies) {
      setShowReplies(true);
    }
  }, [forceShowReplies]);

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
              isDeleted={comment.isDeleted}
            />

            {/* Edit form */}
            {isEditing ? (
              <CommentForm
                discussionId={comment.discussionId}
                parentId={comment.parentId}
                initialValue={comment.content || ''}
                existingAttachments={comment.attachments}
                isEditing={true}
                commentId={comment.id}
                onCancel={handelEditCancel}
                onSuccess={() => {
                  setIsEditing(false);
                }}
              />
            ) : (
              <>
                {/* Comment body */}
                <CommentCardBody
                  content={comment.content || ''}
                  attachments={comment.attachments}
                  isDeleted={comment.isDeleted}
                />

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
                  isDeleted={comment.isDeleted}
                />
              </>
            )}

            {/* Reply form */}
            {showReplyForm && (
              <div className="mt-2">
                <CommentForm
                  discussionId={comment.discussionId}
                  parentId={comment.id}
                  initialValue={replyMention || ''}
                  onClickOutside={handleFormClickOutside}
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
                onToggleReply={onToggleReply}
                highlightedReplyId={highlightedReplyId}
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
