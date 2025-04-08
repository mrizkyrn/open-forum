import { SortOrder } from '@/types/SearchTypes';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { spaceApi } from '../services';
import { SearchSpaceDto, SpaceSortBy, SpaceType } from '../types';

export interface SpaceFilters {
  page: number;
  limit: number;
  search?: string;
  sortOrder: SortOrder;
  spaceType?: SpaceType;
  sortBy?: SpaceSortBy;
}

export const useSpaces = (initialFilters = {}) => {
  const [filters, setFilters] = useState<SearchSpaceDto>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: SpaceSortBy.name,
    sortOrder: SortOrder.ASC,
    ...initialFilters,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['spaces', filters],
    queryFn: () => spaceApi.getSpaces(filters),
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

  const handleSortChange = (sortBy: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sortBy as SpaceSortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC,
    }));
  };

  const handleTypeFilterChange = (type: SpaceType) => {
    setFilters((prev) => ({ ...prev, page: 1, spaceType: type }));
  };

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      limit: filters.limit,
      search: '',
      sortBy: SpaceSortBy.name,
      sortOrder: SortOrder.ASC,
    }));
  };

  return {
    spaces: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError,
    filters,
    refetch,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleSortChange,
    handleTypeFilterChange,
    handleResetFilters,
  };
};
