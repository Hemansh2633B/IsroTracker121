const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY; // Vite way to access env vars

/**
 * Checks if service workers and push messaging are supported by the browser.
 */
function checkSupport(): boolean {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported by this browser.');
    return false;
  }
  if (!('PushManager' in window)) {
    console.warn('Push messaging is not supported by this browser.');
    return false;
  }
  return true;
}

/**
 * Registers the service worker.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!checkSupport()) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js'); // Path relative to public directory
    console.log('Service Worker registered with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Requests permission for notifications.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!checkSupport()) return 'default'; // Or throw error

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    console.log('Notification permission granted.');
  } else {
    console.warn('Notification permission denied.');
  }
  return permission;
}

/**
 * Subscribes the user to push notifications.
 */
export async function subscribeUserToPush(): Promise<PushSubscription | null> {
  if (!checkSupport()) return null;

  const registration = await navigator.serviceWorker.ready; // Ensures SW is active
  if (!registration.pushManager) {
    console.warn('PushManager not available on service worker registration.');
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID public key is not defined. Cannot subscribe.');
    // alert('Push notification setup error: Missing VAPID public key.');
    return null;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    console.log('User is subscribed:', subscription);
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe the user: ', error);
    if (Notification.permission === 'denied') {
      console.warn('Permission for notifications was denied.');
    }
    return null;
  }
}

/**
 * Sends the push subscription to the backend server.
 * @param subscription The PushSubscription object.
 */
export async function sendSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to send subscription to server:', await response.text());
      return false;
    }
    console.log('Subscription sent to server successfully.');
    return true;
  } catch (error) {
    console.error('Error sending subscription to server:', error);
    return false;
  }
}

/**
 * Unsubscribes the user from push notifications.
 */
export async function unsubscribeUserFromPush(): Promise<boolean> {
  if (!checkSupport()) return false;

  const registration = await navigator.serviceWorker.ready;
  if (!registration.pushManager) {
    console.warn('PushManager not available.');
    return false;
  }

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const successful = await subscription.unsubscribe();
      if (successful) {
        console.log('User unsubscribed successfully.');
        // Optionally, notify the backend that the user has unsubscribed
        // await fetch('/api/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint: subscription.endpoint }) });
        return true;
      } else {
        console.error('Failed to unsubscribe user.');
        return false;
      }
    } else {
      console.log('User was not subscribed.');
      return true; // No active subscription to unsubscribe from
    }
  } catch (error) {
    console.error('Error unsubscribing user: ', error);
    return false;
  }
}


// Helper function to convert VAPID public key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
