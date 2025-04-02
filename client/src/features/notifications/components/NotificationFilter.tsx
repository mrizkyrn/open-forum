import { RefreshCw } from 'lucide-react';
import React from 'react';

type FilterType = 'all' | 'read' | 'unread';

interface NotificationFilterProps {
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onRefresh: () => void;
  unreadCount: number;
}

const NotificationFilter: React.FC<NotificationFilterProps> = ({
  selectedFilter,
  onFilterChange,
  onRefresh,
  unreadCount,
}) => {
  return (
    <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          {unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
            : 'All caught up!'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center rounded-md border border-gray-200 bg-white">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 text-sm ${
              selectedFilter === 'all' ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onFilterChange('unread')}
            className={`px-3 py-1.5 text-sm ${
              selectedFilter === 'unread' ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => onFilterChange('read')}
            className={`px-3 py-1.5 text-sm ${
              selectedFilter === 'read' ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Read
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};

export default NotificationFilter;
