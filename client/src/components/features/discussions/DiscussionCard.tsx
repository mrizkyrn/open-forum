import { Discussion } from '@/types/DiscussionTypes';
import DiscussionCardBody from './DiscussionCardBody';
import DiscussionCardFooter from './DiscussionCardFooter';
import DiscussionCardHeader from './DiscussionCardHeader';

interface DiscussionCardProps {
  discussion: Discussion;
}

const DiscussionCard: React.FC<DiscussionCardProps> = ({ discussion }) => {
  return (
    <div className="flex w-full max-w-xl flex-col gap-3 rounded-xl bg-white p-4">
      <DiscussionCardHeader imageUrl="src/assets/profile-picture.png" fullName={discussion.author?.fullName} />
      <DiscussionCardBody content={discussion.content} attachments={discussion.attachments} />
      <DiscussionCardFooter
        discussionId={discussion.id}
        upvoteCount={discussion.upvoteCount}
        downvoteCount={discussion.downvoteCount}
        commentCount={discussion.commentCount}
        isBookmarked={discussion.isBookmarked}
      />
    </div>
  );
};

export default DiscussionCard;
