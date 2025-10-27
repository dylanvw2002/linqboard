import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface NotificationsCenterWidgetProps {
  widgetId: string;
  boardId: string;
}

interface Notification {
  id: string;
  type: "assignment" | "mention" | "deadline";
  message: string;
  created_at: string;
  read: boolean;
  task_id?: string;
}

export const NotificationsCenterWidget = ({ boardId }: NotificationsCenterWidgetProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchNotifications();
    
    // Real-time subscription voor nieuwe notificaties
    const channel = supabase
      .channel('task-changes')
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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

    if (assignees) {
      const notifs: Notification[] = assignees
        .filter((a: any) => columns.some(c => c.id === a.tasks?.column_id))
        .map((a: any) => ({
          id: a.id,
          type: "assignment" as const,
          message: `Je bent toegewezen aan: ${a.tasks?.title}`,
          created_at: a.created_at,
          read: false,
          task_id: a.task_id,
        }));

      setNotifications(notifs);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">🔔 Notificaties</h3>
        </div>
        {unreadCount > 0 && (
          <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            Geen nieuwe notificaties
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-3 rounded-lg border ${
                notif.read ? "bg-muted/50" : "bg-background"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notif.created_at), {
                      locale: nl,
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!notif.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => markAsRead(notif.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
