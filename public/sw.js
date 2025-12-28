
// Service Worker for Community Festival Event App
const CACHE_NAME = 'community-event-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Focus the window or navigate to updates
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus().then(c => c.navigate('/#/updates'));
      }
      return clients.openWindow('/#/updates');
    })
  );
});

// Handle push events (for future server integration)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'New Update', body: 'A new ritual update is available.' };
  const options = {
    body: data.body,
    icon: '/icon-192.png', // Placeholder icon path
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});
