import { ArrowBigDown, ArrowBigUp, MessageCircle } from 'lucide-react';

interface DiscussionCardFooterProps {
  discussionId: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
}

const DiscussionCardFooter: React.FC<DiscussionCardFooterProps> = ({
  upvoteCount,
  downvoteCount,
  commentCount,
}) => {
  const voteCount = upvoteCount - downvoteCount;

  const getVoteColor = (count: number) => {
    if (count > 0) return 'text-green-500';
    if (count < 0) return 'text-red-500';
    return '';
  };

  return (
    <div className="flex justify-between text-gray-600">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button className="rounded-full p-1 hover:bg-gray-100">
            <ArrowBigUp strokeWidth={1.3} size={24} />
          </button>
          <span className={getVoteColor(voteCount)}>{voteCount}</span>
          <button className="rounded-full p-1 hover:bg-gray-100">
            <ArrowBigDown strokeWidth={1.3} size={24} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle strokeWidth={1.5} size={18} />
          <span>{commentCount}</span>
        </div>
      </div>
    </div>
  );
};

export default DiscussionCardFooter;
