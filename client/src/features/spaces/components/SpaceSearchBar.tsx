import { BookOpen, Clock, Grid, Landmark, List, SortAsc, Tag, UserCheck } from 'lucide-react';

import { SpaceSortBy, SpaceType } from '@/features/spaces/types';
import SortButton from '@/shared/components/ui/buttons/SortButton';
import SearchInput from '@/shared/components/ui/inputs/SearchInput';
import { SortOrder } from '@/shared/types/RequestTypes';

interface SpaceSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: SpaceSortBy;
  onSortChange: (sortBy: SpaceSortBy) => void;
  sortOrder: SortOrder;
  onOrderChange: (order: SortOrder) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  selectedType?: SpaceType | null;
  onTypeFilterChange: (type: SpaceType | null) => void;
}

const SpaceSearchBar = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onOrderChange,
  viewMode,
  onViewModeChange,
  selectedType,
  onTypeFilterChange,
}: SpaceSearchBarProps) => {
  // Handle sort change with direction toggle
  const handleSortChange = (newSortBy: SpaceSortBy) => {
    if (sortBy === newSortBy) {
      onOrderChange(sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC);
    } else {
      onSortChange(newSortBy);
      onOrderChange(SortOrder.DESC);
    }
  };

  // Type icons mapping
  const typeIcons = {
    [SpaceType.GENERAL]: <List size={14} />,
    [SpaceType.INTEREST]: <Tag size={14} />,
    [SpaceType.PROFESSIONAL]: <UserCheck size={14} />,
    [SpaceType.COMMUNITY]: <Grid size={14} />,
    [SpaceType.ORGANIZATION]: <Landmark size={14} />,
    [SpaceType.EVENT]: <Clock size={14} />,
    [SpaceType.SUPPORT]: <BookOpen size={14} />,
    [SpaceType.OTHER]: <List size={14} />,
  };

  // Type labels for display
  const typeLabels = {
    [SpaceType.GENERAL]: 'General',
    [SpaceType.INTEREST]: 'Interest',
    [SpaceType.PROFESSIONAL]: 'Professional',
    [SpaceType.COMMUNITY]: 'Community',
    [SpaceType.ORGANIZATION]: 'Organization',
    [SpaceType.EVENT]: 'Event',
    [SpaceType.SUPPORT]: 'Support',
    [SpaceType.OTHER]: 'Other',
  };

  return (
    <div className="mb-6 flex flex-col gap-3">
      {/* Search row */}
      <div className="flex w-full items-center gap-2">
        <div className="relative flex-grow">
          <SearchInput value={searchTerm} onChange={onSearchChange} placeholder="Search spaces..." size="md" />
        </div>

        {/* View mode toggle - always visible */}
        <div className="flex h-9 rounded-md border border-gray-300">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`flex h-full items-center justify-center rounded-l-md px-2 text-xs sm:px-3 ${
              viewMode === 'grid' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500'
            }`}
            aria-label="Grid view"
            title="Grid view"
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`flex h-full items-center justify-center rounded-r-md px-2 text-xs sm:px-3 ${
              viewMode === 'list' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500'
            }`}
            aria-label="List view"
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Sort row - responsive */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-gray-400">Sort:</span>

        <div className="flex flex-wrap items-center gap-1">
          <SortButton<SpaceSortBy>
            label="Followers"
            icon={<UserCheck size={14} />}
            currentSortBy={sortBy}
            sortBy={SpaceSortBy.followerCount}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            size="xs"
          />

          <SortButton<SpaceSortBy>
            label="Name"
            icon={<SortAsc size={14} />}
            currentSortBy={sortBy}
            sortBy={SpaceSortBy.name}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            size="xs"
          />

          <SortButton<SpaceSortBy>
            label="Date"
            icon={<Clock size={14} />}
            currentSortBy={sortBy}
            sortBy={SpaceSortBy.createdAt}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            size="xs"
          />
        </div>
      </div>

      {/* Type filter - new row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-gray-400">Type:</span>

        <div className="flex flex-wrap items-center gap-1">
          {/* All types (reset) button */}
          <button
            onClick={() => onTypeFilterChange(null)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
              selectedType === null || selectedType === undefined
                ? 'bg-gray-100 font-medium text-gray-800'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Tag size={14} />
            <span>All</span>
          </button>

          {/* Type filter buttons */}
          {Object.values(SpaceType).map((type) => (
            <button
              key={type}
              onClick={() => onTypeFilterChange(type)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
                selectedType === type
                  ? 'bg-gray-100 font-medium text-gray-800'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {typeIcons[type]}
              <span>{typeLabels[type]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpaceSearchBar;
