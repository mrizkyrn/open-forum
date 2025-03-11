import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/hooks/useSocket';
import { discussionApi } from '@/features/discussions/services/discussionApi';
import { CommentsSection, CommentForm } from '@/features/comments/components';
import { DiscussionCard, UpdateDiscussionModal } from '@/features/discussions/components';
import LoadingSpinner from '@/components/feedback/LoadingSpinner';
import BackButton from '@/components/ui/buttons/BackButton';

const DiscussionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [showEditModal, setShowEditModal] = useState(false);

  const { socket, isConnected } = useSocket();

  const discussionId = parseInt(id || '0', 10);

  useEffect(() => {
    if (!socket || !isConnected || !discussionId || isNaN(discussionId)) return;

    socket.emit('joinDiscussion', { discussionId });
    console.log(`Joined discussion room: ${discussionId}`);

    const handleDiscussionUpdate = (data: any) => {
      console.log('Discussion updated:', data);
      queryClient.invalidateQueries({ queryKey: ['discussions', discussionId] });
    };

    const handleNewComment = (data: any) => {
      console.log('New comment added', data);

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
      console.log(`Left discussion room: ${discussionId}`);

      socket.off('discussionUpdate', handleDiscussionUpdate);
      socket.off('newComment', handleNewComment);
    };
  }, [socket, isConnected, discussionId, queryClient]);

  const {
    data: discussion,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['discussion', discussionId],
    queryFn: () => discussionApi.getDiscussionById(discussionId),
    enabled: !!discussionId && !isNaN(discussionId),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError || !discussion) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-8">
        <div className="flex flex-col items-center rounded-lg bg-red-50 p-8 text-center">
          <h2 className="mb-3 text-2xl font-bold text-red-700">Error Loading Discussion</h2>
          <p className="mb-6 text-red-600">
            {error instanceof Error ? error.message : 'This discussion could not be found or may have been deleted.'}
          </p>
          <BackButton />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        {/* Back button */}
        <BackButton />

        {/* Main discussion card */}
        <DiscussionCard discussion={discussion} />

        {/* Comments section */}
        <div className="mt-8 rounded-xl bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Comments ({discussion.commentCount || 0})</h2>

          {/* Comment form */}
          <div className="mb-6">
            <CommentForm discussionId={discussion.id} />
          </div>

          {/* Comments list */}
          <CommentsSection discussionId={discussion.id} />
        </div>
      </div>

      {/* Edit discussion modal */}
      <UpdateDiscussionModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} discussion={discussion} />
    </>
  );
};

export default DiscussionDetail;
