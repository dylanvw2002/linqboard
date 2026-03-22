import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Archive, Trash2, Clock, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";

interface ArchivedTask {
  id: string;
  original_task_id: string;
  title: string;
  description: string | null;
  column_name: string;
  priority: string | null;
  due_date: string | null;
  assignee_names: string[] | null;
  labels: string[] | null;
  time_logged_minutes: number;
  archived_at: string;
}

interface TaskArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
}

export function TaskArchiveDialog({ open, onOpenChange, boardId }: TaskArchiveDialogProps) {
  const [archivedTasks, setArchivedTasks] = useState<ArchivedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) fetchArchived();
  }, [open, boardId]);

  const fetchArchived = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("archived_tasks")
      .select("*")
      .eq("board_id", boardId)
      .order("archived_at", { ascending: false });
    if (data) setArchivedTasks(data as ArchivedTask[]);
    setLoading(false);
  };

  const deleteArchived = async (id: string) => {
    await supabase.from("archived_tasks").delete().eq("id", id);
    setArchivedTasks(prev => prev.filter(t => t.id !== id));
    toast.success("Archieftaak verwijderd");
  };

  const clearAll = async () => {
    const ids = archivedTasks.map(t => t.id);
    if (ids.length === 0) return;
    await supabase.from("archived_tasks").delete().in("id", ids);
    setArchivedTasks([]);
    toast.success("Archief geleegd");
  };

  const formatDuration = (mins: number) => {
    if (!mins) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}u ${m}m` : `${m}m`;
  };

  const priorityColor = (p: string | null) => {
    if (p === "high") return "destructive";
    if (p === "medium") return "default";
    return "secondary";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Takenarchief
          </DialogTitle>
        </DialogHeader>

        {archivedTasks.length > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={clearAll} className="text-destructive">
              <Trash2 className="h-3 w-3 mr-1" />
              Archief legen
            </Button>
          </div>
        )}

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Laden...</p>
          ) : archivedTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Geen gearchiveerde taken</p>
          ) : (
            <div className="space-y-2">
              {archivedTasks.map(task => (
                <div key={task.id} className="border rounded-lg p-3 bg-muted/30 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{task.description}</p>
                      )}
                    </div>
                    <button onClick={() => deleteArchived(task.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 items-center text-xs">
                    <Badge variant="outline" className="text-[10px]">{task.column_name}</Badge>
                    {task.priority && (
                      <Badge variant={priorityColor(task.priority) as any} className="text-[10px]">{task.priority}</Badge>
                    )}
                    {task.labels?.map(l => (
                      <Badge key={l} variant="secondary" className="text-[10px]">{l}</Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Gearchiveerd: {format(new Date(task.archived_at), "dd MMM yyyy HH:mm", { locale: nl })}
                    </span>
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Deadline: {format(new Date(task.due_date), "dd MMM yyyy", { locale: nl })}
                      </span>
                    )}
                    {formatDuration(task.time_logged_minutes) && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(task.time_logged_minutes)}
                      </span>
                    )}
                    {task.assignee_names && task.assignee_names.length > 0 && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.assignee_names.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
