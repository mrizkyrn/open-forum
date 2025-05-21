import { ArrowBigDown, ArrowBigUp, MessageCircle, Reply } from 'lucide-react';
import { useVote } from '@/features/votes/hooks/useVote';

interface CommentCardFooterProps {
  commentId: number;
  upvoteCount: number;
  downvoteCount: number;
  voteStatus?: number | null;
  replyCount: number;
  showReplyForm: boolean;
  showReplies: boolean;
  isReply: boolean;
  onToggleReply: () => void;
  onToggleShowReplies: () => void;
}

const CommentCardFooter: React.FC<CommentCardFooterProps> = ({
  commentId,
  upvoteCount,
  downvoteCount,
  voteStatus,
  replyCount,
  showReplyForm,
  showReplies,
  isReply,
  onToggleReply,
  onToggleShowReplies,
}) => {
  const {
    voteCount,
    voteStatus: currentVoteStatus,
    handleVote,
    isVoting,
  } = useVote({
    entityId: commentId,
    entityType: 'comment',
    initialUpvotes: upvoteCount,
    initialDownvotes: downvoteCount,
    initialVoteStatus: voteStatus,
  });
  const hasReplies = replyCount > 0;

  const getVoteColor = (count: number) => {
    if (count > 0) return 'text-green-500';
    if (count < 0) return 'text-red-500';
    return '';
  };

  return (
    <div className="flex flex-wrap items-center gap-2 xs:gap-3 md:gap-4 text-sm">
      {/* Vote buttons */}
      <div className="flex items-center gap-1">
        <button
          className={`rounded-full p-1 hover:bg-gray-100 ${currentVoteStatus === 1 && 'text-primary bg-green-50'}`}
          onClick={() => handleVote(1)}
          disabled={isVoting}
        >
          <ArrowBigUp strokeWidth={1.5} size={18} className={currentVoteStatus === 1 ? 'fill-primary' : ''} />
        </button>
        <span className={`text-xs ${getVoteColor(voteCount)}`}>{voteCount}</span>
        <button
          className={`rounded-full p-1 hover:bg-gray-100 ${currentVoteStatus === -1 && 'bg-red-50 text-red-500'}`}
          onClick={() => handleVote(-1)}
          disabled={isVoting}
        >
          <ArrowBigDown strokeWidth={1.5} size={18} className={currentVoteStatus === -1 ? 'fill-red-500' : ''} />
        </button>
      </div>

      {/* Reply button */}
      <button
        onClick={onToggleReply}
        className={`flex min-w-[60px] items-center gap-1 rounded px-1.5 py-1 text-xs hover:bg-gray-100 sm:px-2 ${
          showReplyForm ? 'bg-gray-100 font-medium' : ''
        }`}
      >
        <Reply size={12} className="sm:hidden" />
        <Reply size={14} className="hidden sm:block" />
        <span className="whitespace-nowrap">{showReplyForm ? 'Cancel' : 'Reply'}</span>
      </button>

      {/* Show replies button */}
      {hasReplies && !isReply && (
        <button
          onClick={onToggleShowReplies}
          className="flex items-center gap-1 rounded px-1.5 py-1 text-xs hover:bg-gray-100 sm:px-2 whitespace-nowrap"
        >
          <MessageCircle size={12} className="sm:hidden" />
          <MessageCircle size={14} className="hidden sm:block" />
          <span>{showReplies ? 'Hide' : 'Show'}</span>
          <span className="hidden xs:inline">
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </span>
          <span className="xs:hidden">{replyCount}</span>
        </button>
      )}
    </div>
  );
};

export default CommentCardFooter;