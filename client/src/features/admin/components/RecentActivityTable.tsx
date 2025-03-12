import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  User,
  Flag,
  Bookmark,
  ThumbsUp,
  MessageCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'discussion' | 'comment' | 'user' | 'report' | 'login' | 'vote' | 'bookmark';
  user: {
    id: number;
    name: string;
    avatarUrl?: string | null;
  };
  target?: {
    id: number;
    title?: string;
    type?: string;
  };
  action: string;
  createdAt: string;
  details?: string;
}

interface RecentActivityTableProps {
  items: ActivityItem[];
  loading?: boolean;
}

// Activity type icons
const ACTIVITY_ICONS = {
  discussion: <MessageSquare size={18} className="text-green-500" />,
  comment: <MessageCircle size={18} className="text-blue-500" />,
  user: <User size={18} className="text-purple-500" />,
  report: <Flag size={18} className="text-red-500" />,
  login: <User size={18} className="text-gray-500" />,
  vote: <ThumbsUp size={18} className="text-yellow-600" />,
  bookmark: <Bookmark size={18} className="text-indigo-500" />,
};

const RecentActivityTable: React.FC<RecentActivityTableProps> = ({ items, loading = false }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'createdAt' | 'type' | 'action'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Toggle expanded state
  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedItems(newSet);
  };

  // Handle sort change
  const handleSort = (field: 'createdAt' | 'type' | 'action') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'action':
        comparison = a.action.localeCompare(b.action);
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Format activity description
  const getActivityDescription = (item: ActivityItem) => {
    const target = item.target ? (
      <span className="font-medium">{item.target.title || `${item.target.type} #${item.target.id}`}</span>
    ) : null;

    switch (item.type) {
      case 'discussion':
        return (
          <>
            {item.action} discussion {target}
          </>
        );
      case 'comment':
        return (
          <>
            {item.action} a comment on {target}
          </>
        );
      case 'user':
        return <>{item.action}</>;
      case 'report':
        return (
          <>
            {item.action} {target}
          </>
        );
      case 'login':
        return <>logged in</>;
      case 'vote':
        return (
          <>
            {item.action} {target}
          </>
        );
      case 'bookmark':
        return (
          <>
            {item.action} {target}
          </>
        );
      default:
        return <>{item.action}</>;
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 w-5 rounded-full bg-gray-200"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-24 rounded bg-gray-200"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-40 rounded bg-gray-200"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-20 rounded bg-gray-200"></div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (!items.length) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center">
        <AlertTriangle size={40} className="mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-500">No recent activity found</p>
        <p className="mt-2 text-gray-400">Activity will appear here as users interact with the platform</p>
      </div>
    );
  }

  // Render table with data
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-6 py-3 text-left"></th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase hover:bg-gray-100"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center space-x-1">
                  <span>Type</span>
                  <span className="inline-flex flex-col">
                    <ChevronUp
                      size={12}
                      className={sortField === 'type' && sortDirection === 'asc' ? 'text-gray-800' : 'text-gray-400'}
                    />
                    <ChevronDown
                      size={12}
                      className={sortField === 'type' && sortDirection === 'desc' ? 'text-gray-800' : 'text-gray-400'}
                    />
                  </span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">User</th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase hover:bg-gray-100"
                onClick={() => handleSort('action')}
              >
                <div className="flex items-center space-x-1">
                  <span>Activity</span>
                  <span className="inline-flex flex-col">
                    <ChevronUp
                      size={12}
                      className={sortField === 'action' && sortDirection === 'asc' ? 'text-gray-800' : 'text-gray-400'}
                    />
                    <ChevronDown
                      size={12}
                      className={sortField === 'action' && sortDirection === 'desc' ? 'text-gray-800' : 'text-gray-400'}
                    />
                  </span>
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase hover:bg-gray-100"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center space-x-1">
                  <span>Time</span>
                  <span className="inline-flex flex-col">
                    <ChevronUp
                      size={12}
                      className={
                        sortField === 'createdAt' && sortDirection === 'asc' ? 'text-gray-800' : 'text-gray-400'
                      }
                    />
                    <ChevronDown
                      size={12}
                      className={
                        sortField === 'createdAt' && sortDirection === 'desc' ? 'text-gray-800' : 'text-gray-400'
                      }
                    />
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedItems.map((item) => (
              <>
                <tr key={item.id} className="cursor-pointer hover:bg-gray-50" onClick={() => toggleExpand(item.id)}>
                  <td className="px-4 py-4 text-center">
                    <button className="rounded p-1 hover:bg-gray-200">
                      {expandedItems.has(item.id) ? (
                        <ChevronDown size={16} className="text-gray-500" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {ACTIVITY_ICONS[item.type] || <AlertTriangle size={18} className="text-gray-400" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-200">
                        {item.user.avatarUrl ? (
                          <img
                            src={item.user.avatarUrl}
                            alt={item.user.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-500">
                            {item.user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{getActivityDescription(item)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    <time dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString()}>
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </time>
                  </td>
                </tr>
                {expandedItems.has(item.id) && item.details && (
                  <tr key={`${item.id}-details`} className="bg-gray-50">
                    <td className="px-4 py-2"></td>
                    <td colSpan={4} className="px-6 py-3">
                      <div className="rounded-md border border-gray-200 bg-white p-3 text-sm">
                        <div className="font-medium text-gray-700">Details</div>
                        <p className="mt-1 whitespace-pre-wrap text-gray-600">{item.details}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentActivityTable;
