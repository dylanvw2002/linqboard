import { useState, useEffect } from "react";
import { Bell, Plus, Trash2, CalendarIcon, Clock } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  const [mode, setMode] = useState<"relative" | "specific">("relative");
  const [selectedOffset, setSelectedOffset] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedHour, setSelectedHour] = useState<string>("09");
  const [selectedMinute, setSelectedMinute] = useState<string>("00");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [desktopEnabled, setDesktopEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchReminders();
    }
  }, [taskId]);

  // Auto-select specific mode when no deadline is set
  useEffect(() => {
    if (!dueDate && mode === "relative") {
      setMode("specific");
    }
  }, [dueDate]);

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
    if (!emailEnabled && !desktopEnabled) {
      toast.error("Selecteer minimaal één notificatietype");
      return;
    }

    let remindAt: string;
    let reminderOffset: string;

    if (mode === "relative") {
      if (!selectedOffset || !dueDate) {
        toast.error("Selecteer een herinneringsmoment");
        return;
      }
      remindAt = calculateRemindAt(selectedOffset, dueDate);
      reminderOffset = selectedOffset;
    } else {
      if (!selectedDate) {
        toast.error("Selecteer een datum en tijd");
        return;
      }
      const combinedDateTime = new Date(selectedDate);
      combinedDateTime.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);
      
      if (combinedDateTime <= new Date()) {
        toast.error("Herinnering moet in de toekomst liggen");
        return;
      }
      
      remindAt = combinedDateTime.toISOString();
      reminderOffset = "custom";
    }

    setLoading(true);

    const notificationType = 
      emailEnabled && desktopEnabled ? "both" :
      emailEnabled ? "email" : "desktop";

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("Gebruiker niet gevonden");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("task_reminders").insert({
      task_id: taskId,
      user_id: user.user.id,
      reminder_offset: reminderOffset,
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
    setSelectedDate(undefined);
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

  const showRelativeOption = !!dueDate;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Herinneringen</h3>
      </div>

      {/* Add reminder section */}
      <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
        <RadioGroup 
          value={mode} 
          onValueChange={(v) => setMode(v as "relative" | "specific")} 
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="relative" id="relative" disabled={!showRelativeOption} />
            <Label 
              htmlFor="relative" 
              className={cn("cursor-pointer", !showRelativeOption && "text-muted-foreground cursor-not-allowed")}
            >
              Relatief
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="specific" id="specific" />
            <Label htmlFor="specific" className="cursor-pointer">Specifieke tijd</Label>
          </div>
        </RadioGroup>

        {!showRelativeOption && mode === "relative" && (
          <p className="text-sm text-muted-foreground">
            Stel eerst een deadline in voor relatieve herinneringen.
          </p>
        )}

        {mode === "relative" && showRelativeOption ? (
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
        ) : (
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: nl }) : "Kies een datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <div className="flex gap-2">
              <Select value={selectedHour} onValueChange={setSelectedHour}>
                <SelectTrigger className="flex-1">
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="flex items-center">:</span>
              <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0")).map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

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
          disabled={(mode === "relative" && !selectedOffset) || (mode === "specific" && !selectedDate) || loading}
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
              reminder.reminder_offset === "custom"
                ? format(new Date(reminder.remind_at), "d MMM yyyy 'om' HH:mm", { locale: nl })
                : REMINDER_OFFSETS.find((o) => o.value === reminder.reminder_offset)?.label ||
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
