import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { format, parseISO, eachDayOfInterval, getDay } from "date-fns";
import { nl } from "date-fns/locale";
import { Clock, History, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AbsenceRecord {
  id: string;
  person_name: string;
  absence_type: string;
  start_date: string;
  end_date: string | null;
  hours: number | null;
  notes: string | null;
  created_at: string;
}

type WorkSchedule = Record<string, number>;

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DEFAULT_SCHEDULE: WorkSchedule = { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 };

function isEmptySchedule(schedule: WorkSchedule): boolean {
  return DAY_KEYS.every(key => !schedule[key] || schedule[key] === 0);
}

function calcWorkingDaysAndHours(
  startDate: string,
  endDate: string | null,
  schedule: WorkSchedule
): { workDays: number; totalHours: number } {
  const dayMap = [6, 0, 1, 2, 3, 4, 5]; // JS getDay() -> mon=0..sun=6
  const start = parseISO(startDate);
  const end = endDate ? parseISO(endDate) : new Date();
  if (start > end) return { workDays: 0, totalHours: 0 };

  const days = eachDayOfInterval({ start, end });
  let workDays = 0;
  let totalHours = 0;
  days.forEach((d) => {
    const dayIdx = dayMap[getDay(d)];
    const key = DAY_KEYS[dayIdx];
    const hours = schedule[key] || 0;
    if (hours > 0) {
      workDays++;
      totalHours += hours;
    }
  });
  return { workDays, totalHours };
}

interface AbsenceHistorySectionProps {
  personName: string;
  organizationId: string;
  absenceType: "sick_leave" | "vacation";
}

export function AbsenceHistorySection({ personName, organizationId, absenceType }: AbsenceHistorySectionProps) {
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [schedule, setSchedule] = useState<WorkSchedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
      const [recordsRes, settingsRes] = await Promise.all([
        supabase
          .from("absence_records")
          .select("id, person_name, absence_type, start_date, end_date, hours, notes, created_at")
          .eq("organization_id", organizationId)
          .eq("person_name", personName)
          .eq("absence_type", absenceType)
          .order("start_date", { ascending: false }),
        supabase
          .from("person_vacation_settings")
          .select("work_schedule")
          .eq("organization_id", organizationId)
          .eq("person_name", personName)
          .order("year", { ascending: false })
          .limit(1)
      ]);
      setRecords(recordsRes.data || []);
      if (settingsRes.data && settingsRes.data.length > 0) {
        const savedSchedule = settingsRes.data[0].work_schedule as WorkSchedule;
        setSchedule(isEmptySchedule(savedSchedule) ? DEFAULT_SCHEDULE : savedSchedule);
      }
      setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [personName, organizationId, absenceType]);

  const handleDelete = async (recordId: string) => {
    const { error } = await supabase
      .from("absence_records")
      .delete()
      .eq("id", recordId);
    if (error) {
      toast.error("Kon registratie niet verwijderen");
    } else {
      toast.success("Registratie verwijderd");
      fetchData();
    }
  };

  const label = absenceType === "sick_leave" ? "Ziektegeschiedenis" : "Verlofgeschiedenis";

  return (
    <div className="border-t pt-4">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
        <History className="h-3.5 w-3.5" />
        {label}
      </Label>
      {loading ? (
        <p className="text-sm text-muted-foreground py-2">Laden...</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Geen registraties gevonden</p>
      ) : (
        <div className="space-y-2 mt-2">
          {records.map((record) => {
            const { workDays, totalHours } = calcWorkingDaysAndHours(
              record.start_date,
              record.end_date,
              schedule
            );
            // If explicit hours set, use those instead
            const displayHours = record.hours != null && record.hours > 0 ? record.hours : totalHours;
            return (
              <div key={record.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {format(parseISO(record.start_date), "d MMM yyyy", { locale: nl })}
                    {record.end_date
                      ? ` — ${format(parseISO(record.end_date), "d MMM yyyy", { locale: nl })}`
                      : " — heden"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {workDays} werk{workDays === 1 ? "dag" : "dagen"}
                    </span>
                  </div>
                  {record.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{record.notes}</p>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Registratie verwijderen</AlertDialogTitle>
                      <AlertDialogDescription>
                        Weet je zeker dat je deze {absenceType === "sick_leave" ? "ziekte" : "verlof"}registratie wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(record.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Verwijderen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
