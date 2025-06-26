import webpush from 'web-push';
import { storage, StoredPushSubscription } from './storage'; // Assuming StoredPushSubscription is exported from storage

// VAPID keys should be generated and stored in environment variables
// For development, you can generate them once using: npx web-push generate-vapid-keys
// And then set them in your .env file or server environment
const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY; // Vite uses VITE_ prefix
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

let isVapidConfigured = false;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:admin@example.com', // Replace with your admin email
    vapidPublicKey,
    vapidPrivateKey
  );
  isVapidConfigured = true;
  console.log('Web Push VAPID details configured.');
} else {
  console.warn('VAPID keys are not configured. Push notifications will not work.');
  console.warn('Generate VAPID keys using `npx web-push generate-vapid-keys` and set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.');
  console.warn(`Current VAPID_PUBLIC_KEY: ${vapidPublicKey}, VAPID_PRIVATE_KEY: ${!!vapidPrivateKey}`);
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  actions?: { action: string, title: string }[];
}

export const sendPushNotificationToAll = async (payload: NotificationPayload): Promise<{ success: boolean; results: webpush.SendResult[] | null; message: string }> => {
  if (!isVapidConfigured) {
    return { success: false, results: null, message: 'VAPID keys not configured. Cannot send push notifications.' };
  }

  try {
    const subscriptions = await storage.getAllPushSubscriptions();
    if (subscriptions.length === 0) {
      return { success: false, results: null, message: 'No push subscriptions found to send notifications to.' };
    }

    const notificationPromises = subscriptions.map(subscription => {
      // The web-push library expects the subscription object directly
      // Ensure StoredPushSubscription matches what web-push needs, or transform it.
      // The 'PushSubscription' object from the browser usually has endpoint, and keys { p256dh, auth }
      const subForLib: webpush.PushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth
          }
      };
      return webpush.sendNotification(subForLib, JSON.stringify(payload))
        .catch(err => {
          console.error(`Error sending push to ${subscription.endpoint.substring(0,30)}...:`, err.statusCode, err.body);
          // If subscription is no longer valid (e.g., 404, 410), remove it
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log(`Subscription ${subscription.endpoint.substring(0,30)}... is invalid. Removing.`);
            storage.removePushSubscription(subscription.endpoint);
          }
          return { error: err, endpoint: subscription.endpoint }; // Return error info
        });
    });

    const results = await Promise.all(notificationPromises);

    const successfulDeliveries = results.filter(r => !(r as any).error).length;
    const failedDeliveries = results.length - successfulDeliveries;

    let message = `Attempted to send ${results.length} notifications. Success: ${successfulDeliveries}, Failed: ${failedDeliveries}.`;
    if (failedDeliveries > 0) console.warn(message, results.filter(r => (r as any).error));


    return { success: successfulDeliveries > 0, results, message };
  } catch (error: any) {
    console.error('Error sending push notifications to all:', error);
    return { success: false, results: null, message: `Failed to send push notifications: ${error.message}` };
  }
};

console.log("PushNotificationService loaded.");
if (!isVapidConfigured) {
    console.warn("PushNotificationService: VAPID keys not configured. Push notifications will be disabled.");
}
export type { NotificationPayload as PushNotificationPayload };
