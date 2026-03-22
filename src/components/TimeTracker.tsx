import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Square, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInMinutes } from "date-fns";
import { nl } from "date-fns/locale";

interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  description: string | null;
  created_at: string;
}

interface TimeTrackerProps {
  taskId: string;
  isEditMode: boolean;
}

export function TimeTracker({ taskId, isEditMode }: TimeTrackerProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [manualMinutes, setManualMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    const { data } = await supabase
      .from("time_entries")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });
    if (data) {
      setEntries(data as TimeEntry[]);
      const active = data.find((e: any) => !e.end_time);
      setActiveEntry(active as TimeEntry || null);
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  useEffect(() => {
    if (!activeEntry) { setElapsed(0); return; }
    const interval = setInterval(() => {
      setElapsed(differenceInMinutes(new Date(), new Date(activeEntry.start_time)));
    }, 1000);
    setElapsed(differenceInMinutes(new Date(), new Date(activeEntry.start_time)));
    return () => clearInterval(interval);
  }, [activeEntry]);

  const startTimer = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from("time_entries").insert({
      task_id: taskId,
      user_id: session.user.id,
      start_time: new Date().toISOString(),
    } as any);
    if (error) { toast.error("Kon timer niet starten"); return; }
    toast.success("Timer gestart");
    fetchEntries();
  };

  const stopTimer = async () => {
    if (!activeEntry) return;
    const now = new Date();
    const dur = differenceInMinutes(now, new Date(activeEntry.start_time));
    const { error } = await supabase.from("time_entries")
      .update({ end_time: now.toISOString(), duration_minutes: Math.max(1, dur) } as any)
      .eq("id", activeEntry.id);
    if (error) { toast.error("Kon timer niet stoppen"); return; }
    toast.success(`Timer gestopt: ${Math.max(1, dur)} minuten`);
    setActiveEntry(null);
    fetchEntries();
  };

  const addManual = async () => {
    const mins = parseInt(manualMinutes);
    if (!mins || mins <= 0) { toast.error("Voer een geldig aantal minuten in"); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const now = new Date();
    const start = new Date(now.getTime() - mins * 60000);
    const { error } = await supabase.from("time_entries").insert({
      task_id: taskId,
      user_id: session.user.id,
      start_time: start.toISOString(),
      end_time: now.toISOString(),
      duration_minutes: mins,
      description: description || null,
    } as any);
    if (error) { toast.error("Kon tijd niet toevoegen"); return; }
    toast.success(`${mins} minuten toegevoegd`);
    setManualMinutes("");
    setDescription("");
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("time_entries").delete().eq("id", id);
    fetchEntries();
  };

  const totalMinutes = entries
    .filter(e => e.duration_minutes)
    .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}u ${m}m` : `${m}m`;
  };

  if (loading) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Tijdregistratie</Label>
        </div>
        <span className="text-sm font-semibold text-primary">
          Totaal: {formatDuration(totalMinutes + (activeEntry ? elapsed : 0))}
        </span>
      </div>

      {/* Timer button */}
      {isEditMode && (
        <div className="flex gap-2">
          {activeEntry ? (
            <Button onClick={stopTimer} variant="destructive" size="sm" className="flex-1">
              <Square className="h-3 w-3 mr-1" />
              Stop ({formatDuration(elapsed)})
            </Button>
          ) : (
            <Button onClick={startTimer} size="sm" className="flex-1">
              <Play className="h-3 w-3 mr-1" />
              Start timer
            </Button>
          )}
        </div>
      )}

      {/* Manual entry */}
      {isEditMode && !activeEntry && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              type="number"
              min={1}
              placeholder="Minuten"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Omschrijving"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button onClick={addManual} size="sm" variant="outline">
            Toevoegen
          </Button>
        </div>
      )}

      {/* Entries list */}
      {entries.length > 0 && (
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {entries.slice(0, 10).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-muted/50">
              <div className="flex-1">
                <span className="text-muted-foreground">
                  {format(new Date(entry.start_time), "dd MMM HH:mm", { locale: nl })}
                </span>
                {entry.duration_minutes && (
                  <span className="ml-2 font-medium">{formatDuration(entry.duration_minutes)}</span>
                )}
                {!entry.end_time && (
                  <span className="ml-2 text-primary font-medium animate-pulse">⏱ Actief</span>
                )}
                {entry.description && (
                  <span className="ml-2 text-muted-foreground">— {entry.description}</span>
                )}
              </div>
              {isEditMode && entry.end_time && (
                <button onClick={() => deleteEntry(entry.id)} className="text-muted-foreground hover:text-destructive ml-2">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
