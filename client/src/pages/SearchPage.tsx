import { ActiveFilters, DiscussionPost, FilterToolbar } from '@/features/discussions/components';
import { DiscussionSortBy, SearchDiscussionDto } from '@/features/discussions/types';
import { SortOrder } from '@/types/SearchTypes';
import { Search as SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('query') || '');

  const [searchFilters, setSearchFilters] = useState<SearchDiscussionDto>({
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 10,
    search: searchParams.get('query') || undefined,
    sortBy: (searchParams.get('sortBy') as DiscussionSortBy) || DiscussionSortBy.createdAt,
    sortOrder: (searchParams.get('sortOrder') as SortOrder) || SortOrder.DESC,
    tags: searchParams.has('tags') ? searchParams.get('tags')?.split(',') || [] : undefined,
    isAnonymous: searchParams.has('isAnonymous') ? searchParams.get('isAnonymous') === 'true' : undefined,
  });

  useEffect(() => {
    const newFilters: SearchDiscussionDto = {
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 10,
      sortBy: (searchParams.get('sortBy') as DiscussionSortBy) || DiscussionSortBy.createdAt,
      sortOrder: (searchParams.get('sortOrder') as SortOrder) || SortOrder.DESC,
    };

    if (searchParams.has('query')) {
      newFilters.search = searchParams.get('query') || undefined;
      setSearchInput(searchParams.get('query') || '');
    }

    if (searchParams.has('tags')) {
      const tagsParam = searchParams.get('tags');
      newFilters.tags = tagsParam && tagsParam.length > 0 ? tagsParam.split(',').filter(Boolean) : [];
    }

    if (searchParams.has('authorId')) {
      newFilters.authorId = Number(searchParams.get('authorId'));
    }

    if (searchParams.has('isAnonymous')) {
      newFilters.isAnonymous = searchParams.get('isAnonymous') === 'true';
    }

    setSearchFilters(newFilters);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams(searchParams);
    if (searchInput) {
      params.set('query', searchInput);
    } else {
      params.delete('query');
    }

    setSearchParams(params);
  };

  const applyFilters = (filters: Partial<SearchDiscussionDto>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(filters).forEach(([key, value]) => {
      const paramName = key === 'search' ? 'query' : key;

      if (value === undefined || value === null || value === '') {
        params.delete(paramName);
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(paramName, value.join(','));
        } else {
          params.delete(paramName);
        }
      } else {
        params.set(paramName, String(value));
      }
    });

    setSearchParams(params);
  };

  const resetAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchInput('');
  };

  return (
    <div className="w-full">
      {/* Search input and filter toolbar */}
      <div className="flex flex-col gap-4 rounded-lg bg-white p-4">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for discussions..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon size={18} className="text-gray-400" />
            </div>
            <button
              type="submit"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filter toolbar */}
        <FilterToolbar currentFilters={searchFilters} onFilterChange={applyFilters} />
      </div>

      {/* Active filters */}
      <div className="mb-6">
        <ActiveFilters currentFilters={searchFilters} onFilterChange={applyFilters} onClearAll={resetAllFilters} />
      </div>

      {/* Search results */}
      {searchFilters.search || searchFilters.tags || searchFilters.isAnonymous ? (
        <div className="mt-4">
          <DiscussionPost search={searchFilters} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-96 text-gray-400 text-2xl font-bold">
          Search for discussions above
        </div>
      )}
    </div>
  );
};

export default SearchPage;
