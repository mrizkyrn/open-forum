import FeedbackDisplay from '@/components/feedback/FeedbackDisplay';
import LoadingIndicator from '@/components/feedback/LoadinIndicator';
import MainButton from '@/components/ui/buttons/MainButton';
import SpacesList from '@/features/spaces/components/SpaceList';
import SpaceSearchBar from '@/features/spaces/components/SpaceSearchBar';
import { useSpaceFollow } from '@/features/spaces/hooks/useSpaceFollow';
import { spaceApi } from '@/features/spaces/services';
import { SpaceSortBy } from '@/features/spaces/types';
import { useDebounce } from '@/hooks/useDebounce';
import { SortOrder } from '@/types/SearchTypes';
import { useInfiniteQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

const SpacesPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [sortBy, setSortBy] = useState<SpaceSortBy>(SpaceSortBy.followerCount);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);

  const { followSpace, unfollowSpace, isLoading: followLoading, followingMap } = useSpaceFollow();

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['spaces', debouncedSearch, sortBy, sortOrder],
    queryFn: ({ pageParam = 1 }) =>
      spaceApi.getSpaces({
        page: pageParam,
        limit: 6,
        search: debouncedSearch,
        sortBy,
        sortOrder,
      }),
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined),
    initialPageParam: 1,
  });

  useEffect(() => {
    refetch();
  }, [debouncedSearch, sortBy, sortOrder, refetch]);

  const spaces = data?.pages.flatMap((page) => page.items) || [];

  const handleFollowToggle = (spaceId: number, isFollowing: boolean) => {
    if (isFollowing) {
      unfollowSpace(spaceId);
    } else {
      followSpace(spaceId);
    }
  };

  const handleLoadMore = () => {
    fetchNextPage();
  };

  return (
    <div className="flex flex-col">
      <h1 className="mb-6 text-2xl font-bold">Spaces</h1>

      <SpaceSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOrder={sortOrder}
        onOrderChange={setSortOrder}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {isLoading ? (
        <LoadingIndicator fullWidth vertical text="Loading spaces..." />
      ) : isError ? (
        <FeedbackDisplay
          title="Failed to load spaces"
          description="There was an error retrieving the spaces. Please try again."
          variant="error"
          actions={[
            {
              label: 'Try again',
              icon: RefreshCw,
              onClick: refetch,
              variant: 'danger',
            },
          ]}
        />
      ) : spaces.length === 0 ? (
        <FeedbackDisplay
          title="No spaces found"
          description={debouncedSearch ? `No spaces match "${debouncedSearch}"` : 'No spaces available'}
          size="lg"
          variant="default"
        />
      ) : (
        <SpacesList
          spaces={spaces}
          viewMode={viewMode}
          onFollowToggle={handleFollowToggle}
          isFollowLoading={followLoading}
          followingMap={followingMap}
          searchTerm={debouncedSearch}
        />
      )}

      {hasNextPage && (
        <div className="mt-6 flex justify-center">
          <MainButton
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            isLoading={isFetchingNextPage}
            variant="outline"
            size="sm"
          >
            Load more spaces
          </MainButton>
        </div>
      )}
    </div>
  );
};

export default SpacesPage;
