import LoadingIndicator from '@/components/feedback/LoadinIndicator';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import PopularTopicItem from '@/features/discussions/components/PopularTopicItem';
import { discussionApi } from '@/features/discussions/services';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ExplorePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const TAGS_PER_PAGE = 10;

  // Handle search input
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Fetch popular tags with infinite scroll
  const {
    data: tagsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['popularTags', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      return await discussionApi.getPopularTags({
        page: pageParam,
        limit: TAGS_PER_PAGE,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined;
    },
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

  // Flatten the pages of tags
  const allTags = tagsData?.pages ? tagsData.pages.flatMap((page) => page.items).filter((tag) => tag.tag !== '') : [];

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="mb-4 text-2xl font-bold">Explore</h1>

        <div className="mb-5">
          <SearchInput
            value={searchTerm}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            placeholder="Search discussions or users..."
            size="lg"
            className="focus:ring-2 focus:ring-green-200"
          />
          <p className="mt-2 text-sm text-gray-500">Press Enter to search</p>
        </div>

        {/* Popular Tags Section */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="divide-y divide-gray-100 p-2">
            {isLoading ? (
              <div className="flex flex-col space-y-3 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex animate-pulse items-center">
                    <div className="h-5 w-5 rounded-full bg-gray-200"></div>
                    <div className="ml-2 space-y-1">
                      <div className="h-4 w-32 rounded bg-gray-200"></div>
                      <div className="h-3 w-24 rounded bg-gray-200"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="p-6 text-center text-gray-500">Failed to load topics. Please try again later.</div>
            ) : allTags.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No popular topics found at the moment.</div>
            ) : (
              <>
                {allTags.map((topic, index) => (
                  <PopularTopicItem key={index} tag={topic.tag} count={topic.count} />
                ))}

                {/* Loading more indicator */}
                {isFetchingNextPage && <LoadingIndicator text="Loading more topics..." />}

                {/* Invisible element for intersection observer */}
                {hasNextPage && <div ref={observerRef} className="h-5" />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
