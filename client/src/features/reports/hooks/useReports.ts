import { SortOrder } from '@/shared/types/RequestTypes';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { reportApi } from '../services';
import { ReportQueryParams, ReportSortBy, ReportStatus, ReportTargetType } from '../types';

interface ReportsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReportStatus;
  targetType?: ReportTargetType;
  sortBy?: ReportSortBy;
  sortOrder?: SortOrder;
}

export const useReports = (initialFilters: ReportsFilters = {}) => {
  const [filters, setFilters] = useState<ReportQueryParams>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: ReportSortBy.createdAt,
    sortOrder: SortOrder.DESC,
    ...initialFilters,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () => reportApi.getReports(filters),
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

  const handleStatusFilterChange = (status?: ReportStatus) => {
    setFilters((prev) => ({ ...prev, page: 1, status }));
  };

  const handleTypeFilterChange = (targetType?: ReportTargetType) => {
    setFilters((prev) => ({ ...prev, page: 1, targetType }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sortBy as ReportSortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: filters.limit,
      search: '',
      sortBy: ReportSortBy.createdAt,
      sortOrder: SortOrder.DESC,
      status: undefined,
      targetType: undefined,
    });
  };

  return {
    reports: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError,
    filters,
    refetch,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleStatusFilterChange,
    handleTypeFilterChange,
    handleSortChange,
    handleResetFilters,
  };
};
