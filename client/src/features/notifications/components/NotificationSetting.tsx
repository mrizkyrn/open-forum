import { usePushNotifications } from '@/features/notifications/hooks/usePushNotifications';
import { Bell, BellOff, Loader2 } from 'lucide-react';

interface NotificationSettingsProps {
  className?: string;
}

const NotificationSettings = ({ className }: NotificationSettingsProps) => {
  const { isSupported, permission, subscription, subscribe, unsubscribe, loading } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className={`rounded-md bg-gray-50 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <BellOff className="h-5 w-5 text-gray-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">Push notifications not supported</h3>
          </div>
        </div>
      </div>
    );
  }

  const isSubscribed = permission === 'granted' && subscription !== null;

  const handleTogglePushNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <div className={`rounded-md bg-white ${className}`}>
      <div className="flex items-center gap-3">
        {/* Bell icon button that toggles notifications */}
        <button
          onClick={handleTogglePushNotifications}
          disabled={loading || permission === 'denied'}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            isSubscribed ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          } ${permission === 'denied' ? 'cursor-not-allowed opacity-50' : ''} focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none`}
          aria-label={isSubscribed ? 'Disable push notifications' : 'Enable push notifications'}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>{isSubscribed ? <Bell className="h-4 w-4 fill-blue-600" /> : <BellOff className="h-4 w-4" />}</>
          )}
        </button>
        <h3 className={`text-sm font-medium ${isSubscribed ? 'text-blue-900' : 'text-gray-900'}`}>
          Push Notifications
        </h3>
      </div>

      {permission === 'denied' && (
        <div className="mt-3 rounded-md bg-yellow-50 p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <BellOff className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Notifications are blocked. Please update your browser settings to enable notifications.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
