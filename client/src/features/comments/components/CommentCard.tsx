import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ArrowBigUp, ArrowBigDown, MessageCircle, MoreVertical, Trash, Edit, Reply, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CommentCardBody from './CommentCardBody';
import { Comment } from '../types/commentTypes';
import CommentForm from './CommentForm';

interface CommentCardProps {
  comment: Comment;
  isReply?: boolean;
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: number) => void;
  onSubmitReply?: (parentId: number, content: string) => Promise<void>;
  onToggleReply?: (commentId: number) => void;
  showReplyForm?: boolean;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  isReply = false,
  onEdit,
  onDelete,
  onSubmitReply,
  onToggleReply,
  showReplyForm = false,
}) => {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const replyFormRef = useRef<HTMLTextAreaElement>(null);

  const isAuthor = user?.id === comment.author.id;
  const voteCount = comment.upvoteCount - comment.downvoteCount;
  const hasReplies = comment.replyCount > 0;

  const formattedDate = comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : '';

  const getVoteColor = (count: number) => {
    if (count > 0) return 'text-green-500';
    if (count < 0) return 'text-red-500';
    return '';
  };

  const handleReplyClick = () => {
    if (onToggleReply) {
      onToggleReply(comment.id);
    }
  };

  const handleEditClick = () => {
    if (onEdit) onEdit(comment);
    setDropdownOpen(false);
  };

  const handleDeleteClick = () => {
    if (onDelete) onDelete(comment.id);
    setDropdownOpen(false);
  };

  const handleReportClick = () => {
    setDropdownOpen(false);
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !onSubmitReply) return;

    try {
      setIsSubmittingReply(true);
      await onSubmitReply(comment.id, replyContent);
      setReplyContent('');
      setShowReplies(true);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Focus reply form when it becomes visible
  useEffect(() => {
    if (showReplyForm && replyFormRef.current) {
      replyFormRef.current.focus();
    }
  }, [showReplyForm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`w-full border-t border-t-gray-300 pt-2 ${isReply ? 'ml-8 border-l-2 border-gray-100 pl-2' : ''}`}>
      <div className="flex gap-2">
        <img
          src={`https://ui-avatars.com/api/?name=${comment.author.fullName}&background=random`}
          alt={comment.author.fullName}
          className="h-8 w-8 rounded-full object-cover"
        />
        <div className="flex flex-1 flex-col gap-1">
          {/* Comment header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{comment.author.fullName}</span>
                  <span className="text-xs text-gray-500">·</span>
                  <span className="text-xs text-gray-500">{formattedDate}</span>
                </div>
                {comment.parentId && !isReply && (
                  <span className="text-xs text-gray-500">Replying to another comment</span>
                )}
              </div>
            </div>

            {/* Comment actions dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="cursor-pointer rounded-full p-1 hover:bg-gray-100"
              >
                <MoreVertical size={16} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full right-0 z-10 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  {isAuthor && (
                    <>
                      <button
                        onClick={handleEditClick}
                        className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit size={14} className="mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={handleDeleteClick}
                        className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash size={14} className="mr-2" />
                        Delete
                      </button>
                    </>
                  )}
                  {!isAuthor && (
                    <button
                      onClick={handleReportClick}
                      className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Flag size={14} className="mr-2" />
                      Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comment body */}
          <CommentCardBody content={comment.content} attachments={comment.attachments} />

          {/* Comment footer */}
          <div className="flex items-center gap-4 text-sm">
            {/* Vote buttons */}
            <div className="flex items-center gap-1">
              <button className="rounded-full p-1 hover:bg-gray-100">
                <ArrowBigUp strokeWidth={1.5} size={20} />
              </button>
              <span className={`text-xs ${getVoteColor(voteCount)}`}>{voteCount}</span>
              <button className="rounded-full p-1 hover:bg-gray-100">
                <ArrowBigDown strokeWidth={1.5} size={20} />
              </button>
            </div>

            {/* Reply button */}
            <button
              onClick={handleReplyClick}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-gray-100 ${
                showReplyForm ? 'bg-gray-100 font-medium' : ''
              }`}
            >
              <Reply size={14} />
              {showReplyForm ? 'Cancel Reply' : 'Reply'}
            </button>

            {/* Show replies button (if has replies) */}
            {hasReplies && !isReply && (
              <button
                onClick={() => setShowReplies((prev) => !prev)}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-gray-100"
              >
                <MessageCircle size={14} />
                {showReplies ? 'Hide' : 'Show'} {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>

          {/* Inline reply form */}
          {showReplyForm && (
            <div className="mt-2">
              <CommentForm
                ref={replyFormRef}
                value={replyContent}
                onChange={setReplyContent}
                onSubmit={handleSubmitReply}
                isSubmitting={isSubmittingReply}
                isCompact={true}
              />
            </div>
          )}

          {/* Replies section */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              {comment.replies.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  isReply={true}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSubmitReply={onSubmitReply}
                  onToggleReply={onToggleReply}
                  showReplyForm={showReplyForm && comment.id === reply.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
