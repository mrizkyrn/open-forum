import LoadingSpinner from '@/components/feedback/LoadingSpinner';
import BackButton from '@/components/ui/buttons/BackButton';
import { CommentForm, CommentsSection } from '@/features/comments/components';
import { DiscussionCard, UpdateDiscussionModal } from '@/features/discussions/components';
import { discussionApi } from '@/features/discussions/services';
import { useSocket } from '@/hooks/useSocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

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
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Discussion Not Found</h2>
        <p className="max-w-md text-gray-500">
          This discussion may have been removed or doesn't exist. It might have been deleted by the author or a
          moderator.
        </p>
        <BackButton />
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
        <div className="rounded-xl bg-white mt-4">
          {/* Comment form */}
          <div className="mb-3">
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
