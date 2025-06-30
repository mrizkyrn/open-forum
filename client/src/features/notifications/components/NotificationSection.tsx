import { Notification } from '@/features/notifications/types';
import NotificationItem from './NotificationItem';

interface NotificationSectionProps {
  title: string;
  notifications: Notification[];
  onRead: (notificationId: number) => void;
  onDelete: (notificationId: number) => void;
  onClick: (notification: Notification) => void;
  newNotifications?: Record<number, boolean>;
  isDeletingId?: number;
  isMarkingReadId?: number;
}

const NotificationSection = ({
  title,
  notifications,
  onRead,
  onDelete,
  onClick,
  newNotifications = {},
  isDeletingId,
  isMarkingReadId,
}: NotificationSectionProps) => {
  if (notifications.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <div className="ml-4 h-px flex-1 bg-gray-200"></div>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <ul className="divide-y divide-gray-200">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              isNew={!!newNotifications[notification.id]}
              onRead={onRead}
              onDelete={onDelete}
              onClick={onClick}
              isDeleting={isDeletingId === notification.id}
              isMarkingAsRead={isMarkingReadId === notification.id}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NotificationSection;
