import BackButton from '@/components/ui/buttons/BackButton';
import { DiscussionPost, DiscussionSearchBar } from '@/features/discussions/components';
import { DiscussionSortBy, SearchDiscussionDto } from '@/features/discussions/types';
import UsersList from '@/features/users/components/UsersList';
import { SortOrder } from '@/types/SearchTypes';
import { MessageSquare, User } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type SearchTab = 'discussions' | 'users';

const SearchPage = () => {
  const navigate = useNavigate();
  const [filterParams, setFilterParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<SearchTab>('discussions');

  useEffect(() => {
    if (!filterParams.get('q') && !filterParams.get('tags')) {
      navigate('/explore', { replace: true });
    }
  }, [filterParams, navigate]);

  const searchTerm = filterParams.get('q') || '';

  const filters = useMemo(
    () => ({
      search: searchTerm,
      sortBy: (filterParams.get('sortBy') as DiscussionSortBy) || DiscussionSortBy.createdAt,
      sortOrder: (filterParams.get('sortOrder') as SortOrder) || SortOrder.DESC,
      tags: filterParams.has('tags') ? filterParams.get('tags')?.split(',').filter(Boolean) : undefined,
      isAnonymous: filterParams.has('isAnonymous') ? filterParams.get('isAnonymous') === 'true' : undefined,
    }),
    [filterParams, searchTerm],
  );

  const applyFilters = useCallback(
    (filters: Partial<SearchDiscussionDto>) => {
      const newParams = new URLSearchParams(filterParams);

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

      setFilterParams(newParams);
    },
    [filterParams, setFilterParams],
  );

  const resetAllFilters = useCallback(() => {
    const newParams = new URLSearchParams();
    if (searchTerm) {
      newParams.set('q', searchTerm);
    }

    if (filters.tags && !searchTerm) {
      newParams.set('tags', filters.tags?.join(',') || '');
    }
    setFilterParams(newParams);
  }, [searchTerm, filters.tags, setFilterParams]);

  return (
    <div className="w-full">
      {/* Back to explore link */}
      {searchTerm ? (
        <BackButton backTo="/explore" text={`Results for "${searchTerm}"`} />
      ) : (
        <BackButton backTo="/explore" text="Explore" />
      )}

      <div className="border-b border-gray-200 bg-white">
        <nav className="flex" aria-label="Search Tabs">
          <button
            className={`flex w-full items-center justify-center border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'discussions'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('discussions')}
            aria-current={activeTab === 'discussions' ? 'page' : undefined}
          >
            <MessageSquare size={16} className="mr-2" />
            Discussions
          </button>
          <button
            className={`flex w-full items-center justify-center border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('users')}
            aria-current={activeTab === 'users' ? 'page' : undefined}
          >
            <User size={16} className="mr-2" />
            Users
          </button>
        </nav>
      </div>

      {activeTab === 'discussions' && (
        <>
          <div className="my-3 flex flex-col gap-4 rounded-lg">
            <DiscussionSearchBar currentFilters={filters} onFilterChange={applyFilters} onReset={resetAllFilters} />
          </div>

          <DiscussionPost search={filters} />
        </>
      )}

      {activeTab === 'users' && <UsersList searchTerm={searchTerm} />}
    </div>
  );
};

export default SearchPage;
