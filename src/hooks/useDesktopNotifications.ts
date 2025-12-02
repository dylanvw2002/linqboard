import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useDesktopNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  useEffect(() => {
    if (typeof Notification === "undefined") return;

    // Check if user already granted permission
    if (Notification.permission === "granted") {
      setPermission("granted");
      subscribeToNotifications();
    }
  }, []);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") {
      console.warn("Browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      setPermission("granted");
      subscribeToNotifications();
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        subscribeToNotifications();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const subscribeToNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          showDesktopNotification(notification.title, notification.message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const showDesktopNotification = (title: string, message: string) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }

    try {
      const notification = new Notification(title, {
        body: message,
        icon: "/favicon.png",
        badge: "/favicon.png",
        tag: "linqboard-reminder",
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Error showing desktop notification:", error);
    }
  };

  return {
    permission,
    requestPermission,
    hasPermission: permission === "granted",
  };
};
