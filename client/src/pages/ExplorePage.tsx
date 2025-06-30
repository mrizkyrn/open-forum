import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PopularTopicItem, {
  PopularTopicItemSkeleton,
} from '@/features/discussions/components/displays/PopularTopicItem';
import { discussionApi } from '@/features/discussions/services';
import LoadingIndicator from '@/shared/components/feedback/LoadingIndicator';
import SearchInput from '@/shared/components/ui/inputs/SearchInput';
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver';

const TAGS_PER_PAGE = 10;

const ExplorePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

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

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage, hasNextPage]);

  const allTags = tagsData?.pages ? tagsData.pages.flatMap((page) => page.items).filter((tag) => tag.tag !== '') : [];

  const renderTagsContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-0">
          {[...Array(10)].map((_, i) => (
            <PopularTopicItemSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (isError) {
      return <div className="p-6 text-center text-gray-500"> Failed to load topics. Please try again later.</div>;
    }

    if (allTags.length === 0) {
      return <div className="p-6 text-center text-gray-500"> No popular topics found at the moment.</div>;
    }

    return (
      <>
        {allTags.map((topic, index) => (
          <PopularTopicItem key={index} tag={topic.tag} count={topic.count} />
        ))}

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="p-4">
            <LoadingIndicator text="Loading more topics..." fullWidth />
          </div>
        )}

        {/* Invisible element for intersection observer */}
        {hasNextPage && <div ref={observerRef} className="h-5" />}
      </>
    );
  };

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
          <div className="divide-y divide-gray-100 p-2">{renderTagsContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
