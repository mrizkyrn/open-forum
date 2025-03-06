import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowBigUp, ArrowBigDown, MessageCircle, MoreVertical, Trash, Edit, Reply, Flag, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CommentCardBody from './CommentCardBody';
import { Comment } from '../types/commentTypes';
import CommentForm from './CommentForm';
import { commentApi } from '../services/commentApi';

interface CommentCardProps {
  comment: Comment;
  isReply?: boolean;
  onToggleReply?: (commentId: number) => void;
  showReplyForm?: boolean;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  isReply = false,
  onToggleReply,
  showReplyForm = false,
}) => {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthor = user?.id === comment.author.id;
  const voteCount = comment.upvoteCount - comment.downvoteCount;
  const hasReplies = comment.replyCount > 0;

  // Use infinite query for paginated replies
  const {
    data: repliesData,
    fetchNextPage: fetchNextReplies,
    hasNextPage: hasMoreReplies,
    isFetchingNextPage: isFetchingMoreReplies,
    isLoading: isLoadingReplies,
    isError: isErrorReplies,
  } = useInfiniteQuery({
    queryKey: ['commentReplies', comment.id],
    queryFn: ({ pageParam = 1 }) => commentApi.getCommentReplies(comment.id, pageParam, 3),
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined),
    enabled: showReplies && hasReplies,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });

  // Flatten replies from all pages
  const replies = repliesData?.pages.flatMap((page) => page.items) || [];

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
    setIsEditing(true);
    setDropdownOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleReportClick = () => {
    setDropdownOpen(false);
  };

  const handleFormClickOutside = () => {
    if (onToggleReply) {
      onToggleReply(comment.id);
    }
  };

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

  const renderReplies = () => {
    if (!showReplies) return null;

    if (isLoadingReplies && !isFetchingMoreReplies) {
      return (
        <div className="mt-2 flex items-center justify-center py-2 pl-8">
          <Loader2 size={16} className="mr-2 animate-spin text-green-600" />
          <span className="text-xs text-gray-500">Loading replies...</span>
        </div>
      );
    }

    if (isErrorReplies) {
      return (
        <div className="mt-2 py-2 pl-8">
          <p className="text-xs text-red-500">Failed to load replies. Please try again.</p>
        </div>
      );
    }

    if (!replies || replies.length === 0) {
      return (
        <div className="mt-2 py-2 pl-8">
          <p className="text-xs text-gray-500">No replies yet.</p>
        </div>
      );
    }

    return (
      <div className="mt-2 flex flex-col gap-2">
        {/* Display all replies from all pages */}
        {replies.map((reply) => (
          <CommentCard
            key={reply.id}
            comment={reply}
            isReply={true}
            onToggleReply={onToggleReply}
            showReplyForm={showReplyForm && reply.id === comment.id}
          />
        ))}

        {/* Load more replies button */}
        {hasMoreReplies && (
          <div className="mt-1 ml-8">
            <button
              onClick={() => fetchNextReplies()}
              disabled={isFetchingMoreReplies}
              className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              {isFetchingMoreReplies ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Loading more replies...
                </>
              ) : (
                'Load more replies'
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full border-t border-t-gray-300 pt-2">
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
            {!isEditing && ( // Only show dropdown when not editing
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
                          onClick={() => console.log('Delete comment')}
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
            )}
          </div>

          {/* Comment body */}
          {isEditing ? (
            <CommentForm
              discussionId={comment.discussionId}
              isReply={isReply}
              parentId={comment.parentId || undefined}
              initialValue={comment.content}
              existingAttachments={comment.attachments}
              isEditing={true}
              commentId={comment.id}
              onCancel={handleCancelEdit}
              onSuccess={() => {
                setIsEditing(false);
                // If editing a reply within a nested context, show the replies
              }}
              initialFocus={true}
            />
          ) : (
            <>
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
                    {showReplies ? 'Hide' : 'Show'} {comment.replyCount}{' '}
                    {comment.replyCount === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Inline reply form */}
          {showReplyForm && (
            <div className="mt-2">
              <CommentForm
                discussionId={comment.discussionId}
                isReply={true}
                parentId={comment.id}
                onClickOutside={handleFormClickOutside}
                initialFocus={true}
                onSuccess={() => setShowReplies(true)}
              />
            </div>
          )}

          {/* Replies section */}
          {renderReplies()}
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
