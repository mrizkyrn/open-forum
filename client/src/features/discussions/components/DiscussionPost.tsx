import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PencilLine } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useInfiniteDiscussions } from '@/features/discussions/hooks/useInfiniteDiscussions';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CreateDiscussionModal from './CreateDiscussionModal';
import DiscussionCard from './DiscussionCard';
import DiscussionPostSkeleton from './DiscussionPostSkeleton';

const DiscussionPost = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, refetch } = useInfiniteDiscussions({
    limit: 5,
  });
  const { entry, observerRef } = useIntersectionObserver({
    threshold: 0.5,
    enabled: !!hasNextPage && !isFetchingNextPage,
  });

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
        <button onClick={() => refetch()} className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">
          Try Again
        </button>
      </div>
    );
  }

  // Extract all discussions from all pages
  const discussions = data?.pages.flatMap((page) => page.items) || [];

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
      <div className="flex flex-col items-center gap-2">
        <div className="flex w-full items-center gap-2 rounded-xl bg-white p-4">
          <img src="src/assets/profile-picture.png" alt="Profile" className="h-10 w-10 rounded-full object-cover" />
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-light w-full rounded-full px-4 py-1 text-left text-gray-600 focus:outline-none"
          >
            What's on your mind?
          </button>
        </div>
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
