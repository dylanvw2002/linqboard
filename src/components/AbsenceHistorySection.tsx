import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { nl } from "date-fns/locale";
import { Clock, History } from "lucide-react";

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

interface AbsenceHistorySectionProps {
  personName: string;
  organizationId: string;
  absenceType: "sick_leave" | "vacation";
}

export function AbsenceHistorySection({ personName, organizationId, absenceType }: AbsenceHistorySectionProps) {
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("absence_records")
        .select("id, person_name, absence_type, start_date, end_date, hours, notes, created_at")
        .eq("organization_id", organizationId)
        .eq("person_name", personName)
        .eq("absence_type", absenceType)
        .order("start_date", { ascending: false });
      setRecords(data || []);
      setLoading(false);
    };
    fetchRecords();
  }, [personName, organizationId, absenceType]);

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
            const days = record.end_date
              ? differenceInCalendarDays(parseISO(record.end_date), parseISO(record.start_date)) + 1
              : differenceInCalendarDays(new Date(), parseISO(record.start_date)) + 1;
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
                      {days} {days === 1 ? "dag" : "dagen"}
                    </span>
                    {record.hours != null && record.hours > 0 && (
                      <span className="text-xs text-muted-foreground">
                        · {record.hours} uur
                      </span>
                    )}
                  </div>
                  {record.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{record.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
