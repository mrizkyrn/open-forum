// Cache name for PWA
const CACHE_NAME = 'upnvj-forum-v1';

// Listen for push events
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    console.log('Push event received:', payload);

    const notificationOptions = {
      body: payload.body,
      icon: '/upnvj-forum-logo.png',
      badge: '/favicon.ico',
      data: payload.data || {},
      actions: payload.actions || [],
      tag: `notification-${payload.data?.notificationId || Date.now()}`,
    };

    // Display notification
    event.waitUntil(self.registration.showNotification(payload.title, notificationOptions));
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
  const notification = event.notification;
  notification.close();

  // Get URL from notification data
  let targetUrl = self.location.origin;
  if (notification.data && notification.data.url) {
    targetUrl = notification.data.url;
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window' })
      .then((clientList) => {
        // First try to find any focused client
        for (const client of clientList) {
          if (client.focused && 'navigate' in client) {
            return client.navigate(targetUrl).then((client) => client.focus());
          }
        }

        // If no focused client, use any client from the same origin
        for (const client of clientList) {
          if ('navigate' in client) {
            return client.navigate(targetUrl).then((client) => client.focus());
          }
        }

        // If no client is available, open a new window
        return clients.openWindow(targetUrl);
      })
      .catch((error) => {
        console.error('Error handling notification click:', error);
        // Fallback to simply opening a new window if anything fails
        return clients.openWindow(targetUrl);
      }),
  );
});

// Handle cache and offline functionality
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
