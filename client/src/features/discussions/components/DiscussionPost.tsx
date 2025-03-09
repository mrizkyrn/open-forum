import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, PencilLine } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useInfiniteDiscussions } from '@/features/discussions/hooks/useInfiniteDiscussions';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CreateDiscussionModal from './CreateDiscussionModal';
import DiscussionCard from './DiscussionCard';
import DiscussionPostSkeleton from './DiscussionPostSkeleton';
import { useSocket } from '@/hooks/useSocket';
import AvatarImage from '@/features/users/components/AvatarImage';
import { useAuth } from '@/features/auth/hooks/useAuth';

const DiscussionPost = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDiscussions, setNewDiscussions] = useState(0);

  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, refetch } =
    useInfiniteDiscussions({
      limit: 5,
    });
  const { entry, observerRef } = useIntersectionObserver({
    threshold: 0.5,
    enabled: !!hasNextPage && !isFetchingNextPage,
  });

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewDiscussion = () => {
      setNewDiscussions((prev) => prev + 1);
    };

    socket.on('newDiscussion', handleNewDiscussion);

    return () => {
      socket.off('newDiscussion', handleNewDiscussion);
    };
  }, [socket, isConnected]);

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
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="text-dark">
          Error loading discussions: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Try Again
        </button>
      </div>
    );
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
    <div className="container mx-auto max-w-xl px-4">

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
        {/* Create new discussion input */}
        <div className="flex w-full items-center gap-2 rounded-xl bg-white p-4">
          <AvatarImage avatarUrl={user?.avatarUrl} fullName={user?.fullName} size={10} />
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-light w-full rounded-full px-4 py-1 text-left text-gray-600 focus:outline-none"
          >
            What's on your mind?
          </button>
        </div>

        {/* Discussion cards */}
        {discussions.map((discussion) => (
          <DiscussionCard key={discussion.id} discussion={discussion} />
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

      <CreateDiscussionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default DiscussionPost;
