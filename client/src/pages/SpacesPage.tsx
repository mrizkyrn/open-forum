import { useInfiniteQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import SpacesList from '@/features/spaces/components/SpaceList';
import SpaceSearchBar from '@/features/spaces/components/SpaceSearchBar';
import { useSpaceFollow } from '@/features/spaces/hooks/useSpaceFollow';
import { spaceApi } from '@/features/spaces/services';
import { SpaceSortBy, SpaceType } from '@/features/spaces/types';
import FeedbackDisplay from '@/shared/components/feedback/FeedbackDisplay';
import LoadingIndicator from '@/shared/components/feedback/LoadingIndicator';
import MainButton from '@/shared/components/ui/buttons/MainButton';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { SortOrder } from '@/shared/types/SearchTypes';

const SPACES_PER_PAGE = 6;
const SEARCH_DEBOUNCE_DELAY = 500;

const SpacesPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SpaceSortBy>(SpaceSortBy.followerCount);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);
  const [selectedType, setSelectedType] = useState<SpaceType | null>(null);

  const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE_DELAY);
  const { followSpace, unfollowSpace, isLoading: followLoading, followingMap } = useSpaceFollow();

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['spaces', debouncedSearch, sortBy, sortOrder, selectedType],
    queryFn: ({ pageParam = 1 }) =>
      spaceApi.getSpaces({
        page: pageParam,
        limit: SPACES_PER_PAGE,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        spaceType: selectedType,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined),
  });

  const spaces = data?.pages.flatMap((page) => page.items) || [];

  const handleFollowToggle = (spaceId: number, isFollowing: boolean) => {
    if (isFollowing) {
      unfollowSpace(spaceId);
    } else {
      followSpace(spaceId);
    }
  };

  const handleTypeFilterChange = (type: SpaceType | null) => {
    setSelectedType(type);
  };

  const handleLoadMore = () => {
    fetchNextPage();
  };

  // Refetch when filters change
  useEffect(() => {
    refetch();
  }, [debouncedSearch, sortBy, sortOrder, selectedType, refetch]);

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
        selectedType={selectedType}
        onTypeFilterChange={handleTypeFilterChange}
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
          description={
            debouncedSearch || selectedType
              ? `No spaces match your filters${debouncedSearch ? ` "${debouncedSearch}"` : ''}`
              : 'No spaces available'
          }
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
