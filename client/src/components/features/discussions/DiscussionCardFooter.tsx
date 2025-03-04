import { useBookmark } from '@/hooks/useBookmark';
import { ArrowBigDown, ArrowBigUp, MessageCircle, Bookmark, CircleAlert } from 'lucide-react';

interface DiscussionCardFooterProps {
  discussionId: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  isBookmarked?: boolean;
}

const DiscussionCardFooter: React.FC<DiscussionCardFooterProps> = ({
  discussionId,
  upvoteCount,
  downvoteCount,
  commentCount,
  isBookmarked,
}) => {
  const voteCount = upvoteCount - downvoteCount;
  const { mutate: toogleBookmark, isPending: isBookmarkLoading } = useBookmark();

  const getVoteColor = (count: number) => {
    if (count > 0) return 'text-green-500';
    if (count < 0) return 'text-red-500';
    return '';
  };

  const handleBookmark = () => {
    toogleBookmark({ discussionId, isCurrentlyBookmarked: isBookmarked ?? false });
  };

  return (
    <div className="flex justify-between text-gray-600">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ArrowBigUp strokeWidth={1} size={24} />
          <span className={getVoteColor(voteCount)}>{voteCount}</span>
          <ArrowBigDown strokeWidth={1} size={24} />
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle strokeWidth={1.5} size={18} />
          <span>{commentCount}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleBookmark}
          disabled={isBookmarkLoading}
          className={`cursor-pointer rounded-full p-1 transition-colors`}
        >
          <Bookmark strokeWidth={1.5} size={18} className={isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''} />
        </button>
        <CircleAlert strokeWidth={1.5} size={18} />
      </div>
    </div>
  );
};

export default DiscussionCardFooter;
