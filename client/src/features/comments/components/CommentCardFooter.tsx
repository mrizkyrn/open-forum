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
    <div className="flex items-center gap-4 text-sm">
      {/* Vote buttons */}
      <div className="flex items-center gap-1">
        <button
          className={`rounded-full p-1 hover:bg-gray-100 ${currentVoteStatus === 1 && 'text-primary bg-green-50'}`}
          onClick={() => handleVote(1)}
          disabled={isVoting}
        >
          <ArrowBigUp strokeWidth={1.5} size={20} className={currentVoteStatus === 1 ? 'fill-primary' : ''} />
        </button>
        <span className={`text-xs ${getVoteColor(voteCount)}`}>{voteCount}</span>
        <button
          className={`rounded-full p-1 hover:bg-gray-100 ${currentVoteStatus === -1 && 'bg-red-50 text-red-500'}`}
          onClick={() => handleVote(-1)}
          disabled={isVoting}
        >
          <ArrowBigDown strokeWidth={1.5} size={20} className={currentVoteStatus === -1 ? 'fill-red-500' : ''} />
        </button>
      </div>

      {/* Reply button */}
      <button
        onClick={onToggleReply}
        className={`flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-gray-100 ${
          showReplyForm ? 'bg-gray-100 font-medium' : ''
        }`}
      >
        <Reply size={14} />
        {showReplyForm ? 'Cancel Reply' : 'Reply'}
      </button>

      {/* Show replies button */}
      {hasReplies && !isReply && (
        <button
          onClick={onToggleShowReplies}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-gray-100"
        >
          <MessageCircle size={14} />
          {showReplies ? 'Hide' : 'Show'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
        </button>
      )}
    </div>
  );
};

export default CommentCardFooter;
