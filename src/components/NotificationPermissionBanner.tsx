import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDesktopNotifications } from "@/hooks/useDesktopNotifications";

const PERMISSION_ASKED_KEY = "linqboard-notification-permission-asked";

export const NotificationPermissionBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { permission, requestPermission } = useDesktopNotifications();

  useEffect(() => {
    // Check if we already asked for permission
    const alreadyAsked = localStorage.getItem(PERMISSION_ASKED_KEY);
    
    // Show banner if permission is not granted and we haven't asked before
    if (permission === "default" && !alreadyAsked) {
      setShowBanner(true);
    }
  }, [permission]);

  const handleAccept = async () => {
    const granted = await requestPermission();
    localStorage.setItem(PERMISSION_ASKED_KEY, "true");
    setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(PERMISSION_ASKED_KEY, "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 rounded-full p-2">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              Desktop notificaties inschakelen?
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Ontvang herinneringen voor je taken, zelfs wanneer LinqBoard niet open is.
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAccept}
                className="flex-1"
              >
                Inschakelen
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
              >
                Niet nu
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
