import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeUserToPush,
  sendSubscriptionToServer,
  unsubscribeUserFromPush
} from '@/lib/pushService';

const NotificationSettings: React.FC = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsPushSupported(true);
      registerServiceWorker().then(registration => {
        if (registration) {
          // Check current subscription state
          registration.pushManager.getSubscription().then(subscription => {
            setIsSubscribed(!!subscription);
            setIsLoading(false);
          });
        } else {
            setIsLoading(false); // SW registration failed
        }
      });
      setPermissionStatus(Notification.permission);
    } else {
      setIsPushSupported(false);
      setIsLoading(false);
    }
  }, []);

  const handleSubscribe = async () => {
    if (!isPushSupported) {
        toast({ title: "Not Supported", description: "Push notifications are not supported by your browser.", variant: "warning" });
        return;
    }
    setIsLoading(true);
    const permission = await requestNotificationPermission();
    setPermissionStatus(permission);

    if (permission === 'granted') {
      const subscription = await subscribeUserToPush();
      if (subscription) {
        const success = await sendSubscriptionToServer(subscription);
        if (success) {
          setIsSubscribed(true);
          toast({ title: "Subscribed!", description: "You will now receive push notifications." });
        } else {
          toast({ title: "Subscription Failed", description: "Could not save subscription to server.", variant: "destructive" });
          // Attempt to unsubscribe locally if server save failed
          await subscription.unsubscribe();
        }
      } else {
         toast({ title: "Subscription Failed", description: "Could not subscribe to push notifications. Ensure VAPID key is set.", variant: "destructive" });
      }
    } else {
      toast({ title: "Permission Denied", description: "Notification permission was not granted.", variant: "warning" });
    }
    setIsLoading(false);
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    const success = await unsubscribeUserFromPush();
    if (success) {
      setIsSubscribed(false);
      toast({ title: "Unsubscribed", description: "You will no longer receive push notifications." });
    } else {
      toast({ title: "Unsubscription Failed", description: "Could not unsubscribe.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  if (!isPushSupported) {
    return (
      <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">Push Notifications</h3>
        <p className="text-sm text-gray-600">Push notifications are not supported by your browser.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Push Notification Settings</h3>
      {permissionStatus === 'denied' && (
        <p className="text-sm text-red-500 mb-2">Notification permission is blocked. Please enable it in your browser settings.</p>
      )}
      {isSubscribed ? (
        <Button onClick={handleUnsubscribe} disabled={isLoading} variant="destructive">
          {isLoading ? 'Processing...' : 'Unsubscribe from Notifications'}
        </Button>
      ) : (
        <Button onClick={handleSubscribe} disabled={isLoading || permissionStatus === 'denied'}>
          {isLoading ? 'Processing...' : 'Subscribe to Notifications'}
        </Button>
      )}
       <p className="text-xs text-gray-500 mt-3">
        You might need to refresh the page after changing notification permissions in your browser settings.
      </p>
    </div>
  );
};

export default NotificationSettings;
