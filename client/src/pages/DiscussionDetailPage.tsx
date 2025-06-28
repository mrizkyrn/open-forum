import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { CommentForm, CommentsSection } from '@/features/comments/components';
import { DiscussionCard, UpdateDiscussionModal } from '@/features/discussions/components';
import { discussionApi } from '@/features/discussions/services';
import FeedbackDisplay from '@/shared/components/feedback/FeedbackDisplay';
import LoadingIndicator from '@/shared/components/feedback/LoadingIndicator';
import BackButton from '@/shared/components/ui/buttons/BackButton';
import { useSocket } from '@/shared/hooks/useSocket';

const DiscussionDetailPage = () => {
  const [showEditModal, setShowEditModal] = useState(false);

  const { id } = useParams<{ id: string }>();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  const discussionId = parseInt(id || '0', 10);

  const {
    data: discussion,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['discussion', discussionId],
    queryFn: () => discussionApi.getDiscussionById(discussionId),
    enabled: !!discussionId && !isNaN(discussionId),
  });

  useEffect(() => {
    if (!socket || !isConnected || !discussionId || isNaN(discussionId)) return;

    socket.emit('joinDiscussion', { discussionId });

    const handleDiscussionUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', discussionId] });
    };

    const handleNewComment = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['comments', discussionId] });

      if (data && data.parentId) {
        queryClient.invalidateQueries({ queryKey: ['commentReplies', data.parentId] });
      } else {
        queryClient.invalidateQueries({
          queryKey: ['commentReplies'],
          predicate: (query) => {
            return query.queryKey[0] === 'commentReplies';
          },
        });
      }
    };

    socket.on('discussionUpdate', handleDiscussionUpdate);
    socket.on('newComment', handleNewComment);

    return () => {
      socket.emit('leaveDiscussion', { discussionId });

      socket.off('discussionUpdate', handleDiscussionUpdate);
      socket.off('newComment', handleNewComment);
    };
  }, [socket, isConnected, discussionId, queryClient]);

  if (isLoading) {
    return <LoadingIndicator fullWidth />;
  }

  if (isError || !discussion) {
    return (
      <FeedbackDisplay
        title="Discussion Not Found"
        description="This discussion may have been removed or doesn't exist. It might have been deleted by the author or a moderator."
        variant="error"
        size="md"
      />
    );
  }

  return (
    <>
      <div className="w-full">
        <BackButton />

        <DiscussionCard discussion={discussion} disableNavigation={true} />

        <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
          <div className="mb-3">
            <CommentForm discussionId={discussion.id} />
          </div>

          <CommentsSection discussionId={discussion.id} commentCount={discussion.commentCount} />
        </div>
      </div>

      <UpdateDiscussionModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} discussion={discussion} />
    </>
  );
};

export default DiscussionDetailPage;
