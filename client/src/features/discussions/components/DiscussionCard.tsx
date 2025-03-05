import { useState } from 'react';
import DiscussionCardBody from './DiscussionCardBody';
import DiscussionCardHeader from './DiscussionCardHeader';
import DiscussionCardFooter from './DiscussionCardFooter';
import UpdateDiscussionModal from './UpdateDiscussionModal';
import { Discussion } from '../types';
import { useNavigate } from 'react-router-dom';

interface DiscussionCardProps {
  discussion: Discussion;
}

const DiscussionCard: React.FC<DiscussionCardProps> = ({ discussion }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  return (
    <>
      <div
        className="flex w-full flex-col gap-3 rounded-xl bg-white p-4"
        onClick={() => navigate(`/discussions/${discussion.id}`)}
      >
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
