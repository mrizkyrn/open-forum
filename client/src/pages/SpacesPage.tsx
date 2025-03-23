import ErrorFetching from '@/components/feedback/ErrorFetching';
import LoadingSpinner from '@/components/feedback/LoadingSpinner';
import MainButton from '@/components/ui/buttons/MainButton';
import { useSpaceFollow } from '@/features/spaces/hooks/useSpaceFollow';
import { spaceApi } from '@/features/spaces/services';
import { Space, SpaceSortBy } from '@/features/spaces/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useDropdown } from '@/hooks/useDropdown';
import { SortOrder } from '@/types/SearchTypes';
import { getFileUrl } from '@/utils/helpers';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Clock,
  Grid,
  List,
  Loader2,
  Search,
  SortAsc,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const SpacesPage = () => {
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Filtering and Sorting
  const [sortBy, setSortBy] = useState<SpaceSortBy>(SpaceSortBy.followerCount);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);

  // Dropdowns handling
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdown = useDropdown(sortDropdownRef as React.RefObject<HTMLElement>);
  const orderDropdownRef = useRef<HTMLDivElement>(null);
  const orderDropdown = useDropdown(orderDropdownRef as React.RefObject<HTMLElement>);

  // Space follow functionality
  const { followSpace, unfollowSpace, isLoading: followLoading, followingMap } = useSpaceFollow();

  // Fetch spaces
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['spaces', debouncedSearch, sortBy, sortOrder],
    queryFn: ({ pageParam = 1 }) =>
      spaceApi.getSpaces({
        page: pageParam,
        limit: 12,
        search: debouncedSearch,
        sortBy,
        sortOrder,
      }),
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined),
    initialPageParam: 1,
  });

  // Reset to first page when search or filters change
  useEffect(() => {
    refetch();
  }, [debouncedSearch, sortBy, sortOrder, refetch]);

  // Extract all spaces from paginated result
  const spaces = data?.pages.flatMap((page) => page.items) || [];

  // Toggle follow status for a space
  const handleFollowToggle = (spaceId: number, isFollowing: boolean) => {
    if (isFollowing) {
      unfollowSpace(spaceId);
    } else {
      followSpace(spaceId);
    }
  };

  // Handle sort change
  const handleSortChange = (newSortBy: SpaceSortBy) => {
    setSortBy(newSortBy);
    sortDropdown.close();
  };

  // Handle order change
  const handleOrderChange = (newOrder: SortOrder) => {
    setSortOrder(newOrder);
    orderDropdown.close();
  };

  // Get human-readable sort option text
  const getSortOptionText = () => {
    switch (sortBy) {
      case SpaceSortBy.followerCount:
        return 'Followers';
      case SpaceSortBy.name:
        return 'Name';
      case SpaceSortBy.createdAt:
        return 'Date Created';
      default:
        return 'Sort By';
    }
  };

  // Get human-readable order text
  const getOrderOptionText = () => {
    return sortOrder === SortOrder.ASC ? 'Ascending' : 'Descending';
  };

  // Show loading spinner while initially loading
  if (isLoading && !isFetchingNextPage) {
    return <LoadingSpinner />;
  }

  // Show error message if fetch failed
  if (isError) {
    return <ErrorFetching text="Failed to load spaces" onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col">
      <h1 className="mb-6 text-2xl font-bold">Spaces</h1>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          {/* Search input */}
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search spaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 pl-9 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div ref={sortDropdownRef} className="relative">
            <MainButton
              onClick={sortDropdown.toggle}
              variant="outline"
              leftIcon={<SortAsc size={16} />}
              rightIcon={<ChevronDown size={14} />}
            >
              {getSortOptionText()}
            </MainButton>

            {sortDropdown.isOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <button
                  onClick={() => handleSortChange(SpaceSortBy.followerCount)}
                  className={`flex w-full items-center px-4 py-2 text-sm ${
                    sortBy === SpaceSortBy.followerCount ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } hover:bg-gray-50`}
                >
                  <UserCheck size={14} className="mr-2" />
                  Followers
                </button>
                <button
                  onClick={() => handleSortChange(SpaceSortBy.name)}
                  className={`flex w-full items-center px-4 py-2 text-sm ${
                    sortBy === SpaceSortBy.name ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } hover:bg-gray-50`}
                >
                  <SortAsc size={14} className="mr-2" />
                  Name
                </button>
                <button
                  onClick={() => handleSortChange(SpaceSortBy.createdAt)}
                  className={`flex w-full items-center px-4 py-2 text-sm ${
                    sortBy === SpaceSortBy.createdAt ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } hover:bg-gray-50`}
                >
                  <Clock size={14} className="mr-2" />
                  Date Created
                </button>
              </div>
            )}
          </div>

          {/* Order dropdown (replacing filter button) */}
          <div ref={orderDropdownRef} className="relative">
            <MainButton
              onClick={orderDropdown.toggle}
              variant="outline"
              leftIcon={sortOrder === SortOrder.ASC ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              rightIcon={<ChevronDown size={14} />}
            >
              {getOrderOptionText()}
            </MainButton>

            {orderDropdown.isOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <button
                  onClick={() => handleOrderChange(SortOrder.ASC)}
                  className={`flex w-full items-center px-4 py-2 text-sm ${
                    sortOrder === SortOrder.ASC ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } hover:bg-gray-50`}
                >
                  <ArrowUp size={14} className="mr-2" />
                  Ascending
                </button>
                <button
                  onClick={() => handleOrderChange(SortOrder.DESC)}
                  className={`flex w-full items-center px-4 py-2 text-sm ${
                    sortOrder === SortOrder.DESC ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } hover:bg-gray-50`}
                >
                  <ArrowDown size={14} className="mr-2" />
                  Descending
                </button>
              </div>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-md border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center rounded-l-md px-3 py-2 ${
                viewMode === 'grid' ? 'bg-gray-100 text-gray-800' : 'text-gray-500'
              }`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center rounded-r-md px-3 py-2 ${
                viewMode === 'list' ? 'bg-gray-100 text-gray-800' : 'text-gray-500'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Space list - Grid and List views remain unchanged */}
      {spaces.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <p className="text-gray-500">No spaces found. Try a different search term.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {spaces.map((space: Space) => (
            <div
              key={space.id}
              className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              {/* Space Banner */}
              <div className="relative h-28 w-full bg-gray-200">
                {space.bannerUrl ? (
                  <img src={getFileUrl(space.bannerUrl)} alt={space.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-r from-green-400 to-green-600 text-white">
                    <span className="text-lg font-semibold">{space.name}</span>
                  </div>
                )}
              </div>

              {/* Space Content */}
              <div className="relative flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {/* Space Icon */}
                    <div className="flex-shrink-0">
                      {space.iconUrl ? (
                        <img
                          src={getFileUrl(space.iconUrl)}
                          alt={space.name}
                          className="h-10 w-10 rounded-full border-2 border-white"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-600">
                          {space.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Space Name */}
                    <div>
                      <h3 className="text-base font-semibold">
                        <Link to={`/spaces/${space.slug}`} className="hover:text-green-600">
                          {space.name}
                        </Link>
                      </h3>
                      <div className="flex items-center text-xs text-gray-500">
                        <Users size={12} className="mr-1" />
                        <span>{space.followerCount} members</span>
                      </div>
                    </div>
                  </div>

                  {/* Follow Button */}
                  <button
                    onClick={() => handleFollowToggle(space.id, space.isFollowing)}
                    disabled={followLoading && followingMap[space.id]}
                    className={`rounded-md px-3 py-1 text-xs font-medium ${
                      space.isFollowing
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {followLoading && followingMap[space.id] ? '...' : space.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>

                {/* Space Description */}
                <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                  {space.description || 'No description available.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View - remains the same */
        <div className="flex flex-col gap-3">
          {spaces.map((space: Space) => (
            <div
              key={space.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center space-x-4">
                {/* Space Icon */}
                {space.iconUrl ? (
                  <img src={getFileUrl(space.iconUrl)} alt={space.name} className="h-12 w-12 rounded-full" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-600">
                    {space.name.charAt(0)}
                  </div>
                )}

                {/* Space Info */}
                <div>
                  <h3 className="text-base font-semibold">
                    <Link to={`/spaces/${space.slug}`} className="hover:text-green-600">
                      {space.name}
                    </Link>
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Users size={14} className="mr-1" />
                      {space.followerCount} members
                    </span>
                    <span>•</span>
                    <span className="line-clamp-1 max-w-[25ch]">{space.description || 'No description'}</span>
                  </div>
                </div>
              </div>

              {/* Follow Button */}
              <button
                onClick={() => handleFollowToggle(space.id, space.isFollowing)}
                disabled={followLoading && followingMap[space.id]}
                className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                  space.isFollowing
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {followLoading && followingMap[space.id] ? '...' : space.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Load more button */}
      {hasNextPage && (
        <div className="mt-6 flex justify-center">
          <MainButton
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
            className="min-w-32"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Spaces'
            )}
          </MainButton>
        </div>
      )}
    </div>
  );
};

export default SpacesPage;
