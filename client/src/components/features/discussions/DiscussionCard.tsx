import { Discussion } from '@/types/DiscussionTypes';
import DiscussionCardBody from './DiscussionCardBody';
import DiscussionCardFooter from './DiscussionCardFooter';
import DiscussionCardHeader from './DiscussionCardHeader';
import { useState } from 'react';
import UpdateDiscussionModal from '@/components/UpdateDiscussionModal';

interface DiscussionCardProps {
  discussion: Discussion;
}

const DiscussionCard: React.FC<DiscussionCardProps> = ({ discussion }) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  return (
    <>
      <div className="flex w-full max-w-xl flex-col gap-3 rounded-xl bg-white p-4">
        <DiscussionCardHeader
          imageUrl="src/assets/profile-picture.png"
          fullName={discussion.author?.fullName}
          discussionId={discussion.id}
          authorId={discussion.author?.id}
          isBookmarked={discussion.isBookmarked}
          onEditClick={handleEditClick}
        />
        <DiscussionCardBody content={discussion.content} attachments={discussion.attachments} />
        <DiscussionCardFooter
          discussionId={discussion.id}
          upvoteCount={discussion.upvoteCount}
          downvoteCount={discussion.downvoteCount}
          commentCount={discussion.commentCount}
        />
      </div>
      {/* Edit discussion modal */}
      <UpdateDiscussionModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} discussion={discussion} />
    </>
  );
};

export default DiscussionCard;
