import { CheckCircle, Loader2, Trash2 } from 'lucide-react';
import React from 'react';
import NotificationSettings from './NotificationSetting';

interface NotificationActionBarProps {
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  isMarkingAllAsRead: boolean;
  isDeletingAll: boolean;
  hasNotifications: boolean;
  unreadCount: number;
}

const NotificationActionBar: React.FC<NotificationActionBarProps> = ({
  onMarkAllAsRead,
  onClearAll,
  isMarkingAllAsRead,
  isDeletingAll,
  hasNotifications,
  unreadCount,
}) => {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <NotificationSettings />

      <div className="flex gap-2">
        <button
          onClick={onMarkAllAsRead}
          className="flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
          disabled={isMarkingAllAsRead || unreadCount === 0}
        >
          {isMarkingAllAsRead ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5" />
          )}
          <span>Mark all as read</span>
        </button>

        <button
          onClick={onClearAll}
          className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
          disabled={isDeletingAll || !hasNotifications}
        >
          {isDeletingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          <span>Clear all</span>
        </button>
      </div>
    </div>
  );
};

export default NotificationActionBar;
