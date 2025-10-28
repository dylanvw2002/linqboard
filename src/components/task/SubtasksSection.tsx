import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  position: number;
}

interface SubtasksSectionProps {
  taskId: string;
}

export const SubtasksSection = ({ taskId }: SubtasksSectionProps) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSubtasks();
  }, [taskId]);

  const loadSubtasks = async () => {
    const { data, error } = await supabase
      .from("subtasks")
      .select("*")
      .eq("parent_task_id", taskId)
      .order("position");

    if (error) {
      console.error("Error loading subtasks:", error);
      return;
    }

    setSubtasks(data as any || []);
  };

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    const { error } = await supabase.from("subtasks").insert({
      parent_task_id: taskId,
      title: newSubtaskTitle,
      position: subtasks.length,
    } as any);

    if (error) {
      toast({
        title: "Fout",
        description: "Kon subtaak niet toevoegen",
        variant: "destructive",
      });
      return;
    }

    setNewSubtaskTitle("");
    setIsAdding(false);
    loadSubtasks();
  };

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    const { error } = await supabase
      .from("subtasks")
      .update({ completed: !completed } as any)
      .eq("id", subtaskId);

    if (error) {
      toast({
        title: "Fout",
        description: "Kon subtaak niet updaten",
        variant: "destructive",
      });
      return;
    }

    loadSubtasks();
  };

  const deleteSubtask = async (subtaskId: string) => {
    const { error } = await supabase
      .from("subtasks")
      .delete()
      .eq("id", subtaskId);

    if (error) {
      toast({
        title: "Fout",
        description: "Kon subtaak niet verwijderen",
        variant: "destructive",
      });
      return;
    }

    loadSubtasks();
  };

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Subtaken {totalCount > 0 && `(${completedCount}/${totalCount})`}
        </span>
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Toevoegen
          </Button>
        )}
      </div>

      {totalCount > 0 && (
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center gap-2 group hover:bg-accent/50 p-1 rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={() => toggleSubtask(subtask.id, subtask.completed)}
            />
            <span
              className={`flex-1 text-sm ${
                subtask.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {subtask.title}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteSubtask(subtask.id)}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {isAdding && (
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Nieuwe subtaak..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addSubtask()}
              autoFocus
              className="h-8"
            />
            <Button size="sm" onClick={addSubtask} className="h-8">
              Toevoegen
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setNewSubtaskTitle("");
              }}
              className="h-8"
            >
              Annuleren
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
