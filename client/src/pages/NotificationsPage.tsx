import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCircle,
  Trash2,
  ThumbsUp,
  MessageSquare,
  AlertCircle,
  Loader2,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';
import AvatarImage from '@/features/users/components/AvatarImage';
import { toast } from 'react-toastify';
import { notificationApi } from '@/features/notifications/services/notificationApi';
import { NotificationEntityType, NotificationType, Notification } from '@/features/notifications/types';
import Pagination from '@/features/admin/components/Pagination';

const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', page, limit, filter],
    queryFn: () =>
      notificationApi.getNotifications({
        page,
        limit,
        ...(filter !== 'all' ? { isRead: filter === 'read' } : {}),
      }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (ids: number[]) => notificationApi.markAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Failed to mark all notifications as read'),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      toast.success('Notification deleted');
    },
    onError: () => toast.error('Failed to delete notification'),
  });

  const deleteAllNotificationsMutation = useMutation({
    mutationFn: () => notificationApi.deleteAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      toast.success('All notifications deleted');
    },
    onError: () => toast.error('Failed to delete all notifications'),
  });

  // Helper to generate the right link based on notification type
  const getNotificationLink = (notification: Notification) => {
    const { entityType, entityId } = notification;

    if (entityType === NotificationEntityType.DISCUSSION) {
      return `/discussions/${entityId}`;
    } else if (entityType === NotificationEntityType.COMMENT) {
      // If it's a comment, we need the discussion ID from the data
      return `/discussions/${notification.data.discussionId}?highlight=${entityId}`;
    }

    return '#';
  };

  // Helper to generate notification message
  const getNotificationMessage = (notification: Notification) => {
    const { type, actor } = notification;
    const actorName = actor ? actor.fullName : 'Someone';

    switch (type) {
      case NotificationType.DISCUSSION_UPVOTE:
        return `${actorName} upvoted your discussion`;
      case NotificationType.COMMENT_UPVOTE:
        return `${actorName} upvoted your comment`;
      case NotificationType.COMMENT_ON_DISCUSSION:
        return `${actorName} commented on your discussion`;
      case NotificationType.REPLY_TO_COMMENT:
        return `${actorName} replied to your comment`;
      case NotificationType.MENTION:
        return `${actorName} mentioned you`;
      case NotificationType.REPORT_STATUS_UPDATE:
        return `There's an update on your report`;
      case NotificationType.SPACE_FOLLOW:
        return `${actorName} followed your space`;
      case NotificationType.CONTENT_MODERATION:
        return `Your content has been moderated`;
      default:
        return `You have a new notification`;
    }
  };

  // Helper to get the notification icon
  const getNotificationIcon = (notification: Notification) => {
    const { type } = notification;

    switch (type) {
      case NotificationType.DISCUSSION_UPVOTE:
      case NotificationType.COMMENT_UPVOTE:
        return <ThumbsUp className="h-5 w-5 text-blue-500" />;
      case NotificationType.COMMENT_ON_DISCUSSION:
      case NotificationType.REPLY_TO_COMMENT:
      case NotificationType.MENTION:
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case NotificationType.REPORT_STATUS_UPDATE:
      case NotificationType.CONTENT_MODERATION:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case NotificationType.SPACE_FOLLOW:
        return <Bell className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Handle "Mark all as read" button click
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Handle "Clear all" button click
  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all notifications?')) {
      deleteAllNotificationsMutation.mutate();
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // If notification is not read, mark it as read
    if (!notification.isRead) {
      markAsReadMutation.mutate([notification.id]);
    }

    // Navigate to the appropriate link
    navigate(getNotificationLink(notification));
  };

  // Group notifications by date
  const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: Record<string, Notification[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: [],
    };

    notifications.forEach((notification) => {
      const date = new Date(notification.createdAt);
      if (isToday(date)) {
        groups.today.push(notification);
      } else if (isYesterday(date)) {
        groups.yesterday.push(notification);
      } else if (isThisWeek(date)) {
        groups.thisWeek.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });

    return groups;
  };

  const groupedNotifications = data?.items ? groupNotificationsByDate(data.items) : null;

  // Count unread notifications
  const unreadCount = data?.items?.filter((n) => !n.isRead).length || 0;

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  const handlePageSizeChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing page size
  };

  return (
    <div className="mx-auto max-w-4xl">
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
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm ${
                filter === 'all' ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-sm ${
                filter === 'unread' ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1.5 text-sm ${
                filter === 'read' ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Read
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Notification Actions</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
            <span>Mark all as read</span>
          </button>

          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
            disabled={deleteAllNotificationsMutation.isPending || !data?.items?.length}
          >
            {deleteAllNotificationsMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Clear all</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="mt-4 text-sm text-gray-500">Loading your notifications...</p>
        </div>
      ) : isError ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
          <h3 className="mb-1 text-lg font-medium text-red-800">Failed to load notifications</h3>
          <p className="mb-4 text-sm text-red-700">There was an error retrieving your notifications.</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </button>
        </div>
      ) : data?.items.length === 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Bell className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications</h3>
          <p className="mt-1 text-sm text-gray-500">You're all caught up! New notifications will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Today's notifications */}
          {groupedNotifications?.today && groupedNotifications.today.length > 0 && (
            <div>
              <div className="mb-3 flex items-center">
                <h3 className="font-medium text-gray-900">Today</h3>
                <div className="ml-4 h-px flex-1 bg-gray-200"></div>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <ul className="divide-y divide-gray-200">
                  {groupedNotifications.today.map((notification) => renderNotificationItem(notification))}
                </ul>
              </div>
            </div>
          )}

          {/* Yesterday's notifications */}
          {groupedNotifications?.yesterday && groupedNotifications.yesterday.length > 0 && (
            <div>
              <div className="mb-3 flex items-center">
                <h3 className="font-medium text-gray-900">Yesterday</h3>
                <div className="ml-4 h-px flex-1 bg-gray-200"></div>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <ul className="divide-y divide-gray-200">
                  {groupedNotifications.yesterday.map((notification) => renderNotificationItem(notification))}
                </ul>
              </div>
            </div>
          )}

          {/* This week's notifications */}
          {groupedNotifications?.thisWeek && groupedNotifications.thisWeek.length > 0 && (
            <div>
              <div className="mb-3 flex items-center">
                <h3 className="font-medium text-gray-900">This Week</h3>
                <div className="ml-4 h-px flex-1 bg-gray-200"></div>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <ul className="divide-y divide-gray-200">
                  {groupedNotifications.thisWeek.map((notification) => renderNotificationItem(notification))}
                </ul>
              </div>
            </div>
          )}

          {/* Earlier notifications */}
          {groupedNotifications?.earlier && groupedNotifications.earlier.length > 0 && (
            <div>
              <div className="mb-3 flex items-center">
                <h3 className="font-medium text-gray-900">Earlier</h3>
                <div className="ml-4 h-px flex-1 bg-gray-200"></div>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <ul className="divide-y divide-gray-200">
                  {groupedNotifications.earlier.map((notification) => renderNotificationItem(notification))}
                </ul>
              </div>
            </div>
          )}

          {/* Pagination */}
          {data?.meta && (
            <Pagination
              currentPage={data?.meta.currentPage}
              totalPages={data?.meta.totalPages}
              hasNextPage={data?.meta.hasNextPage}
              hasPreviousPage={data?.meta.hasPreviousPage}
              pageSize={limit}
              totalItems={data?.meta.totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[10, 20, 50, 100]}
              maxPageButtons={5}
            />
          )}
        </div>
      )}
    </div>
  );

  // Helper function to render a notification item
  function renderNotificationItem(notification: Notification) {
    return (
      <li key={notification.id} className={`relative ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}>
        <div className="flex items-start px-4 py-4 sm:px-6">
          {/* Left: Icon or avatar */}
          <div className="mr-4 flex-shrink-0">
            {notification.actor ? (
              <AvatarImage fullName={notification.actor.fullName} avatarUrl={notification.actor.avatarUrl} size="sm" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                {getNotificationIcon(notification)}
              </div>
            )}
          </div>

          {/* Center: Content */}
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
            <div className="block focus:outline-none">
              <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                {getNotificationMessage(notification)}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                </span>
                {!notification.isRead && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      New
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="ml-4 flex flex-shrink-0 space-x-2">
            {!notification.isRead && (
              <button
                onClick={() => markAsReadMutation.mutate([notification.id])}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Mark as read"
                disabled={markAsReadMutation.isPending}
              >
                {markAsReadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </button>
            )}

            <button
              onClick={() => deleteNotificationMutation.mutate(notification.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-red-100 hover:text-red-600"
              aria-label="Delete notification"
              disabled={deleteNotificationMutation.isPending}
            >
              {deleteNotificationMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </li>
    );
  }
};

export default NotificationsPage;
