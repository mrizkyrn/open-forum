import { useState, useMemo } from 'react';
import CommentCard from './CommentCard';
import { Comment } from '../types/commentTypes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '../services/commentApi';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface CommentsProps {
  discussionId: number;
}

const Comments: React.FC<CommentsProps> = ({ discussionId }) => {
  const queryClient = useQueryClient();
  // Track which comment is currently being replied to
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);

  // Fetch comments for the discussion
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['comments', discussionId],
    queryFn: () => commentApi.getCommentsByDiscussion(discussionId),
  });

  // Delete comment mutation
  const { mutate: deleteComment } = useMutation({
    mutationFn: (commentId: number) => commentApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', discussionId] });
      toast.success('Comment deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete comment');
      console.error('Delete comment error:', error);
    },
  });

  // Edit comment mutation
  const { mutate: editComment } = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { content: string } }) => {
      return commentApi.updateComment(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', discussionId] });
      toast.success('Comment updated');
    },
    onError: (error) => {
      toast.error('Failed to update comment');
      console.error('Update comment error:', error);
    },
  });

  const handleEditComment = (comment: Comment) => {
    const newContent = prompt('Edit your comment:', comment.content);
    if (newContent && newContent !== comment.content) {
      editComment({
        id: comment.id,
        data: { content: newContent },
      });
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment(commentId);
    }
  };

  // Toggle reply form for a specific comment
  const handleToggleReply = (commentId: number) => {
    setActiveReplyId((prev) => (prev === commentId ? null : commentId));
  };

  // Function for submitting replies from inline forms
  const handleSubmitReply = async (parentId: number, content: string) => {
    return new Promise<void>((resolve, reject) => {
      commentApi
        .createComment({
          content,
          discussionId,
          parentId,
        })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['comments', discussionId] });
          toast.success('Reply posted');
          // Clear the active reply ID after submission
          setActiveReplyId(null);
          resolve();
        })
        .catch((error) => {
          toast.error('Failed to post reply');
          reject(error);
        });
    });
  };

  // Memoize the organized comments to prevent unnecessary recalculations
  const organizedComments = useMemo(() => {
    const commentsArray = data?.items || [];
    const topLevelComments: Comment[] = [];
    const commentMap: Record<number, Comment> = {};

    // First, create a map of all comments by ID
    commentsArray.forEach((comment) => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    // Then, organize them into a tree
    commentsArray.forEach((comment) => {
      if (comment.parentId === null) {
        // This is a top-level comment
        topLevelComments.push(commentMap[comment.id]);
      } else if (commentMap[comment.parentId]) {
        // This is a reply, add it to its parent's replies
        if (!commentMap[comment.parentId].replies) {
          commentMap[comment.parentId].replies = [];
        }
        commentMap[comment.parentId].replies!.push(commentMap[comment.id]);
      } else {
        // Fallback if parent doesn't exist
        topLevelComments.push(commentMap[comment.id]);
      }
    });

    return topLevelComments;
  }, [data?.items]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="animate-spin text-green-600" size={24} />
        <span className="ml-2 text-gray-600">Loading comments...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center">
        <p className="text-red-600">Failed to load comments</p>
        <button
          onClick={() => refetch()}
          className="mt-2 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return organizedComments.length === 0 ? (
    <div className="rounded-lg bg-gray-50 p-4 text-center text-gray-500">No comments yet. Be the first to comment!</div>
  ) : (
    <div className="flex flex-col gap-4">
      {organizedComments.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          onEdit={handleEditComment}
          onDelete={handleDeleteComment}
          onSubmitReply={handleSubmitReply}
          onToggleReply={handleToggleReply}
          showReplyForm={activeReplyId === comment.id}
        />
      ))}
    </div>
  );
};

export default Comments;
