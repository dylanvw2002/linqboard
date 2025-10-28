import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RecurringTaskDialogProps {
  columnId: string;
  onTaskCreated?: () => void;
}

export const RecurringTaskDialog = ({ columnId, onTaskCreated }: RecurringTaskDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pattern, setPattern] = useState("daily");
  const [interval, setInterval] = useState(1);
  const { toast } = useToast();

  const createRecurringTask = async () => {
    if (!title.trim()) {
      toast({
        title: "Fout",
        description: "Voer een titel in",
        variant: "destructive",
      });
      return;
    }

    const nextDate = new Date();
    if (pattern === "daily") {
      nextDate.setDate(nextDate.getDate() + interval);
    } else if (pattern === "weekly") {
      nextDate.setDate(nextDate.getDate() + interval * 7);
    } else if (pattern === "monthly") {
      nextDate.setMonth(nextDate.getMonth() + interval);
    }

    const { error } = await supabase.from("tasks").insert({
      title,
      column_id: columnId,
      is_recurring: true,
      recurrence_pattern: pattern,
      recurrence_interval: interval,
      next_recurrence_date: nextDate.toISOString(),
    });

    if (error) {
      toast({
        title: "Fout",
        description: "Kon terugkerende taak niet aanmaken",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succes",
      description: "Terugkerende taak aangemaakt",
    });

    setTitle("");
    setPattern("daily");
    setInterval(1);
    setOpen(false);
    onTaskCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Repeat className="h-4 w-4" />
          Terugkerende taak
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terugkerende taak aanmaken</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              placeholder="Bijv. Wekelijkse review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pattern">Herhaalpatroon</Label>
            <Select value={pattern} onValueChange={setPattern}>
              <SelectTrigger id="pattern">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Dagelijks</SelectItem>
                <SelectItem value="weekly">Wekelijks</SelectItem>
                <SelectItem value="monthly">Maandelijks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">
              Elke{" "}
              {pattern === "daily"
                ? "dag(en)"
                : pattern === "weekly"
                ? "week/weken"
                : "maand(en)"}
            </Label>
            <Input
              id="interval"
              type="number"
              min="1"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={createRecurringTask} className="flex-1">
              Aanmaken
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
