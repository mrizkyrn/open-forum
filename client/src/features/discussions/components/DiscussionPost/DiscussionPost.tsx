import ErrorFetching from '@/components/feedback/ErrorFetching';
import LoadingSpinner from '@/components/feedback/LoadingSpinner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CreateDiscussionModal, DiscussionCard } from '@/features/discussions/components';
import { useInfiniteDiscussions } from '@/features/discussions/hooks/useInfiniteDiscussions';
import { SearchDiscussionDto } from '@/features/discussions/types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useSocket } from '@/hooks/useSocket';
import { ArrowUp, PencilLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DiscussionPostSkeleton from './DiscussionPostSkeleton';

interface DiscussionPostProps {
  search?: Partial<SearchDiscussionDto>;
  preselectedSpaceId?: number;
}

const DiscussionPost: React.FC<DiscussionPostProps> = ({ search, preselectedSpaceId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDiscussions, setNewDiscussions] = useState(0);

  const currentUrl = window.location.href;
  const currentUrlPath = currentUrl.split('/')[3];

  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, refetch } = useInfiniteDiscussions(search);

  const { entry, observerRef } = useIntersectionObserver({
    threshold: 0.5,
    enabled: !!hasNextPage && !isFetchingNextPage,
  });
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle global new discussions (only if we're on the home feed without a space filter)
    const handleNewDiscussion = (data: any) => {
      if (!preselectedSpaceId && data.authorId !== user?.id) {
        setNewDiscussions((prev) => prev + 1);
      }
    };

    // Handle space-specific new discussions
    const handleNewSpaceDiscussion = (data: any) => {
      // Only update if we're viewing this space or the home feed
      if (preselectedSpaceId && data.spaceId === preselectedSpaceId && data.authorId !== user?.id) {
        setNewDiscussions((prev) => prev + 1);
      }
    };

    // Register event listeners
    socket.on('newDiscussion', handleNewDiscussion);
    socket.on('newSpaceDiscussion', handleNewSpaceDiscussion);

    return () => {
      socket.off('newDiscussion', handleNewDiscussion);
      socket.off('newSpaceDiscussion', handleNewSpaceDiscussion);
    };
  }, [socket, isConnected, preselectedSpaceId, search?.spaceId, user?.id]);

  const handleRefreshDiscussions = async () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    await refetch();

    setNewDiscussions(0);
  };

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage, hasNextPage]);

  if (status === 'pending') {
    return <DiscussionPostSkeleton />;
  }

  if (status === 'error') {
    return <ErrorFetching text="Failed to load discussions" onRetry={refetch} />;
  }

  const discussions = data?.pages
    ? Array.from(new Map(data.pages.flatMap((page) => page.items).map((item) => [item.id, item])).values())
    : [];

  if (discussions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="text-gray-500">No discussions found.</div>
        <Link
          to="/new-discussion"
          className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
        >
          <PencilLine size={18} />
          Start a New Discussion
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* New discussions button - only show when there are new discussions */}
      {newDiscussions > 0 && (
        <div className="fixed top-8 left-1/2 z-50 -translate-x-1/2 transform">
          <button
            onClick={handleRefreshDiscussions}
            className="pulse-animation flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-green-700"
          >
            <ArrowUp size={16} />
            {newDiscussions} new {newDiscussions === 1 ? 'discussion' : 'discussions'} available
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        {/* Discussion cards */}
        {discussions.map((discussion) => (
          <DiscussionCard key={discussion.id} discussion={discussion} source={currentUrlPath} />
        ))}

        {/* Loading more indicator */}
        {isFetchingNextPage && <LoadingSpinner text="Loading more discussions..." />}

        {/* Invisible element for intersection observer */}
        {hasNextPage && <div ref={observerRef} className="bgre h-5" />}

        {/* End of results message */}
        {!hasNextPage && discussions.length > 0 && (
          <div className="py-3 text-center text-gray-500">You've reached the end of discussions</div>
        )}
      </div>

      <CreateDiscussionModal
        preselectedSpaceId={preselectedSpaceId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default DiscussionPost;
