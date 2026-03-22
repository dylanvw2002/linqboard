import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Archive, Clock, Calendar, User, Search, History } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { TaskHistory } from "./TaskHistory";

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
  columns?: Array<{ id: string; name: string }>;
}

export function TaskArchiveDialog({ open, onOpenChange, boardId, columns = [] }: TaskArchiveDialogProps) {
  const [archivedTasks, setArchivedTasks] = useState<ArchivedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<ArchivedTask | null>(null);

  useEffect(() => {
    if (open) {
      fetchArchived();
      setSelectedTask(null);
      setSearch("");
    }
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

  const filtered = archivedTasks.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.column_name.toLowerCase().includes(q) ||
      t.assignee_names?.some(n => n.toLowerCase().includes(q)) ||
      t.labels?.some(l => l.toLowerCase().includes(q))
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            {selectedTask ? (
              <span className="flex items-center gap-2">
                <button onClick={() => setSelectedTask(null)} className="text-muted-foreground hover:text-foreground text-sm">
                  ← Archief
                </button>
                <span className="text-muted-foreground">/</span>
                <span className="truncate">{selectedTask.title}</span>
              </span>
            ) : (
              "Takenarchief"
            )}
          </DialogTitle>
        </DialogHeader>

        {selectedTask ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {/* Task details */}
              <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                <h3 className="font-semibold">{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <Badge variant="outline">{selectedTask.column_name}</Badge>
                  {selectedTask.priority && (
                    <Badge variant={priorityColor(selectedTask.priority) as any}>{selectedTask.priority}</Badge>
                  )}
                  {selectedTask.labels?.map(l => (
                    <Badge key={l} variant="secondary">{l}</Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Gearchiveerd: {format(new Date(selectedTask.archived_at), "dd MMM yyyy HH:mm", { locale: nl })}
                  </span>
                  {selectedTask.due_date && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Deadline: {format(new Date(selectedTask.due_date), "dd MMM yyyy", { locale: nl })}
                    </span>
                  )}
                  {formatDuration(selectedTask.time_logged_minutes) && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Gelogde tijd: {formatDuration(selectedTask.time_logged_minutes)}
                    </span>
                  )}
                  {selectedTask.assignee_names && selectedTask.assignee_names.length > 0 && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedTask.assignee_names.join(", ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Task history */}
              <div>
                <h4 className="font-medium text-sm flex items-center gap-1.5 mb-2">
                  <History className="h-4 w-4" />
                  Geschiedenis
                </h4>
                <TaskHistory taskId={selectedTask.original_task_id} columns={columns} />
              </div>
            </div>
          </ScrollArea>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek in archief..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="max-h-[55vh]">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Laden...</p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {search ? "Geen resultaten gevonden" : "Geen gearchiveerde taken"}
                </p>
              ) : (
                <div className="space-y-2">
                  {filtered.map(task => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="w-full text-left border rounded-lg p-3 bg-muted/30 space-y-1.5 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{task.title}</h4>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{task.description}</p>
                          )}
                        </div>
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
                          {format(new Date(task.archived_at), "dd MMM yyyy", { locale: nl })}
                        </span>
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
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
