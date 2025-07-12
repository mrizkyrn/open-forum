import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import SelectFilter from '@/features/admin/components/forms/SelectFilter';
import { BugPriority, BugReportSortBy, BugStatus } from '@/features/bug-reports/types';
import MainButton from '@/shared/components/ui/buttons/MainButton';
import SearchInput from '@/shared/components/ui/inputs/SearchInput';
import { SortOrder } from '@/shared/types/RequestTypes';

interface BugReportFiltersProps {
  search: string;
  status?: BugStatus;
  priority?: BugPriority;
  sortBy: BugReportSortBy;
  sortOrder: SortOrder;
  onSearchChange: (search: string) => void;
  onStatusChange: (status?: BugStatus) => void;
  onPriorityChange: (priority?: BugPriority) => void;
  onSortChange: (sortBy: string) => void;
  onResetFilters: () => void;
}

const BugReportFilters = ({
  search,
  status,
  priority,
  sortBy,
  sortOrder,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onSortChange,
  onResetFilters,
}: BugReportFiltersProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleSortChange = (value: string) => {
    const [newSortBy] = value.split('-');
    onSortChange(newSortBy);
  };

  // Status options for dropdown
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: BugStatus.OPEN, label: 'Open' },
    { value: BugStatus.IN_PROGRESS, label: 'In Progress' },
    { value: BugStatus.RESOLVED, label: 'Resolved' },
    { value: BugStatus.CLOSED, label: 'Closed' },
  ];

  // Priority options for dropdown
  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: BugPriority.LOW, label: 'Low' },
    { value: BugPriority.MEDIUM, label: 'Medium' },
    { value: BugPriority.HIGH, label: 'High' },
    { value: BugPriority.CRITICAL, label: 'Critical' },
  ];

  // Sort options for dropdown
  const sortOptions = [
    { value: `${BugReportSortBy.CREATED_AT}-${SortOrder.DESC}`, label: 'Newest First' },
    { value: `${BugReportSortBy.CREATED_AT}-${SortOrder.ASC}`, label: 'Oldest First' },
    { value: `${BugReportSortBy.UPDATED_AT}-${SortOrder.DESC}`, label: 'Recently Updated' },
    { value: `${BugReportSortBy.UPDATED_AT}-${SortOrder.ASC}`, label: 'Least Recently Updated' },
    { value: `${BugReportSortBy.TITLE}-${SortOrder.ASC}`, label: 'Title A-Z' },
    { value: `${BugReportSortBy.TITLE}-${SortOrder.DESC}`, label: 'Title Z-A' },
    { value: `${BugReportSortBy.PRIORITY}-${SortOrder.DESC}`, label: 'High Priority First' },
    { value: `${BugReportSortBy.PRIORITY}-${SortOrder.ASC}`, label: 'Low Priority First' },
    { value: `${BugReportSortBy.STATUS}-${SortOrder.ASC}`, label: 'Status A-Z' },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Search area - always visible */}
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex-grow">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Search bug reports by title or description..."
            size="lg"
            showClearButton
          />
        </div>

        {/* Collapsible trigger for mobile */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:hidden"
        >
          Filters
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* Filters section - collapsible on mobile */}
      <div className={`border-t border-gray-100 bg-gray-50 px-4 py-3 ${isCollapsed ? 'hidden sm:block' : 'block'}`}>
        {/* Filter section title - visible on desktop */}
        <div className="mb-2 hidden text-xs font-semibold text-gray-500 uppercase sm:block">Filters</div>

        {/* Filter items with better wrapping and spacing */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Sort dropdown */}
          <SelectFilter
            options={sortOptions}
            value={`${sortBy}-${sortOrder}`}
            onChange={handleSortChange}
            placeholder="Sort by"
            className="w-48"
          />

          {/* Status filter */}
          <SelectFilter
            options={statusOptions}
            value={status || ''}
            onChange={onStatusChange}
            placeholder="All Statuses"
          />

          {/* Priority filter */}
          <SelectFilter
            options={priorityOptions}
            value={priority || ''}
            onChange={onPriorityChange}
            placeholder="All Priorities"
          />

          {/* Reset button */}
          <MainButton onClick={onResetFilters} variant="outline" leftIcon={<RefreshCw size={16} />}>
            Reset Filters
          </MainButton>
        </div>
      </div>
    </div>
  );
};

export default BugReportFilters;
