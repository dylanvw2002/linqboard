import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TimeEntry {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
}

interface TimeTrackerProps {
  taskId: string;
}

export const TimeTracker = ({ taskId }: TimeTrackerProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTotalTime();
    checkActiveEntry();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [taskId]);

  const loadTotalTime = async () => {
    const { data, error } = await supabase
      .from("time_entries")
      .select("duration_seconds")
      .eq("task_id", taskId)
      .not("duration_seconds", "is", null);

    if (error) {
      console.error("Error loading time:", error);
      return;
    }

    const total = data.reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
    setTotalTime(total);
  };

  const checkActiveEntry = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("task_id", taskId)
      .eq("user_id", user.id)
      .is("end_time", null)
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return;

    setCurrentEntryId(data.id);
    setIsTracking(true);
    const elapsed = Math.floor(
      (new Date().getTime() - new Date(data.start_time).getTime()) / 1000
    );
    setElapsedSeconds(elapsed);
    startTimer();
  };

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const startTracking = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Fout",
        description: "Je moet ingelogd zijn om tijd te tracken",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        task_id: taskId,
        user_id: user.id,
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      toast({
        title: "Fout",
        description: "Kon tijdregistratie niet starten",
        variant: "destructive",
      });
      return;
    }

    setCurrentEntryId(data.id);
    setIsTracking(true);
    setElapsedSeconds(0);
    startTimer();
  };

  const stopTracking = async () => {
    if (!currentEntryId) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const endTime = new Date().toISOString();
    const { error } = await supabase
      .from("time_entries")
      .update({
        end_time: endTime,
        duration_seconds: elapsedSeconds,
      })
      .eq("id", currentEntryId);

    if (error) {
      toast({
        title: "Fout",
        description: "Kon tijdregistratie niet stoppen",
        variant: "destructive",
      });
      return;
    }

    setIsTracking(false);
    setCurrentEntryId(null);
    setTotalTime((prev) => prev + elapsedSeconds);
    setElapsedSeconds(0);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}u ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Tijd
        </span>
        <Badge variant="secondary">{formatTime(totalTime + elapsedSeconds)}</Badge>
      </div>

      {isTracking && (
        <div className="flex items-center justify-between p-2 bg-primary/10 rounded">
          <span className="text-sm font-mono">{formatTime(elapsedSeconds)}</span>
          <Button size="sm" variant="destructive" onClick={stopTracking} className="h-7">
            <Square className="h-3 w-3 mr-1" />
            Stop
          </Button>
        </div>
      )}

      {!isTracking && (
        <Button
          size="sm"
          variant="outline"
          onClick={startTracking}
          className="w-full h-8"
        >
          <Play className="h-3 w-3 mr-1" />
          Start tracking
        </Button>
      )}
    </div>
  );
};
