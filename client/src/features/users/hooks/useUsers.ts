import { useQuery } from '@tanstack/react-query';
import { SortOrder, UserRole, UserSortBy } from '../types';
import { useState } from 'react';
import { userApi } from '../services/userApi';

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
  limit: 5,
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

  const { data, isLoading, error } = queryResult;

  const updateFilters = (newFilters: Partial<UserFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when any filter except page changes
      page: 'page' in newFilters ? newFilters.page! : 1,
    }));
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const handleLimitChange = (limit: number) => {
    updateFilters({ limit });
  };

  const handleSearchChange = (search: string) => {
    updateFilters({ search });
  };

  const handleRoleFilterChange = (role?: UserRole) => {
    updateFilters({ role });
  };

  const handleSortChange = (sortBy: string) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'ASC' ? 'DESC' : 'ASC';

    updateFilters({
      sortBy: sortBy as UserSortBy,
      sortOrder: newSortOrder as SortOrder,
    });
  };

  return {
    users: data?.items || [],
    meta: data?.meta,
    isLoading,
    error,
    filters,
    updateFilters,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleRoleFilterChange,
    handleSortChange,
  };
}
