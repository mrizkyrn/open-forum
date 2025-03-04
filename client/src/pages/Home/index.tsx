import CreateDiscussionModal from '@/components/CreateDiscussionModal';
import DiscussionCard from '@/components/features/discussions/DiscussionCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useInfiniteDiscussions } from '@/hooks/useInfiniteDiscussions';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { PencilLine, PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, refetch } = useInfiniteDiscussions({
    limit: 5,
  });
  const { entry, observerRef } = useIntersectionObserver({
    threshold: 0.5,
    enabled: !!hasNextPage && !isFetchingNextPage,
  });

  // Fetch next page when bottom sentinel comes into view
  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage, hasNextPage]);

  // Handle loading state
  if (status === 'pending') {
    return (
      <div className="flex justify-center pt-20">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Handle error state
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="rounded-lg bg-red-50 p-4 text-red-600">
          Error loading discussions: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-md bg-green-100 px-4 py-2 text-green-700 transition-colors hover:bg-green-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Extract all discussions from all pages
  const discussions = data?.pages.flatMap((page) => page.items) || [];

  // Handle empty state
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
    <div className="container mx-auto px-4">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          <PlusCircle size={20} />
          New Discussion
        </button>
      </div>

      <div className="flex flex-col items-center gap-2">
        {discussions.map((discussion) => (
          <DiscussionCard key={discussion.id} discussion={discussion} />
        ))}

        {/* Loading more indicator */}
        {isFetchingNextPage && <LoadingSpinner text="Loading more discussions..." />}

        {/* Invisible element for intersection observer */}
        {hasNextPage && <div ref={observerRef} className="h-5" />}

        {/* End of results message */}
        {!hasNextPage && discussions.length > 0 && (
          <div className="py-6 text-center text-gray-500">You've reached the end of discussions</div>
        )}
      </div>

      <CreateDiscussionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default Home;
