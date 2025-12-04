import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useDesktopNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subscribedRef = useRef(false);

  const showDesktopNotification = useCallback((title: string, message: string) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      console.log("Cannot show notification - permission not granted or not supported");
      return;
    }

    try {
      console.log("Showing desktop notification:", title, message);
      const notification = new Notification(title, {
        body: message,
        icon: "/favicon.png",
        badge: "/favicon.png",
        tag: `linqboard-reminder-${Date.now()}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error("Error showing desktop notification:", error);
    }
  }, []);

  const subscribeToNotifications = useCallback(async () => {
    if (subscribedRef.current) {
      console.log("Already subscribed to notifications");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("No user logged in, cannot subscribe to notifications");
      return;
    }

    console.log("Subscribing to notifications for user:", user.id);

    // Clean up existing channel if any
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
    }

    // Subscribe to realtime changes
    channelRef.current = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Received notification from realtime:", payload);
          const notification = payload.new as any;
          showDesktopNotification(notification.title, notification.message);
        }
      )
      .subscribe((status) => {
        console.log("Notification subscription status:", status);
        if (status === "SUBSCRIBED") {
          subscribedRef.current = true;
        }
      });
  }, [showDesktopNotification]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") {
      console.warn("Browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      setPermission("granted");
      await subscribeToNotifications();
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      console.log("Notification permission result:", result);
      setPermission(result);
      
      if (result === "granted") {
        await subscribeToNotifications();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [subscribeToNotifications]);

  // Subscribe on mount if permission is already granted
  useEffect(() => {
    if (typeof Notification === "undefined") return;

    // Update permission state
    setPermission(Notification.permission);

    // If permission is granted, subscribe
    if (Notification.permission === "granted") {
      subscribeToNotifications();
    }

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        console.log("Cleaning up notification subscription");
        supabase.removeChannel(channelRef.current);
        subscribedRef.current = false;
      }
    };
  }, [subscribeToNotifications]);

  // Re-subscribe when auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      if (event === "SIGNED_IN" && Notification.permission === "granted") {
        subscribeToNotifications();
      } else if (event === "SIGNED_OUT") {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          subscribedRef.current = false;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [subscribeToNotifications]);

  return {
    permission,
    requestPermission,
    hasPermission: permission === "granted",
    showDesktopNotification,
  };
};