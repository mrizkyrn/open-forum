import { SortOrder } from '@/shared/types/RequestTypes';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { bugReportApi } from '../services';
import { BugPriority, BugReportQueryParams, BugReportSortBy, BugStatus } from '../types';

interface BugReportsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: BugStatus;
  priority?: BugPriority;
  reporterId?: number;
  assignedToId?: number;
  sortBy?: BugReportSortBy;
  sortOrder?: SortOrder;
}

export const useBugReports = (initialFilters: BugReportsFilters = {}) => {
  const [filters, setFilters] = useState<BugReportQueryParams>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: BugReportSortBy.CREATED_AT,
    sortOrder: SortOrder.DESC,
    ...initialFilters,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['bug-reports', filters],
    queryFn: () => bugReportApi.getBugReports(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, page: 1, limit }));
  };

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, page: 1, search }));
  };

  const handleStatusChange = (status?: BugStatus) => {
    setFilters((prev) => ({ ...prev, page: 1, status }));
  };

  const handlePriorityChange = (priority?: BugPriority) => {
    setFilters((prev) => ({ ...prev, page: 1, priority }));
  };

  const handleSortChange = (sortBy: string) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'ASC' ? 'DESC' : 'ASC';

    setFilters((prev) => ({
      ...prev,
      sortBy: sortBy as BugReportSortBy,
      sortOrder: newSortOrder as SortOrder,
    }));
  };

  const handleReporterChange = (reporterId?: number) => {
    setFilters((prev) => ({ ...prev, page: 1, reporterId }));
  };

  const handleAssigneeChange = (assignedToId?: number) => {
    setFilters((prev) => ({ ...prev, page: 1, assignedToId }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      sortBy: BugReportSortBy.CREATED_AT,
      sortOrder: SortOrder.DESC,
    });
  };

  return {
    bugReports: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError,
    refetch,
    filters,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleStatusChange,
    handlePriorityChange,
    handleSortChange,
    handleReporterChange,
    handleAssigneeChange,
    resetFilters,
  };
};
