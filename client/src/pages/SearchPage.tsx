import { MessageSquare, User } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { DiscussionFeed, DiscussionFilters } from '@/features/discussions/components';
import { DiscussionQueryParams, DiscussionSortBy } from '@/features/discussions/types';
import UsersList from '@/features/users/components/UsersList';
import TabNavigation from '@/shared/components/layouts/TabNavigation';
import BackButton from '@/shared/components/ui/buttons/BackButton';
import { SortOrder } from '@/shared/types/RequestTypes';

type SearchTab = 'discussions' | 'users';

const TAB_CONFIG = {
  discussions: {
    icon: <MessageSquare size={16} />,
    label: 'Discussions',
  },
  users: {
    icon: <User size={16} />,
    label: 'Users',
  },
} as const;

const SearchPage = () => {
  const [activeTab, setActiveTab] = useState<SearchTab>('discussions');

  const [filterParams, setFilterParams] = useSearchParams();
  const navigate = useNavigate();

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
    (filters: Partial<DiscussionQueryParams>) => {
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

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
  };

  // Redirect to explore if no search params
  useEffect(() => {
    if (!filterParams.get('q') && !filterParams.get('tags')) {
      navigate('/explore', { replace: true });
    }
  }, [filterParams, navigate]);

  return (
    <div className="w-full">
      {/* Back Button */}
      {searchTerm ? (
        <BackButton backTo="/explore" text={`Results for "${searchTerm}"`} />
      ) : (
        <BackButton backTo="/explore" text="Explore" />
      )}

      <TabNavigation
        tabs={TAB_CONFIG}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className="mb-4"
        ariaLabel="Search Tabs"
      />

      {activeTab === 'discussions' && (
        <>
          <div className="mb-3 flex flex-col gap-4 rounded-lg">
            <DiscussionFilters currentFilters={filters} onFilterChange={applyFilters} onReset={resetAllFilters} />
          </div>

          <DiscussionFeed search={filters} />
        </>
      )}

      {activeTab === 'users' && <UsersList searchTerm={searchTerm} />}
    </div>
  );
};

export default SearchPage;
