import { useAuth } from '@/features/auth/hooks/useAuth';
import { pushNotificationService } from '@/features/notifications/services/pushNotificationService';
import { useEffect, useState } from 'react';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const { isAuthenticated } = useAuth();

  // Check support and permission on load
  useEffect(() => {
    async function checkSupport() {
      try {
        const supported = pushNotificationService.isPushNotificationSupported();
        setIsSupported(supported);

        if (supported) {
          const currentPermission = await pushNotificationService.getNotificationPermission();
          setPermission(currentPermission);

          // Register service worker
          await pushNotificationService.registerServiceWorker();

          // If already granted, get existing subscription
          if (currentPermission === 'granted' && isAuthenticated) {
            const registration = await navigator.serviceWorker.ready;
            const existingSub = await registration.pushManager.getSubscription();
            setSubscription(existingSub);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    checkSupport();
  }, [isAuthenticated]);

  // Subscribe to push notifications
  const subscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const sub = await pushNotificationService.subscribeToPushNotifications();
      setSubscription(sub);
      setPermission('granted');
      return sub;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await pushNotificationService.unsubscribeFromPushNotifications();
      if (result) {
        setSubscription(null);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    loading,
    error,
    subscribe,
    unsubscribe,
  };
}
