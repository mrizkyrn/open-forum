import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { userApi } from '../services';
import { SortOrder, UserRole, UserSortBy } from '../types';

export interface UserFilters {
  page: number;
  limit: number;
  search?: string;
  sortOrder: SortOrder;
  role?: UserRole;
  sortBy?: UserSortBy;
}

export const defaultFilters: UserFilters = {
  page: 1,
  limit: 10,
  sortBy: UserSortBy.createdAt,
  sortOrder: SortOrder.DESC,
};

export function useUsers(initialFilters: Partial<UserFilters> = {}) {
  const [filters, setFilters] = useState<UserFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  const queryResult = useQuery({
    queryKey: ['users', filters],
    queryFn: () => userApi.getUsers(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data, isLoading, isError } = queryResult;

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, page: 1, limit }));
  };

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, page: 1, search }));
  };

  const handleRoleFilterChange = (role?: UserRole) => {
    setFilters((prev) => ({ ...prev, page: 1, role }));
  };

  const handleSortChange = (sortBy: string) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'ASC' ? 'DESC' : 'ASC';

    setFilters((prev) => ({
      ...prev,
      sortBy: sortBy as UserSortBy,
      sortOrder: newSortOrder as SortOrder,
    }));
  };

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      limit: filters.limit,
      search: '',
      role: undefined,
      sortBy: UserSortBy.createdAt,
      sortOrder: SortOrder.DESC,
    }));
  };

  return {
    users: data?.items || [],
    meta: data?.meta,
    isLoading,
    isError,
    filters,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleRoleFilterChange,
    handleSortChange,
    handleResetFilters,
  };
}
