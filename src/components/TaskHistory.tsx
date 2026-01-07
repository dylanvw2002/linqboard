import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { History, UserPlus, UserMinus, ArrowRight, Pencil, Plus, Trash2, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

interface HistoryEntry {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  changes: any;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface TaskHistoryProps {
  taskId: string;
  columns: Array<{ id: string; name: string }>;
}

export const TaskHistory = ({ taskId, columns }: TaskHistoryProps) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
    
    // Subscribe to new history entries
    const channel = supabase
      .channel(`task-history-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_history',
          filter: `task_id=eq.${taskId}`
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const fetchHistory = async () => {
    try {
      const { data: historyData, error } = await supabase
        .from('task_history')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles for all history entries
      if (historyData && historyData.length > 0) {
        const userIds = [...new Set(historyData.map(h => h.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        const historyWithUsers = historyData.map(entry => ({
          ...entry,
          user: profiles?.find(p => p.user_id === entry.user_id)
        }));

        setHistory(historyWithUsers);
      }
    } catch (error) {
      console.error('Error fetching task history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColumnName = (columnId: string) => {
    return columns.find(c => c.id === columnId)?.name || t('taskHistory.unknown');
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="h-4 w-4" />;
      case 'updated':
        return <Pencil className="h-4 w-4" />;
      case 'moved':
        return <ArrowRight className="h-4 w-4" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4" />;
      case 'assignee_added':
        return <UserPlus className="h-4 w-4" />;
      case 'assignee_removed':
        return <UserMinus className="h-4 w-4" />;
      case 'exported':
        return <Mail className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getActionDescription = (entry: HistoryEntry) => {
    const userName = entry.user?.full_name || t('taskHistory.someone');
    
    switch (entry.action) {
      case 'created':
        return t('taskHistory.created', { user: userName });
      case 'updated':
        return t('taskHistory.updated', { user: userName });
      case 'moved':
        const fromCol = getColumnName(entry.changes.from_column_id);
        const toCol = getColumnName(entry.changes.to_column_id);
        return t('taskHistory.moved', { user: userName, from: fromCol, to: toCol });
      case 'deleted':
        return t('taskHistory.deleted', { user: userName });
      case 'assignee_added':
        return t('taskHistory.assigneeAdded', { user: userName, assignee: entry.changes.user_name });
      case 'assignee_removed':
        return t('taskHistory.assigneeRemoved', { user: userName, assignee: entry.changes.user_name });
      case 'exported':
        const recipients = entry.changes.recipients?.join(', ') || '';
        return t('taskHistory.exported', { user: userName, recipients });
      default:
        return t('taskHistory.changed', { user: userName });
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'text-green-600';
      case 'deleted':
        return 'text-red-600';
      case 'moved':
        return 'text-blue-600';
      case 'assignee_added':
        return 'text-purple-600';
      case 'assignee_removed':
        return 'text-orange-600';
      case 'exported':
        return 'text-cyan-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">{t('taskHistory.loading')}</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <History className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{t('taskHistory.noHistory')}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {history.map((entry) => (
          <div key={entry.id} className="flex gap-3">
            <Avatar className="h-8 w-8 mt-1">
              <AvatarImage src={entry.user?.avatar_url} />
              <AvatarFallback>
                {entry.user?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-start gap-2">
                <div className={`mt-1 ${getActionColor(entry.action)}`}>
                  {getActionIcon(entry.action)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    {getActionDescription(entry)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(entry.created_at), {
                      addSuffix: true,
                      locale: nl
                    })}
                  </p>
                </div>
              </div>
              
              {entry.action === 'updated' && entry.changes?.old && entry.changes?.new && (
                <div className="ml-6 mt-2 text-xs space-y-1">
                  {entry.changes.old.title !== entry.changes.new.title && (
                    <div className="bg-muted p-2 rounded">
                      <span className="text-muted-foreground">{t('taskHistory.titleLabel')}: </span>
                      <span className="line-through">{entry.changes.old.title}</span>
                      {' → '}
                      <span className="font-medium">{entry.changes.new.title}</span>
                    </div>
                  )}
                  {entry.changes.old.priority !== entry.changes.new.priority && (
                    <div className="bg-muted p-2 rounded">
                      <span className="text-muted-foreground">{t('taskHistory.priorityLabel')}: </span>
                      <span className="line-through">{entry.changes.old.priority || t('taskHistory.none')}</span>
                      {' → '}
                      <span className="font-medium">{entry.changes.new.priority || t('taskHistory.none')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
