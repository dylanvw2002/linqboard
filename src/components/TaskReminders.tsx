import { useState, useEffect } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskRemindersProps {
  taskId: string;
  dueDate: string | null;
}

interface Reminder {
  id: string;
  reminder_offset: string;
  notification_type: string;
  remind_at: string;
}

const REMINDER_OFFSETS = [
  { value: "15_minutes", label: "15 minuten van tevoren" },
  { value: "1_hour", label: "1 uur van tevoren" },
  { value: "3_hours", label: "3 uur van tevoren" },
  { value: "1_day", label: "1 dag van tevoren" },
  { value: "3_days", label: "3 dagen van tevoren" },
  { value: "1_week", label: "1 week van tevoren" },
];

export const TaskReminders = ({ taskId, dueDate }: TaskRemindersProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedOffset, setSelectedOffset] = useState<string>("");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [desktopEnabled, setDesktopEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchReminders();
    }
  }, [taskId]);

  const fetchReminders = async () => {
    const { data, error } = await supabase
      .from("task_reminders")
      .select("*")
      .eq("task_id", taskId)
      .order("remind_at", { ascending: true });

    if (error) {
      console.error("Error fetching reminders:", error);
      return;
    }

    setReminders(data || []);
  };

  const calculateRemindAt = (offset: string, deadline: string): string => {
    const dueDateTime = new Date(deadline);
    
    const offsetMap: Record<string, number> = {
      "15_minutes": 15 * 60 * 1000,
      "1_hour": 60 * 60 * 1000,
      "3_hours": 3 * 60 * 60 * 1000,
      "1_day": 24 * 60 * 60 * 1000,
      "3_days": 3 * 24 * 60 * 60 * 1000,
      "1_week": 7 * 24 * 60 * 60 * 1000,
    };

    const milliseconds = offsetMap[offset] || 0;
    const remindAt = new Date(dueDateTime.getTime() - milliseconds);
    
    return remindAt.toISOString();
  };

  const addReminder = async () => {
    if (!selectedOffset || !dueDate) {
      toast.error("Selecteer een herinneringsmoment");
      return;
    }

    if (!emailEnabled && !desktopEnabled) {
      toast.error("Selecteer minimaal één notificatietype");
      return;
    }

    setLoading(true);

    const notificationType = 
      emailEnabled && desktopEnabled ? "both" :
      emailEnabled ? "email" : "desktop";

    const remindAt = calculateRemindAt(selectedOffset, dueDate);

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("Gebruiker niet gevonden");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("task_reminders").insert({
      task_id: taskId,
      user_id: user.user.id,
      reminder_offset: selectedOffset,
      notification_type: notificationType,
      remind_at: remindAt,
    });

    setLoading(false);

    if (error) {
      console.error("Error adding reminder:", error);
      toast.error("Kon herinnering niet toevoegen");
      return;
    }

    toast.success("Herinnering toegevoegd");
    setSelectedOffset("");
    fetchReminders();
  };

  const deleteReminder = async (reminderId: string) => {
    const { error } = await supabase
      .from("task_reminders")
      .delete()
      .eq("id", reminderId);

    if (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Kon herinnering niet verwijderen");
      return;
    }

    toast.success("Herinnering verwijderd");
    fetchReminders();
  };

  if (!dueDate) {
    return (
      <div className="text-sm text-muted-foreground">
        Stel eerst een deadline in om herinneringen te kunnen toevoegen.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Herinneringen</h3>
      </div>

      {/* Add reminder section */}
      <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
        <Select value={selectedOffset} onValueChange={setSelectedOffset}>
          <SelectTrigger>
            <SelectValue placeholder="Selecteer moment..." />
          </SelectTrigger>
          <SelectContent>
            {REMINDER_OFFSETS.map((offset) => (
              <SelectItem key={offset.value} value={offset.value}>
                {offset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="email"
              checked={emailEnabled}
              onCheckedChange={(checked) => setEmailEnabled(checked as boolean)}
            />
            <Label htmlFor="email" className="text-sm cursor-pointer">
              Email
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="desktop"
              checked={desktopEnabled}
              onCheckedChange={(checked) => setDesktopEnabled(checked as boolean)}
            />
            <Label htmlFor="desktop" className="text-sm cursor-pointer">
              Desktop
            </Label>
          </div>
        </div>

        <Button
          onClick={addReminder}
          disabled={!selectedOffset || loading}
          size="sm"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Toevoegen
        </Button>
      </div>

      {/* Active reminders list */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Actieve herinneringen:</p>
          {reminders.map((reminder) => {
            const offsetLabel =
              REMINDER_OFFSETS.find((o) => o.value === reminder.reminder_offset)?.label ||
              reminder.reminder_offset;
            
            const typeLabel =
              reminder.notification_type === "both"
                ? "Email & Desktop"
                : reminder.notification_type === "email"
                ? "Alleen email"
                : "Alleen desktop";

            return (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-2 border rounded bg-background"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{offsetLabel}</p>
                  <p className="text-xs text-muted-foreground">{typeLabel}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deleteReminder(reminder.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
