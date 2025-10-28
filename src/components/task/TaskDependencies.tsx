import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
}

interface Dependency {
  id: string;
  depends_on_task_id: string;
  task_title: string;
}

interface TaskDependenciesProps {
  taskId: string;
  boardId: string;
}

export const TaskDependencies = ({ taskId, boardId }: TaskDependenciesProps) => {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDependencies();
    loadAvailableTasks();
  }, [taskId, boardId]);

  const loadDependencies = async () => {
    const { data, error } = await supabase
      .from("task_dependencies")
      .select(`
        id,
        depends_on_task_id,
        tasks!task_dependencies_depends_on_task_id_fkey(title)
      `)
      .eq("task_id", taskId);

    if (error) {
      console.error("Error loading dependencies:", error);
      return;
    }

    const formatted = data.map((d: any) => ({
      id: d.id,
      depends_on_task_id: d.depends_on_task_id,
      task_title: d.tasks?.title || "Onbekende taak",
    }));

    setDependencies(formatted);
  };

  const loadAvailableTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title")
      .eq("board_id", boardId)
      .neq("id", taskId);

    if (error) {
      console.error("Error loading tasks:", error);
      return;
    }

    setAvailableTasks(data || []);
  };

  const addDependency = async () => {
    if (!selectedTaskId) return;

    const { error } = await supabase.from("task_dependencies").insert({
      task_id: taskId,
      depends_on_task_id: selectedTaskId,
    });

    if (error) {
      toast({
        title: "Fout",
        description: "Kon afhankelijkheid niet toevoegen",
        variant: "destructive",
      });
      return;
    }

    setSelectedTaskId("");
    setIsAdding(false);
    loadDependencies();
  };

  const removeDependency = async (dependencyId: string) => {
    const { error } = await supabase
      .from("task_dependencies")
      .delete()
      .eq("id", dependencyId);

    if (error) {
      toast({
        title: "Fout",
        description: "Kon afhankelijkheid niet verwijderen",
        variant: "destructive",
      });
      return;
    }

    loadDependencies();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-1">
          <Link2 className="h-4 w-4" />
          Afhankelijkheden
        </span>
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-7 text-xs"
          >
            Toevoegen
          </Button>
        )}
      </div>

      {dependencies.length > 0 && (
        <div className="space-y-1">
          {dependencies.map((dep) => (
            <div
              key={dep.id}
              className="flex items-center gap-2 p-2 bg-accent/50 rounded group"
            >
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="flex-1 text-sm">Wacht op: {dep.task_title}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDependency(dep.id)}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="flex gap-2 mt-2">
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Kies een taak..." />
            </SelectTrigger>
            <SelectContent>
              {availableTasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={addDependency} className="h-8">
            Toevoegen
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsAdding(false);
              setSelectedTaskId("");
            }}
            className="h-8"
          >
            Annuleren
          </Button>
        </div>
      )}
    </div>
  );
};
