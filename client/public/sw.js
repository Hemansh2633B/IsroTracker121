// Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data ? event.data.text() : 'no data'}"`);

  const pushData = event.data ? event.data.json() : {};

  const title = pushData.title || 'ISRO App Notification';
  const options = {
    body: pushData.body || 'You have a new update!',
    icon: pushData.icon || '/client/src/assets/isro-logo.svg', // Path to app icon, adjust if needed
    badge: pushData.badge || '/client/src/assets/isro-logo.svg', // Path to badge icon
    data: {
      url: pushData.url || '/', // URL to open on notification click
    },
    // actions: pushData.actions || [] // Example: [{ action: 'explore', title: 'Explore' }]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(function(clientList) {
      // Check if there's already a tab open for this URL.
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // Adjust the URL check if your app uses a different base path
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no tab is open, open a new one.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Optional: Listen for subscription changes if you implement a mechanism
// for the server to indicate that a subscription is no longer valid.
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[Service Worker]: \'pushsubscriptionchange\' event fired.');
  // Here you might want to re-subscribe the user and send the new subscription to your server.
  // For simplicity, this is not fully implemented here.
  // const newSubscription = await self.registration.pushManager.subscribe(event.oldSubscription.options);
  // sendSubscriptionToServer(newSubscription); // You'd need to implement this.
});

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  // Perform install steps, like caching assets if needed
  // For push notifications, often just an empty install handler or skipWaiting is enough
  self.skipWaiting(); // Activate the new service worker immediately
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  // Perform activate steps, like cleaning up old caches
  event.waitUntil(clients.claim()); // Take control of all open pages
});
