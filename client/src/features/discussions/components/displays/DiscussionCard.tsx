import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { UpdateDiscussionModal } from '@/features/discussions/components';
import { discussionApi } from '@/features/discussions/services';
import { Discussion } from '@/features/discussions/types';
import ConfirmationModal from '@/shared/components/modals/ConfirmationModal';
import DiscussionCardBody from './DiscussionCardBody';
import DiscussionCardFooter from './DiscussionCardFooter';
import DiscussionCardHeader from './DiscussionCardHeader';

interface DiscussionCardProps {
  discussion: Discussion;
  onDiscussionDeleted?: () => void;
  disableNavigation?: boolean;
}

const DiscussionCard = ({ discussion, onDiscussionDeleted, disableNavigation = false }: DiscussionCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await discussionApi.deleteDiscussion(discussion.id);
      toast.success('Discussion deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      if (onDiscussionDeleted) {
        onDiscussionDeleted();
      }
    } catch (error) {
      console.error('Failed to delete discussion:', error);
      toast.error('Failed to delete discussion');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      disableNavigation ||
      (e.target as Element).closest('button') ||
      (e.target as Element).closest('a') ||
      (e.target as Element).closest('[role="button"]')
    ) {
      return;
    }

    navigate(`/discussions/${discussion.id}`);
  };

  return (
    <>
      <div
        className={`flex w-full ${disableNavigation ? '' : 'cursor-pointer'} flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4`}
        onClick={handleCardClick}
      >
        <DiscussionCardHeader
          author={discussion.author ?? null}
          space={discussion.space}
          discussionId={discussion.id}
          createdAt={discussion.createdAt}
          isEdited={discussion.isEdited}
          isBookmarked={discussion.isBookmarked}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          isDeleting={isDeleting}
        />
        <DiscussionCardBody content={discussion.content} attachments={discussion.attachments} tags={discussion.tags} />
        <DiscussionCardFooter
          discussionId={discussion.id}
          upvoteCount={discussion.upvoteCount}
          downvoteCount={discussion.downvoteCount}
          commentCount={discussion.commentCount}
          voteStatus={discussion.voteStatus}
        />
      </div>

      {/* Modals */}
      {showEditModal && (
        <UpdateDiscussionModal isOpen={true} onClose={() => setShowEditModal(false)} discussion={discussion} />
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Discussion"
        message="Are you sure you want to delete this discussion? This action cannot be undone."
        confirmButtonText="Delete"
        variant="danger"
        isProcessing={isDeleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default DiscussionCard;
