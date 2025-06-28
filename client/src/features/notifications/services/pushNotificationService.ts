import { apiClient } from '@/shared/services/client';

class PushNotificationService {
  private vapidPublicKey: string | null = null;

  /**
   * Convert base64 string to Uint8Array for applicationServerKey
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Check if push notifications are supported by the browser
   */
  public isPushNotificationSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Check if notifications are allowed
   */
  public async areNotificationsAllowed(): Promise<boolean> {
    if (!this.isPushNotificationSupported()) {
      return false;
    }

    const permission = await this.getNotificationPermission();
    return permission === 'granted';
  }

  /**
   * Get current notification permission status
   */
  public async getNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    return Notification.permission;
  }

  /**
   * Request permission to send notifications
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported in this browser');
    }

    // Return current status if already granted
    if (Notification.permission === 'granted') {
      return 'granted';
    }

    // Return denied if already denied
    if (Notification.permission === 'denied') {
      return 'denied';
    }

    // Otherwise, request permission
    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Register service worker
   */
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported in this browser');
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      return registration;
    } catch (error) {
      console.error('Error registering service worker:', error);
      return null;
    }
  }

  /**
   * Get VAPID public key from server
   */
  public async getVapidPublicKey(): Promise<string> {
    if (this.vapidPublicKey) {
      return this.vapidPublicKey;
    }

    const response = await apiClient.get('/push-notifications/public-key');
    this.vapidPublicKey = response.data.data.publicKey;

    if (!this.vapidPublicKey) {
      throw new Error('VAPID public key is missing from server response');
    }

    return this.vapidPublicKey;
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.isPushNotificationSupported()) {
      throw new Error('Push notifications not supported in this browser');
    }

    try {
      // Request notification permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Register service worker if not registered
      const swRegistration = await navigator.serviceWorker.ready;

      // Get existing subscription
      const existingSubscription = await swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        return existingSubscription;
      }

      // Get VAPID public key
      const publicKey = await this.getVapidPublicKey();
      if (!publicKey) {
        throw new Error('Failed to get VAPID public key');
      }

      // Create new subscription
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      await this.saveSubscription(subscription);

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  /**
   * Save subscription on the server
   */
  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    try {
      await apiClient.post('/push-notifications/subscribe', {
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribeFromPushNotifications(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        return true; // Already unsubscribed
      }

      // Send unsubscribe request to server
      const endpoint = encodeURIComponent(subscription.endpoint);
      await apiClient.delete(`/push-notifications/unsubscribe/${endpoint}`);

      // Unsubscribe locally
      await subscription.unsubscribe();
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  /**
   * Deactivate push notification subscription (for logout)
   */
  public async deactivateSubscription(): Promise<boolean> {
    try {
      if (!this.isPushNotificationSupported()) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        return true; // No subscription to deactivate
      }

      // Tell server to mark this subscription as inactive
      await apiClient.post('/push-notifications/deactivate', {
        endpoint: subscription.endpoint,
      });

      return true;
    } catch (error) {
      console.error('Error deactivating push subscription:', error);
      return false;
    }
  }

  /**
   * Reactivate push notification subscription (for login)
   */
  public async reactivateSubscription(): Promise<boolean> {
    try {
      if (!this.isPushNotificationSupported()) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        return false; // No subscription to reactivate, user needs to subscribe
      }

      // Tell server to mark this subscription as active again
      await apiClient.post('/push-notifications/reactivate', {
        endpoint: subscription.endpoint,
      });

      return true;
    } catch (error) {
      console.error('Error reactivating push subscription:', error);
      return false;
    }
  }

  /**
   * Send a test notification to check if everything works
   */
  public async sendTestNotification(): Promise<void> {
    try {
      new Notification('Test Notification', {
        body: 'This is a test notification from UPNVJ Forum',
        icon: '/upnvj-forum-logo.png',
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
