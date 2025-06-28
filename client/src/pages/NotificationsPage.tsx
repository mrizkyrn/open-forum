import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isThisWeek, isToday, isYesterday } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import NotificationActionBar from '@/features/notifications/components/NotificatinoActionBar';
import NotificationFilter from '@/features/notifications/components/NotificationFilter';
import NotificationSection from '@/features/notifications/components/NotificationSection';
import { notificationApi } from '@/features/notifications/services/notificationApi';
import { Notification, NotificationEntityType, NotificationType } from '@/features/notifications/types';
import FeedbackDisplay from '@/shared/components/feedback/FeedbackDisplay';
import LoadingIndicator from '@/shared/components/feedback/LoadingIndicator';
import ConfirmationModal from '@/shared/components/modals/ConfirmationModal';
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver';

const NOTIFICATIONS_PER_PAGE = 10;

const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [initialLoadTime] = useState(new Date());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newlyArrivedNotifications, setNewlyArrivedNotifications] = useState<Record<number, boolean>>({});
  const [deletingId, setDeletingId] = useState<number | undefined>();
  const [markingReadId, setMarkingReadId] = useState<number | undefined>();

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['notifications', 'infinite', NOTIFICATIONS_PER_PAGE, filter],
    queryFn: async ({ pageParam = 1 }) => {
      return notificationApi.getNotifications({
        page: pageParam,
        limit: NOTIFICATIONS_PER_PAGE,
        ...(filter !== 'all' ? { isRead: filter === 'read' } : {}),
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const { entry, observerRef } = useIntersectionObserver({
    threshold: 0.5,
    enabled: !!hasNextPage && !isFetchingNextPage,
  });

  // Trigger loading more when intersection observer fires
  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage, hasNextPage]);

  // Flatten all notifications from all pages
  const allNotifications = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) || [];
  }, [data?.pages]);

  // Detect new notifications
  useEffect(() => {
    if (allNotifications.length) {
      const newNotifications: Record<number, boolean> = {};

      for (const notification of allNotifications) {
        const notificationDate = new Date(notification.createdAt);
        if (notificationDate > initialLoadTime && !notification.isRead) {
          newNotifications[notification.id] = true;
        }
      }

      setNewlyArrivedNotifications(newNotifications);
    }
  }, [allNotifications, initialLoadTime]);

  const markAsReadMutation = useMutation({
    mutationFn: (ids: number[]) => notificationApi.markAsRead(ids),
    onMutate: (ids) => {
      if (ids.length === 1) setMarkingReadId(ids[0]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      setMarkingReadId(undefined);
    },
    onError: () => {
      toast.error('Failed to mark notification as read');
      setMarkingReadId(undefined);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
    onError: () => toast.error('Failed to mark all notifications as read'),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => notificationApi.deleteNotification(id),
    onMutate: (id) => {
      setDeletingId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      setDeletingId(undefined);
    },
    onError: () => {
      toast.error('Failed to delete notification');
      setDeletingId(undefined);
    },
  });

  const deleteAllNotificationsMutation = useMutation({
    mutationFn: () => notificationApi.deleteAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
    onError: () => toast.error('Failed to delete all notifications'),
  });

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

  // Compute grouped notifications from all pages
  const groupedNotifications = useMemo(
    () => (allNotifications.length ? groupNotificationsByDate(allNotifications) : null),
    [allNotifications],
  );

  const unreadCount = allNotifications.filter((n) => !n.isRead).length || 0;
  const hasNotifications = allNotifications.length > 0;

  // Handlers
  const handleDeleteNotification = (id: number) => {
    deleteNotificationMutation.mutate(id);
  };

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate([id]);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleClearAll = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    deleteAllNotificationsMutation.mutate();
    setShowDeleteConfirm(false);
  };

  // Handle notification click and navigation
  const handleNotificationClick = (notification: Notification) => {
    // If notification is not read, mark it as read
    if (!notification.isRead) {
      markAsReadMutation.mutate([notification.id]);
    }

    // Navigate to the appropriate page
    navigate(getNotificationLink(notification));
  };

  // Helper to generate the right link based on notification type
  const getNotificationLink = (notification: Notification) => {
    const { entityType, entityId, type, data } = notification;

    if (type === NotificationType.REPORT_REVIEWED) {
      if (data?.discussionId) {
        return `/discussions/${data.discussionId}${data?.targetId && data?.targetType === 'comment' ? `?comment=${data.targetId}` : ''}`;
      }
      return '/reports';
    }

    if (entityType === NotificationEntityType.DISCUSSION) {
      return `/discussions/${entityId}`;
    } else if (entityType === NotificationEntityType.COMMENT) {
      return `/discussions/${data.discussionId}?comment=${entityId}`;
    }

    return '#';
  };

  return (
    <>
      {/* Filter and header */}
      <NotificationFilter
        selectedFilter={filter}
        onFilterChange={(newFilter) => {
          setFilter(newFilter);
          // Reset any cached data when filter changes
          queryClient.resetQueries({ queryKey: ['notifications', 'infinite'] });
        }}
        onRefresh={() => refetch()}
        unreadCount={unreadCount}
      />

      {/* Action bar */}
      <NotificationActionBar
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
        isMarkingAllAsRead={markAllAsReadMutation.isPending}
        isDeletingAll={deleteAllNotificationsMutation.isPending}
        hasNotifications={!!hasNotifications}
        unreadCount={unreadCount}
      />

      {/* Content area */}
      {isLoading ? (
        <LoadingIndicator fullWidth vertical text="Loading notifications..." />
      ) : isError ? (
        <FeedbackDisplay
          title="Failed to load notifications"
          description="There was an error retrieving your notifications."
          variant="error"
          size="lg"
          actions={[
            {
              label: 'Try again',
              icon: RefreshCw,
              onClick: () => refetch(),
              variant: 'danger',
            },
          ]}
        />
      ) : !hasNotifications ? (
        <FeedbackDisplay
          title="No notifications"
          description="You're all caught up! New notifications will appear here."
          size="lg"
          variant="default"
        />
      ) : (
        <div className="space-y-8">
          {/* Only render sections that have notifications */}
          {groupedNotifications?.today && groupedNotifications.today.length > 0 && (
            <NotificationSection
              title="Today"
              notifications={groupedNotifications.today}
              onRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
              onClick={handleNotificationClick}
              newNotifications={newlyArrivedNotifications}
              isDeletingId={deletingId}
              isMarkingReadId={markingReadId}
            />
          )}

          {groupedNotifications?.yesterday && groupedNotifications.yesterday.length > 0 && (
            <NotificationSection
              title="Yesterday"
              notifications={groupedNotifications.yesterday}
              onRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
              onClick={handleNotificationClick}
              newNotifications={newlyArrivedNotifications}
              isDeletingId={deletingId}
              isMarkingReadId={markingReadId}
            />
          )}

          {groupedNotifications?.thisWeek && groupedNotifications.thisWeek.length > 0 && (
            <NotificationSection
              title="This Week"
              notifications={groupedNotifications.thisWeek}
              onRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
              onClick={handleNotificationClick}
              newNotifications={newlyArrivedNotifications}
              isDeletingId={deletingId}
              isMarkingReadId={markingReadId}
            />
          )}

          {groupedNotifications?.earlier && groupedNotifications.earlier.length > 0 && (
            <NotificationSection
              title="Earlier"
              notifications={groupedNotifications.earlier}
              onRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
              onClick={handleNotificationClick}
              newNotifications={newlyArrivedNotifications}
              isDeletingId={deletingId}
              isMarkingReadId={markingReadId}
            />
          )}

          {/* Loading indicator for infinite scroll */}
          {hasNextPage && (
            <div ref={observerRef} className="flex items-center justify-center py-4">
              {isFetchingNextPage ? (
                <LoadingIndicator text="Loading more notifications..." size="sm" type="dots" />
              ) : (
                <div className="h-8 w-full" />
              )}
            </div>
          )}

          {/* End of list message */}
          {!hasNextPage && allNotifications.length > 5 && (
            <div className="py-4 text-center text-sm text-gray-500">You've reached the end of your notifications</div>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Clear all notifications"
        message="Are you sure you want to clear all notifications? This action cannot be undone."
        confirmButtonText="Delete"
        variant="danger"
        isProcessing={deleteAllNotificationsMutation.isPending}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default NotificationsPage;
