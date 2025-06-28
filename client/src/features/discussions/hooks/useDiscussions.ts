import { SortOrder } from '@/shared/types/SearchTypes';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { discussionApi } from '../services';
import { DiscussionSortBy, SearchDiscussionDto } from '../types';

interface DiscussionsFilters {
  page?: number;
  limit?: number;
  search?: string;
  spaceId?: number;
  tags?: string[];
  authorId?: number;
  isAnonymous?: boolean;
  sortBy?: DiscussionSortBy;
  sortOrder?: SortOrder;
}

export const useDiscussions = (initialFilters: DiscussionsFilters = {}) => {
  const [filters, setFilters] = useState<SearchDiscussionDto>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: DiscussionSortBy.createdAt,
    sortOrder: SortOrder.DESC,
    ...initialFilters,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['discussions', filters],
    queryFn: () => discussionApi.getDiscussions(filters),
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

  const handleSpaceFilterChange = (spaceId?: number) => {
    setFilters((prev) => ({ ...prev, page: 1, spaceId }));
  };

  const handleTagFilterChange = (tags?: string[]) => {
    setFilters((prev) => ({ ...prev, page: 1, tags }));
  };

  const handleAuthorFilterChange = (authorId?: number) => {
    setFilters((prev) => ({ ...prev, page: 1, authorId }));
  };

  const handleAnonymousFilterChange = (isAnonymous?: boolean) => {
    setFilters((prev) => ({ ...prev, page: 1, isAnonymous }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sortBy as DiscussionSortBy,
      sortOrder:
        prev.sortBy === sortBy ? (prev.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC) : SortOrder.ASC,
    }));
  };

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      limit: filters.limit,
      search: '',
      spaceId: undefined,
      tags: undefined,
      authorId: undefined,
      isAnonymous: undefined,
      sortBy: DiscussionSortBy.createdAt,
      sortOrder: SortOrder.DESC,
    }));
  };

  return {
    discussions: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError,
    filters,
    refetch,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleSpaceFilterChange,
    handleTagFilterChange,
    handleAuthorFilterChange,
    handleAnonymousFilterChange,
    handleSortChange,
    handleResetFilters,
  };
};
