import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  AtSign,
  Bell,
  Check,
  Loader2,
  MessageSquare,
  Shield,
  ShieldCheck,
  ShieldX,
  ThumbsUp,
  Trash2,
} from 'lucide-react';

import { Notification, NotificationType } from '@/features/notifications/types';
import UserAvatar from '@/features/users/components/UserAvatar';

interface NotificationItemProps {
  notification: Notification;
  isNew?: boolean;
  onRead: (notificationId: number) => void;
  onDelete: (notificationId: number) => void;
  onClick: (notification: Notification) => void;
  isDeleting?: boolean;
  isMarkingAsRead?: boolean;
}

const NotificationItem = ({
  notification,
  isNew = false,
  onRead,
  onDelete,
  onClick,
  isDeleting = false,
  isMarkingAsRead = false,
}: NotificationItemProps) => {
  const isReportNotification = notification.type === NotificationType.REPORT_REVIEWED;

  // Determine the highlight color based on notification type and status
  let highlightClass = notification.isRead ? 'bg-white' : 'bg-blue-50';

  if (isNew) {
    highlightClass = 'animate-pulse-highlight border-l-4 border-yellow-400';
  } else if (isReportNotification && !notification.isRead) {
    // Special styling for report notifications based on status
    if (notification.data?.status === 'resolved') {
      highlightClass = 'bg-green-50 border-l-4 border-green-400';
    } else if (notification.data?.status === 'dismissed') {
      highlightClass = 'bg-orange-50 border-l-4 border-orange-400';
    } else {
      highlightClass = 'bg-blue-50 border-l-4 border-blue-400';
    }
  }

  return (
    <li className={`relative transition-all ${highlightClass}`}>
      <div className="flex items-start px-4 py-4 sm:px-6">
        {/* Left: Icon or avatar */}
        <div className="mr-4 flex-shrink-0">
          {!notification.actor || notification.type === NotificationType.REPORT_REVIEWED ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              {getNotificationIcon(notification)}
            </div>
          ) : (
            <UserAvatar fullName={notification.actor.fullName} avatarUrl={notification.actor.avatarUrl} size="sm" />
          )}
        </div>

        {/* Center: Content */}
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onClick(notification)}>
          <div className="block focus:outline-none">
            <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
              {getNotificationMessage(notification)}
            </p>

            {/* For report notifications, show the reported content excerpt */}
            {isReportNotification && notification.data?.contentPreview && (
              <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                <span className="font-medium">
                  {notification.data.targetType === 'discussion' ? 'Discussion' : 'Comment'}:{' '}
                </span>
                {notification.data.contentPreview}
              </p>
            )}

            {/* For regular comment notifications, show comment content */}
            {!isReportNotification && notification.data?.contentPreview && (
              <p className="mt-1 line-clamp-1 text-sm text-gray-500">{notification.data.contentPreview}</p>
            )}

            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(notification.createdAt))}</span>

              {/* Report status badge */}
              {isReportNotification && notification.data?.status && (
                <>
                  <span className="text-gray-400">•</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      notification.data.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : notification.data.status === 'dismissed'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {notification.data.status === 'resolved' ? 'Resolved' : 'Dismissed'}
                  </span>
                </>
              )}

              {/* Content deleted indicator */}
              {isReportNotification && (notification.data?.contentDeleted || notification.data?.isContentDeleted) && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                    Content removed
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
              onClick={(e) => {
                e.stopPropagation();
                onRead(notification.id);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Mark as read"
              disabled={isMarkingAsRead}
            >
              {isMarkingAsRead ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-red-100 hover:text-red-600"
            aria-label="Delete notification"
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </li>
  );
};

// Helper function to get notification icon
const getNotificationIcon = (notification: Notification) => {
  const { type, data } = notification;

  switch (type) {
    case NotificationType.DISCUSSION_UPVOTE:
    case NotificationType.COMMENT_UPVOTE:
      return <ThumbsUp className="h-5 w-5 text-blue-500" />;
    case NotificationType.NEW_COMMENT:
    case NotificationType.NEW_REPLY:
      return <MessageSquare className="h-5 w-5 text-green-500" />;
    case NotificationType.USER_MENTIONED:
      return <AtSign className="h-5 w-5 text-blue-500" />;
    case NotificationType.REPORT_REVIEWED: {
      if (data?.recipientType === 'content_author' && data.contentDeleted) {
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      }

      if (data?.status === 'resolved') {
        return <ShieldCheck className="h-5 w-5 text-green-500" />;
      } else if (data?.status === 'dismissed') {
        return <ShieldX className="h-5 w-5 text-orange-500" />;
      } else {
        return <Shield className="h-5 w-5 text-blue-500" />;
      }
    }

    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

// Helper function to get notification message
const getNotificationMessage = (notification: Notification) => {
  const { type, actor, data } = notification;
  const actorName = actor ? actor.fullName : 'A moderator';

  switch (type) {
    case NotificationType.DISCUSSION_UPVOTE:
      return `${actorName} upvoted your discussion`;
    case NotificationType.COMMENT_UPVOTE:
      return `${actorName} upvoted your comment`;
    case NotificationType.NEW_COMMENT:
      return `${actorName} commented on your discussion`;
    case NotificationType.NEW_REPLY:
      return `${actorName} replied to your comment`;
    case NotificationType.USER_MENTIONED:
      return `${actorName} mentioned you in a comment`;
    case NotificationType.REPORT_REVIEWED: {
      // If there's a specific message sent from the server, use it
      if (data?.message) {
        return data.message;
      }

      // Otherwise, build an appropriate message based on recipient type
      const contentType = data?.targetType === 'discussion' ? 'discussion' : 'comment';
      const contentDeleted = data?.contentDeleted || false;

      // Different messages based on the recipient type
      if (data?.recipientType === 'content_author') {
        return contentDeleted
          ? `Your ${contentType} has been removed for violating community guidelines`
          : `Your reported ${contentType} has been reviewed by ${actorName}`;
      } else {
        return contentDeleted ? `Content you reported has been removed` : 'Your report has been reviewed';
      }
    }

    default:
      return `You have a new notification`;
  }
};

export default NotificationItem;
