import { ArrowBigDown, ArrowBigUp, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useVote } from '@/features/votes/hooks/useVote';

interface DiscussionCardFooterProps {
  discussionId: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  voteStatus?: number | null;
  onVoteChange?: () => void;
}

const DiscussionCardFooter = ({
  discussionId,
  upvoteCount,
  downvoteCount,
  commentCount,
  voteStatus,
  onVoteChange,
}: DiscussionCardFooterProps) => {
  const {
    voteCount,
    voteStatus: currentVoteStatus,
    handleVote,
    isVoting,
  } = useVote({
    entityId: discussionId,
    entityType: 'discussion',
    initialUpvotes: upvoteCount,
    initialDownvotes: downvoteCount,
    initialVoteStatus: voteStatus,
    onVoteChange,
  });
  const navigate = useNavigate();

  const getVoteColor = (count: number) => {
    if (count > 0) return 'text-green-500';
    if (count < 0) return 'text-red-500';
    return '';
  };

  return (
    <div className="flex justify-between text-gray-600">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            className={`cursor-pointer rounded-full p-1 transition-colors hover:bg-gray-100 ${currentVoteStatus === 1 && 'text-primary bg-green-50'}`}
            onClick={() => handleVote(1)}
            disabled={isVoting}
          >
            <ArrowBigUp strokeWidth={1.3} size={24} className={currentVoteStatus === 1 ? 'fill-primary' : ''} />
          </button>
          <span className={getVoteColor(voteCount)}>{voteCount}</span>
          <button
            className={`cursor-pointer rounded-full p-1 transition-colors hover:bg-gray-100 ${currentVoteStatus === -1 && 'bg-red-50 text-red-500'}`}
            onClick={() => handleVote(-1)}
            disabled={isVoting}
          >
            <ArrowBigDown strokeWidth={1.3} size={24} className={currentVoteStatus === -1 ? 'fill-red-500' : ''} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/discussions/${discussionId}`)}
            className="flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 transition-colors hover:bg-gray-100"
          >
            <MessageCircle strokeWidth={1.5} size={18} />
            <span>{commentCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscussionCardFooter;
