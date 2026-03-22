import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Link2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  column_id: string;
}

interface Dependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string;
}

interface TaskDependenciesProps {
  taskId: string;
  allTasks: Task[];
  isEditMode: boolean;
}

export function TaskDependencies({ taskId, allTasks, isEditMode }: TaskDependenciesProps) {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [dependents, setDependents] = useState<Dependency[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchDependencies = useCallback(async () => {
    const [{ data: deps }, { data: depts }] = await Promise.all([
      supabase.from("task_dependencies").select("*").eq("task_id", taskId),
      supabase.from("task_dependencies").select("*").eq("depends_on_task_id", taskId),
    ]);
    setDependencies((deps as Dependency[]) || []);
    setDependents((depts as Dependency[]) || []);
    setLoading(false);
  }, [taskId]);

  useEffect(() => { fetchDependencies(); }, [fetchDependencies]);

  const addDependency = async () => {
    if (!selectedTaskId) return;
    const { error } = await supabase.from("task_dependencies").insert({
      task_id: taskId,
      depends_on_task_id: selectedTaskId,
      dependency_type: "blocks",
    } as any);
    if (error) {
      if (error.code === "23505") toast.error("Deze afhankelijkheid bestaat al");
      else toast.error("Kon afhankelijkheid niet toevoegen");
      return;
    }
    toast.success("Afhankelijkheid toegevoegd");
    setSelectedTaskId("");
    fetchDependencies();
  };

  const removeDependency = async (id: string) => {
    await supabase.from("task_dependencies").delete().eq("id", id);
    toast.success("Afhankelijkheid verwijderd");
    fetchDependencies();
  };

  const getTaskTitle = (id: string) => allTasks.find(t => t.id === id)?.title || "Onbekende taak";

  const availableTasks = allTasks.filter(
    t => t.id !== taskId && !dependencies.some(d => d.depends_on_task_id === t.id)
  );

  if (loading) return null;
  if (!isEditMode && dependencies.length === 0 && dependents.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Afhankelijkheden</Label>
      </div>

      {/* This task is blocked by */}
      {dependencies.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Geblokkeerd door</span>
          {dependencies.map((dep) => (
            <div key={dep.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-destructive/10 text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span>{getTaskTitle(dep.depends_on_task_id)}</span>
              </div>
              {isEditMode && (
                <button onClick={() => removeDependency(dep.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* This task blocks */}
      {dependents.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Blokkeert</span>
          {dependents.map((dep) => (
            <div key={dep.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-amber-500/10 text-sm">
              <div className="flex items-center gap-2">
                <Link2 className="h-3 w-3 text-amber-600" />
                <span>{getTaskTitle(dep.task_id)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add dependency */}
      {isEditMode && availableTasks.length > 0 && (
        <div className="flex gap-2">
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecteer blokkerende taak..." />
            </SelectTrigger>
            <SelectContent>
              {availableTasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addDependency} size="sm" variant="outline" disabled={!selectedTaskId}>
            Toevoegen
          </Button>
        </div>
      )}
    </div>
  );
}
