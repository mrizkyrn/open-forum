import { DiscussionPost, DiscussionSearchBar } from '@/features/discussions/components';
import { DiscussionSortBy, SearchDiscussionDto } from '@/features/discussions/types';
import { useDebounce } from '@/hooks/useDebounce';
import { SortOrder } from '@/types/SearchTypes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingSearch, setPendingSearch] = useState<string>(searchParams.get('q') || '');
  const isClearing = useRef(false);

  const searchFilters = useMemo(
    () => ({
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 10,
      search: searchParams.get('q') || undefined,
      sortBy: (searchParams.get('sortBy') as DiscussionSortBy) || DiscussionSortBy.createdAt,
      sortOrder: (searchParams.get('sortOrder') as SortOrder) || SortOrder.DESC,
      tags: searchParams.has('tags') ? searchParams.get('tags')?.split(',').filter(Boolean) : undefined,
      isAnonymous: searchParams.has('isAnonymous') ? searchParams.get('isAnonymous') === 'true' : undefined,
    }),
    [searchParams],
  );

  useEffect(() => {
    if (!isClearing.current) {
      setPendingSearch(searchFilters.search || '');
    }
  }, [searchFilters.search]);

  const debouncedSearch = useDebounce(pendingSearch, 500);

  useEffect(() => {
    if (isClearing.current) return;

    if (debouncedSearch !== searchFilters.search) {
      const newParams = new URLSearchParams(searchParams);
      if (debouncedSearch) {
        newParams.set('q', debouncedSearch);
      } else {
        newParams.delete('q');
      }
      setSearchParams(newParams);
    }
  }, [debouncedSearch, searchFilters.search, searchParams, setSearchParams]);

  const handleSearch = useCallback((searchTerm: string) => {
    isClearing.current = false;
    setPendingSearch(searchTerm);
  }, []);

  const applyFilters = useCallback(
    (filters: Partial<SearchDiscussionDto>) => {
      const newParams = new URLSearchParams(searchParams);

      Object.entries(filters).forEach(([key, value]) => {
        const paramName = key === 'search' ? 'q' : key;

        if (value === undefined || value === null || value === '') {
          newParams.delete(paramName);
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            newParams.set(paramName, value.join(','));
          } else {
            newParams.delete(paramName);
          }
        } else {
          newParams.set(paramName, String(value));
        }
      });

      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const resetAllFilters = useCallback(() => {
    isClearing.current = true;
    setPendingSearch('');
    setSearchParams(new URLSearchParams());

    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        isClearing.current = false;
      }, 100);
    }
  }, [setSearchParams]);

  return (
    <div className="w-full">
      {/* Search input and filters */}
      <div className="mb-3 flex flex-col gap-4 rounded-lg">
        <DiscussionSearchBar
          currentFilters={{
            ...searchFilters,
            search: pendingSearch,
          }}
          onFilterChange={applyFilters}
          onSearch={handleSearch}
          onReset={resetAllFilters}
        />
      </div>

      {/* Search results */}
      <DiscussionPost search={searchFilters} />
    </div>
  );
};

export default SearchPage;
