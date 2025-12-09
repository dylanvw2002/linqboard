import { useState, useEffect } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NotificationsDropdownProps {
  boardId: string;
  isDemo?: boolean;
}

interface Notification {
  id: string;
  type: "assignment" | "mention" | "deadline" | "custom";
  message: string;
  created_at: string;
  read: boolean;
  task_id?: string;
}

export const NotificationsDropdown = ({ boardId, isDemo }: NotificationsDropdownProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isDemo) return;
    
    fetchNotifications();
    
    // Real-time subscription for task assignments
    const taskChannel = supabase
      .channel('task-changes-dropdown')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_assignees'
        },
        () => fetchNotifications()
      )
      .subscribe();

    // Real-time subscription for custom notifications
    const notificationChannel = supabase
      .channel('custom-notifications-dropdown')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications'
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(notificationChannel);
    };
  }, [boardId, isDemo]);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch custom notifications (reminders)
    const { data: customNotifs } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch recent task assignments
    const { data: columns } = await supabase
      .from("columns")
      .select("id")
      .eq("board_id", boardId);

    if (!columns) return;

    const { data: assignees } = await supabase
      .from("task_assignees")
      .select(`
        id,
        created_at,
        task_id,
        tasks (
          title,
          column_id
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const allNotifications: Notification[] = [];

    // Add custom notifications
    if (customNotifs) {
      allNotifications.push(...customNotifs.map((notif: any) => ({
        id: notif.id,
        type: "custom" as const,
        message: notif.message,
        created_at: notif.created_at,
        read: notif.is_read,
        task_id: notif.task_id,
      })));
    }

    // Add assignment notifications
    if (assignees) {
      const assignmentNotifs = assignees
        .filter((a: any) => columns.some(c => c.id === a.tasks?.column_id))
        .map((a: any) => ({
          id: a.id,
          type: "assignment" as const,
          message: `Je bent toegewezen aan: ${a.tasks?.title}`,
          created_at: a.created_at,
          read: false,
          task_id: a.task_id,
        }));
      
      allNotifications.push(...assignmentNotifs);
    }

    // Sort by date and limit
    allNotifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setNotifications(allNotifications.slice(0, 15));
  };

  const markAsRead = async (notification: Notification) => {
    if (notification.type === "custom") {
      await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("id", notification.id);
      
      fetchNotifications();
    } else {
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }
  };

  const clearAllNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Delete all custom notifications for this user
    const { error } = await supabase
      .from("user_notifications")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      toast.error("Kon notificaties niet wissen");
      return;
    }

    // Clear local state
    setNotifications([]);
    toast.success("Notificaties gewist");
  };

  const deleteNotification = async (notification: Notification) => {
    if (notification.type === "custom") {
      const { error } = await supabase
        .from("user_notifications")
        .delete()
        .eq("id", notification.id);

      if (error) {
        toast.error("Kon notificatie niet wissen");
        return;
      }
      
      fetchNotifications();
    } else {
      // For non-custom notifications, just remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isDemo) {
    return (
      <div className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 border-2 border-white/40 dark:border-white/20 p-2.5 rounded-2xl font-bold cursor-pointer transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,0.5)] relative">
        <Bell size={20} className="text-foreground" />
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 border-2 border-white/40 dark:border-white/20 p-2.5 rounded-2xl font-bold cursor-pointer transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,0.7)] hover:-translate-y-1 hover:bg-white/30 dark:hover:bg-card/30 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[15px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none">
          <Bell size={20} className="text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full min-w-5 h-5 flex items-center justify-center text-xs font-bold px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-background/95 backdrop-blur-xl border shadow-xl" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Notificaties</span>
            {unreadCount > 0 && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                {unreadCount} nieuw
              </span>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={clearAllNotifications}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Wis alles
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-auto">
          {notifications.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8 px-4">
              Geen notificaties
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={cn(
                    "p-3 hover:bg-muted/50 transition-colors group",
                    !notif.read && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          locale: nl,
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => markAsRead(notif)}
                          title="Markeer als gelezen"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:text-destructive"
                        onClick={() => deleteNotification(notif)}
                        title="Verwijder"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
