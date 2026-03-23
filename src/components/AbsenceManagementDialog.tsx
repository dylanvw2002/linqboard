import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CalendarIcon, Plus, Trash2, BarChart3, Users, ChevronLeft, ChevronRight, Clock, Edit2, Check, X, Sparkles, Loader2 } from "lucide-react";
import { format, differenceInCalendarDays, parseISO, eachDayOfInterval, getDay, getMonth } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface AbsenceRecord {
  id: string;
  organization_id: string;
  person_name: string;
  user_id: string | null;
  absence_type: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  hours: number | null;
}

interface VacationSettings {
  id: string;
  organization_id: string;
  person_name: string;
  user_id: string | null;
  total_vacation_hours: number;
  work_schedule: Record<string, number>;
  year: number;
}

interface OrgMember {
  user_id: string;
  full_name: string;
  avatar_url?: string | null;
}

interface AbsenceManagementDialogProps {
  organizationId: string;
  absenceType: "sick_leave" | "vacation";
  orgMembers: OrgMember[];
  children: React.ReactNode;
}

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "Ma", tue: "Di", wed: "Wo", thu: "Do", fri: "Vr", sat: "Za", sun: "Zo",
};

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function calcUsedHours(
  records: AbsenceRecord[],
  workSchedule: Record<string, number>,
  year: number
): number {
  const dayMap = [6, 0, 1, 2, 3, 4, 5]; // JS getDay() -> mon=0..sun=6
  let totalHours = 0;

  records.forEach((r) => {
    // If hours is explicitly set AND it's a single-day record, use that directly
    if (r.hours != null && r.hours > 0 && !r.end_date) {
      totalHours += r.hours;
      return;
    }

    // Otherwise calculate from work schedule
    const start = parseISO(r.start_date);
    const end = r.end_date ? parseISO(r.end_date) : new Date();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    const effectiveStart = start < yearStart ? yearStart : start;
    const effectiveEnd = end > yearEnd ? yearEnd : end;
    if (effectiveStart > effectiveEnd) return;

    const days = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
    days.forEach((d) => {
      const dayIdx = dayMap[getDay(d)];
      const key = DAY_KEYS[dayIdx];
      totalHours += workSchedule[key] || 0;
    });
  });

  return totalHours;
}

export function AbsenceManagementDialog({
  organizationId,
  absenceType,
  orgMembers,
  children,
}: AbsenceManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Vacation settings
  const [vacationSettings, setVacationSettings] = useState<VacationSettings[]>([]);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonSource, setNewPersonSource] = useState<"member" | "custom">("member");
  const [newPersonMemberId, setNewPersonMemberId] = useState("");
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonHours, setNewPersonHours] = useState("");
  const [newPersonSchedule, setNewPersonSchedule] = useState<Record<string, number>>({
    mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0,
  });
  const [editingSettingsId, setEditingSettingsId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState("");
  const [editSchedule, setEditSchedule] = useState<Record<string, number>>({});

  // Persisted + ad-hoc custom persons
  const [manualPersons, setManualPersons] = useState<string[]>([]);
  const [showAddStatsPerson, setShowAddStatsPerson] = useState(false);
  const [statsNewName, setStatsNewName] = useState("");
  const [selectedStatsPerson, setSelectedStatsPerson] = useState<string | null>(null);
  const [statsSearchQuery, setStatsSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null = hele jaar
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Add record form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [personSource, setPersonSource] = useState<"member" | "custom">("member");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");

  const title = absenceType === "sick_leave" ? "Ziektebeheer" : "Verlofbeheer";
  const typeLabel = absenceType === "sick_leave" ? "ziek" : "verlof";
  const isVacation = absenceType === "vacation";
  const defaultSchedule = { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 };

  useEffect(() => {
    if (open) {
      loadRecords();
      loadManualPersons();
      if (isVacation) loadVacationSettings();
    }
  }, [open, organizationId, selectedYear, absenceType, isVacation]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("absence_records")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("absence_type", absenceType)
        .order("start_date", { ascending: false });
      if (error) throw error;
      setRecords((data as AbsenceRecord[]) || []);
    } catch (error: any) {
      console.error("Error loading absence records:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadManualPersons = async () => {
    try {
      const [settingsRes, absenceRes] = await Promise.all([
        supabase
          .from("person_vacation_settings")
          .select("person_name, user_id")
          .eq("organization_id", organizationId)
          .eq("year", selectedYear),
        supabase
          .from("absence_records")
          .select("person_name, user_id")
          .eq("organization_id", organizationId),
      ]);

      const memberIds = new Set(orgMembers.map((m) => m.user_id));
      const memberNames = new Set(orgMembers.map((m) => m.full_name));
      const names = [...(settingsRes.data || []), ...(absenceRes.data || [])]
        .filter((person: any) => {
          if (person.user_id && memberIds.has(person.user_id)) return false;
          if (memberNames.has(person.person_name)) return false;
          return Boolean(person.person_name);
        })
        .map((person: any) => person.person_name.trim());

      setManualPersons([...new Set(names)].sort((a, b) => a.localeCompare(b, "nl")));
    } catch (error: any) {
      console.error("Error loading manual persons:", error);
    }
  };

  const loadVacationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("person_vacation_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("year", selectedYear)
        .order("person_name");
      if (error) throw error;
      setVacationSettings(
        (data || []).map((d: any) => ({
          ...d,
          work_schedule: typeof d.work_schedule === "string" ? JSON.parse(d.work_schedule) : d.work_schedule,
        }))
      );
    } catch (error: any) {
      console.error("Error loading vacation settings:", error);
    }
  };

  const handleAddPerson = async () => {
    const name =
      newPersonSource === "member"
        ? orgMembers.find((m) => m.user_id === newPersonMemberId)?.full_name
        : newPersonName.trim();

    if (!name) { toast.error("Selecteer of voer een naam in"); return; }
    const hours = parseFloat(newPersonHours);
    if (isNaN(hours) || hours < 0) { toast.error("Voer geldige vrije uren in"); return; }

    try {
      const { error } = await supabase.from("person_vacation_settings").insert({
        organization_id: organizationId,
        person_name: name,
        user_id: newPersonSource === "member" ? newPersonMemberId : null,
        total_vacation_hours: hours,
        work_schedule: newPersonSchedule,
        year: selectedYear,
      } as any);
      if (error) throw error;
      toast.success("Persoon toegevoegd");
      setShowAddPerson(false);
      setNewPersonMemberId("");
      setNewPersonName("");
      setNewPersonHours("");
      setNewPersonSchedule({ mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 });
      loadVacationSettings();
    } catch (error: any) {
      toast.error("Fout: " + error.message);
    }
  };

  const handleUpdateSettings = async (id: string) => {
    const hours = parseFloat(editHours);
    if (isNaN(hours) || hours < 0) { toast.error("Ongeldige uren"); return; }
    try {
      const { error } = await supabase
        .from("person_vacation_settings")
        .update({ total_vacation_hours: hours, work_schedule: editSchedule } as any)
        .eq("id", id);
      if (error) throw error;
      toast.success("Bijgewerkt");
      setEditingSettingsId(null);
      loadVacationSettings();
    } catch (error: any) {
      toast.error("Fout: " + error.message);
    }
  };

  const handleDeleteSettings = async (id: string) => {
    try {
      const { error } = await supabase.from("person_vacation_settings").delete().eq("id", id);
      if (error) throw error;
      toast.success("Verwijderd");
      setVacationSettings((prev) => prev.filter((s) => s.id !== id));
    } catch (error: any) {
      toast.error("Fout: " + error.message);
    }
  };

  const handleAddRecord = async () => {
    if (!startDate) { toast.error("Selecteer een startdatum"); return; }
    const personName =
      personSource === "member"
        ? orgMembers.find((m) => m.user_id === selectedMemberId)?.full_name
        : customName.trim();
    if (!personName) { toast.error("Selecteer of voer een naam in"); return; }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase.from("absence_records").insert({
        organization_id: organizationId,
        person_name: personName,
        user_id: personSource === "member" ? selectedMemberId : null,
        absence_type: absenceType,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
        notes: notes.trim() || null,
        created_by: session.user.id,
      });
      if (error) throw error;
      toast.success("Record toegevoegd");
      resetForm();
      loadRecords();
      loadManualPersons();
    } catch (error: any) {
      toast.error("Fout bij toevoegen: " + error.message);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const { error } = await supabase.from("absence_records").delete().eq("id", id);
      if (error) throw error;
      toast.success("Record verwijderd");
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (isVacation) loadVacationSettings();
    } catch (error: any) {
      toast.error("Fout bij verwijderen: " + error.message);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setPersonSource("member");
    setSelectedMemberId("");
    setCustomName("");
    setStartDate(undefined);
    setEndDate(undefined);
    setNotes("");
  };

  // Statistics
  const yearRecords = useMemo(
    () =>
      records.filter((r) => {
        const start = parseISO(r.start_date);
        const end = r.end_date ? parseISO(r.end_date) : new Date();
        const yearStart = new Date(selectedYear, 0, 1);
        const yearEnd = new Date(selectedYear, 11, 31);
        return start <= yearEnd && end >= yearStart;
      }),
    [records, selectedYear]
  );

  // Filter by selected month
  const filteredYearRecords = useMemo(() => {
    if (selectedMonth === null) return yearRecords;
    return yearRecords.filter((r) => {
      const start = parseISO(r.start_date);
      const end = r.end_date ? parseISO(r.end_date) : new Date();
      const monthStart = new Date(selectedYear, selectedMonth, 1);
      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
      return start <= monthEnd && end >= monthStart;
    });
  }, [yearRecords, selectedMonth, selectedYear]);

  const personStats = useMemo(() => {
    const stats: Record<string, { name: string; count: number; days: number; avatar_url?: string | null; isCustom?: boolean }> = {};

    // Add all org members as default entries
    orgMembers.forEach((m) => {
      stats[m.user_id] = { name: m.full_name, count: 0, days: 0, avatar_url: m.avatar_url };
    });

    // Add persisted manual persons (non-members)
    manualPersons.forEach((name) => {
      if (!Object.values(stats).some((s) => s.name === name)) {
        stats[`manual_${name}`] = { name, count: 0, days: 0, isCustom: true };
      }
    });

    // Fill in actual data from records
    filteredYearRecords.forEach((r) => {
      const key = r.user_id || r.person_name;
      if (!stats[key]) {
        stats[key] = { name: r.person_name, count: 0, days: 0, isCustom: !orgMembers.some((m) => m.full_name === r.person_name || m.user_id === r.user_id) };
      }
      stats[key].count += 1;
      const start = parseISO(r.start_date);
      const end = r.end_date ? parseISO(r.end_date) : new Date();
      const periodStart = selectedMonth !== null ? new Date(selectedYear, selectedMonth, 1) : new Date(selectedYear, 0, 1);
      const periodEnd = selectedMonth !== null ? new Date(selectedYear, selectedMonth + 1, 0) : new Date(selectedYear, 11, 31);
      const effectiveStart = start < periodStart ? periodStart : start;
      const effectiveEnd = end > periodEnd ? periodEnd : end;
      if (effectiveStart > effectiveEnd) return;
      // Count only weekdays (mon-fri)
      const allDays = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
      const workDays = allDays.filter((d) => { const day = getDay(d); return day !== 0 && day !== 6; });
      stats[key].days += workDays.length;
    });
    return Object.values(stats).sort((a, b) => b.days - a.days || a.name.localeCompare(b.name, "nl"));
  }, [filteredYearRecords, orgMembers, selectedYear, selectedMonth, manualPersons]);

  // Monthly chart data
  const monthlyChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
    const monthlyCounts = new Array(12).fill(0);
    yearRecords.forEach((r) => {
      const start = parseISO(r.start_date);
      const end = r.end_date ? parseISO(r.end_date) : new Date();
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31);
      const effectiveStart = start < yearStart ? yearStart : start;
      const effectiveEnd = end > yearEnd ? yearEnd : end;
      if (effectiveStart > effectiveEnd) return;
      const days = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
      days.forEach((d) => { const day = getDay(d); if (day !== 0 && day !== 6) monthlyCounts[getMonth(d)] += 1; });
    });
    return months.map((name, i) => ({ name, dagen: monthlyCounts[i] }));
  }, [yearRecords, selectedYear]);

  // Top persons chart data (top 5 by days)
  const topPersonsChartData = useMemo(() => {
    return personStats
      .filter((p) => p.days > 0)
      .slice(0, 6)
      .map((p) => ({ name: p.name.split(" ")[0], dagen: p.days, fullName: p.name }));
  }, [personStats]);

  const fetchAiAnalysis = useCallback(async () => {
    if (personStats.every((p) => p.count === 0)) {
      setAiAnalysis("Geen registraties gevonden om te analyseren.");
      return;
    }
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-absence", {
        body: {
          personStats: personStats.map((p) => ({ name: p.name, count: p.count, days: p.days })),
          yearRecords: yearRecords.map((r) => ({
            person_name: r.person_name,
            start_date: r.start_date,
            end_date: r.end_date,
            notes: r.notes,
          })),
          year: selectedYear,
          absenceType,
        },
      });
      if (error) throw error;
      setAiAnalysis(data.analysis);
    } catch (e: any) {
      console.error("AI analysis error:", e);
      setAiAnalysis("Analyse kon niet worden geladen.");
    } finally {
      setAiLoading(false);
    }
  }, [personStats, yearRecords, selectedYear, absenceType]);

  // Auto-trigger AI analysis when data is loaded
  useEffect(() => {
    if (open && !loading && filteredYearRecords.length > 0) {
      fetchAiAnalysis();
    } else if (filteredYearRecords.length === 0) {
      setAiAnalysis(null);
    }
  }, [open, loading, selectedYear, selectedMonth]);

  // Vacation balance per person
  const vacationBalances = useMemo(() => {
    if (!isVacation) return [];
    const defaultSchedule = { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 };
    const result: Array<VacationSettings & { usedHours: number; remainingHours: number; weeklyHours: number; member: OrgMember | null | undefined; hasSettings: boolean }> = [];
    const coveredUserIds = new Set<string>();

    // First add persons with settings
    vacationSettings.forEach((s) => {
      if (s.user_id) coveredUserIds.add(s.user_id);
      const personRecords = yearRecords.filter(
        (r) => (r.user_id && r.user_id === s.user_id) || r.person_name === s.person_name
      );
      const usedHours = calcUsedHours(personRecords, s.work_schedule, selectedYear);
      const weeklyHours = DAY_KEYS.reduce((sum, k) => sum + (s.work_schedule[k] || 0), 0);
      result.push({
        ...s,
        usedHours,
        remainingHours: s.total_vacation_hours - usedHours,
        weeklyHours,
        member: s.user_id ? orgMembers.find((m) => m.user_id === s.user_id) : null,
        hasSettings: true,
      });
    });

    // Add org members without settings as defaults
    orgMembers.forEach((m) => {
      if (!coveredUserIds.has(m.user_id)) {
        const personRecords = yearRecords.filter((r) => r.user_id === m.user_id || r.person_name === m.full_name);
        const usedHours = calcUsedHours(personRecords, defaultSchedule, selectedYear);
        const weeklyHours = DAY_KEYS.reduce((sum, k) => sum + (defaultSchedule[k] || 0), 0);
        result.push({
          id: `default_${m.user_id}`,
          organization_id: organizationId,
          person_name: m.full_name,
          user_id: m.user_id,
          total_vacation_hours: 0,
          work_schedule: defaultSchedule,
          year: selectedYear,
          usedHours,
          remainingHours: -usedHours,
          weeklyHours,
          member: m,
          hasSettings: false,
        });
      }
    });

    return result;
  }, [vacationSettings, yearRecords, orgMembers, selectedYear, isVacation, organizationId]);

  const YearSelector = () => (
    <div className="flex items-center justify-center gap-3">
      <Button variant="outline" size="icon" onClick={() => setSelectedYear((y) => y - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-lg font-bold min-w-[80px] text-center">{selectedYear}</span>
      <Button variant="outline" size="icon" onClick={() => setSelectedYear((y) => y + 1)} disabled={selectedYear >= new Date().getFullYear()}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const ScheduleEditor = ({
    schedule,
    onChange,
    compact = false,
  }: {
    schedule: Record<string, number>;
    onChange: (s: Record<string, number>) => void;
    compact?: boolean;
  }) => (
    <div className={cn("grid gap-1.5", compact ? "grid-cols-7" : "grid-cols-7")}>
      {DAY_KEYS.map((key) => (
        <div key={key} className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-medium text-muted-foreground">{DAY_LABELS[key]}</span>
          <Input
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={schedule[key] ?? 0}
            onChange={(e) => onChange({ ...schedule, [key]: parseFloat(e.target.value) || 0 })}
            className="h-8 w-full text-center text-xs px-1"
          />
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[96vw] sm:max-w-2xl max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-4 pt-6 sm:px-6 pb-3 shrink-0 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-4 sm:px-6 pb-4 sm:pb-6">
          <Tabs defaultValue={isVacation ? "balance" : "stats"} className="mt-4">
            <TabsList className={cn("w-full", isVacation && "grid grid-cols-2")}>
              {isVacation && (
                <TabsTrigger value="balance" className="gap-1.5">
                  <Clock className="h-4 w-4" />
                  Balans
                </TabsTrigger>
              )}
              <TabsTrigger value="stats" className="gap-1.5">
                <BarChart3 className="h-4 w-4" />
                Statistieken
              </TabsTrigger>
            </TabsList>

            {/* BALANCE TAB (vacation only) */}
            {isVacation && (
              <TabsContent value="balance" className="mt-4 space-y-4">
                <YearSelector />

                {/* Add person button */}
                {!showAddPerson ? (
                  <Button onClick={() => setShowAddPerson(true)} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Persoon toevoegen
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 bg-muted/50 rounded-xl border">
                    <h4 className="font-semibold text-sm">Persoon toevoegen voor {selectedYear}</h4>
                    <div className="flex gap-2">
                      <Button variant={newPersonSource === "member" ? "default" : "outline"} size="sm" onClick={() => setNewPersonSource("member")}>Teamlid</Button>
                      <Button variant={newPersonSource === "custom" ? "default" : "outline"} size="sm" onClick={() => setNewPersonSource("custom")}>Handmatig</Button>
                    </div>
                    {newPersonSource === "member" ? (
                      <Select value={newPersonMemberId} onValueChange={setNewPersonMemberId}>
                        <SelectTrigger><SelectValue placeholder="Selecteer teamlid" /></SelectTrigger>
                        <SelectContent>
                          {orgMembers.map((m) => (
                            <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} placeholder="Naam" />
                    )}
                    <div>
                      <Label>Vrije uren per jaar</Label>
                      <Input type="number" min={0} value={newPersonHours} onChange={(e) => setNewPersonHours(e.target.value)} placeholder="Bijv. 200" />
                    </div>
                    <div>
                      <Label>Werkuren per dag</Label>
                      <ScheduleEditor schedule={newPersonSchedule} onChange={setNewPersonSchedule} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddPerson} className="flex-1">Toevoegen</Button>
                      <Button variant="outline" onClick={() => setShowAddPerson(false)}>Annuleren</Button>
                    </div>
                  </div>
                )}

                {/* Balance list */}
                {vacationBalances.length === 0 && !showAddPerson ? (
                  <div className="text-center text-muted-foreground py-8">
                    Nog geen personen ingesteld voor {selectedYear}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vacationBalances.map((b) => {
                      const isEditing = editingSettingsId === b.id;
                      const pct = b.total_vacation_hours > 0 ? (b.usedHours / b.total_vacation_hours) * 100 : 0;
                      return (
                        <div key={b.id} className="p-3 bg-muted/50 rounded-xl border space-y-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={b.member?.avatar_url || undefined} />
                              <AvatarFallback className="text-sm font-bold bg-primary/20 text-primary">
                                {b.person_name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{b.person_name}</p>
                              {b.hasSettings ? (
                                <p className="text-xs text-muted-foreground">
                                  {b.weeklyHours}u/week · {b.usedHours}u opgenomen · {b.remainingHours}u over
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">Nog niet ingesteld</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {!isEditing ? (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingSettingsId(b.id); setEditHours(String(b.total_vacation_hours)); setEditSchedule({ ...b.work_schedule }); }}>
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={async () => {
                                    if (!b.hasSettings) {
                                      // Create settings for this member
                                      const hours = parseFloat(editHours);
                                      if (isNaN(hours) || hours < 0) { toast.error("Ongeldige uren"); return; }
                                      try {
                                        const { error } = await supabase.from("person_vacation_settings").insert({
                                          organization_id: organizationId,
                                          person_name: b.person_name,
                                          user_id: b.user_id,
                                          total_vacation_hours: hours,
                                          work_schedule: editSchedule,
                                          year: selectedYear,
                                        } as any);
                                        if (error) throw error;
                                        toast.success("Instellingen opgeslagen");
                                        setEditingSettingsId(null);
                                        loadVacationSettings();
                                      } catch (error: any) { toast.error("Fout: " + error.message); }
                                    } else {
                                      handleUpdateSettings(b.id);
                                    }
                                  }}>
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingSettingsId(null)}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                              {b.hasSettings && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSettings(b.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", pct > 90 ? "bg-red-400" : pct > 70 ? "bg-yellow-400" : "bg-blue-400")}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>{b.usedHours}u / {b.total_vacation_hours}u</span>
                            <span>{pct.toFixed(1)}% gebruikt</span>
                          </div>

                          {/* Editing */}
                          {isEditing && (
                            <div className="space-y-2 pt-2 border-t">
                              <div>
                                <Label className="text-xs">Vrije uren per jaar</Label>
                                <Input type="number" min={0} value={editHours} onChange={(e) => setEditHours(e.target.value)} className="h-8 text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">Werkuren per dag</Label>
                                <ScheduleEditor schedule={editSchedule} onChange={setEditSchedule} compact />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="stats" className="mt-4 space-y-4">
              <YearSelector />

              {/* Month filter */}
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant={selectedMonth === null ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setSelectedMonth(null)}
                >
                  Heel jaar
                </Button>
                {["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"].map((m, i) => (
                  <Button
                    key={i}
                    variant={selectedMonth === i ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => setSelectedMonth(i)}
                  >
                    {m}
                  </Button>
                ))}
              </div>

              {filteredYearRecords.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Geen registraties gevonden voor deze periode
                </div>
              ) : (
                <>
                  {/* AI Analysis */}
                  <div className="p-4 rounded-xl border bg-gradient-to-br from-muted/50 to-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold">AI Analyse</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={fetchAiAnalysis} disabled={aiLoading} className="h-7 text-xs">
                        {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                        {aiAnalysis ? "Opnieuw analyseren" : "Analyseren"}
                      </Button>
                    </div>
                    {aiLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Patronen worden geanalyseerd...
                      </div>
                    )}
                    {aiAnalysis && !aiLoading && (
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{aiAnalysis}</p>
                    )}
                  </div>

              {/* Chart Section */}
              {personStats.some((p) => p.days > 0) && (
                <div className="space-y-4">
                  {/* Monthly chart - full width */}
                  <div className="p-3 rounded-xl border bg-muted/30">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Dagen per maand</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={monthlyChartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Bar dataKey="dagen" radius={[4, 4, 0, 0]}>
                          {monthlyChartData.map((_, i) => (
                            <Cell key={i} fill={absenceType === "sick_leave" ? "hsl(0 72% 65%)" : "hsl(217 91% 60%)"} opacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Top persons chart */}
                  {topPersonsChartData.length > 0 && (
                    <div className="p-3 rounded-xl border bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Top personen</p>
                      <ResponsiveContainer width="100%" height={Math.max(100, topPersonsChartData.length * 32)}>
                        <BarChart data={topPersonsChartData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value: number, _: string, props: any) => [`${value} dagen`, props.payload.fullName]} />
                          <Bar dataKey="dagen" radius={[0, 4, 4, 0]}>
                            {topPersonsChartData.map((_, i) => (
                              <Cell key={i} fill={absenceType === "sick_leave" ? "hsl(0 72% 65%)" : "hsl(217 91% 60%)"} opacity={0.7 + (i * 0.05)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
              {!showAddStatsPerson ? (
                <Button onClick={() => setShowAddStatsPerson(true)} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Persoon toevoegen
                </Button>
              ) : (
                <div className="flex gap-2 p-3 bg-muted/50 rounded-xl border">
                  <Input
                    value={statsNewName}
                    onChange={(e) => setStatsNewName(e.target.value)}
                    placeholder="Naam invoeren"
                    className="flex-1"
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && statsNewName.trim()) {
                        const name = statsNewName.trim();
                        const exists = manualPersons.some((person) => person.toLowerCase() === name.toLowerCase());
                        if (!exists) {
                          const { error } = await supabase.from("person_vacation_settings").insert({
                            organization_id: organizationId,
                            person_name: name,
                            user_id: null,
                            total_vacation_hours: 0,
                            work_schedule: defaultSchedule,
                            year: selectedYear,
                          } as any);
                          if (error) {
                            toast.error("Fout: " + error.message);
                            return;
                          }
                        }
                        setStatsNewName("");
                        setShowAddStatsPerson(false);
                        loadManualPersons();
                        if (isVacation) loadVacationSettings();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      const name = statsNewName.trim();
                      if (!name) return;
                      const exists = manualPersons.some((person) => person.toLowerCase() === name.toLowerCase());
                      if (!exists) {
                        const { error } = await supabase.from("person_vacation_settings").insert({
                          organization_id: organizationId,
                          person_name: name,
                          user_id: null,
                          total_vacation_hours: 0,
                          work_schedule: defaultSchedule,
                          year: selectedYear,
                        } as any);
                        if (error) {
                          toast.error("Fout: " + error.message);
                          return;
                        }
                      }
                      setStatsNewName("");
                      setShowAddStatsPerson(false);
                      loadManualPersons();
                      if (isVacation) loadVacationSettings();
                    }}
                  >
                    Toevoegen
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowAddStatsPerson(false); setStatsNewName(""); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="rounded-xl border bg-background overflow-hidden">
                <Command
                  shouldFilter
                  value={statsSearchQuery}
                  onValueChange={setStatsSearchQuery}
                  className="bg-transparent"
                >
                  <CommandInput placeholder="Zoek op naam..." />
                  <CommandList className="max-h-none overflow-visible">
                    <CommandEmpty className="py-8 text-center text-muted-foreground">
                      Geen personen gevonden voor deze zoekopdracht
                    </CommandEmpty>
                    <CommandGroup className="space-y-3 p-3">
                      {personStats.map((person) => {
                        const personRecords = yearRecords
                          .filter((record) => record.person_name === person.name)
                          .sort((a, b) => b.start_date.localeCompare(a.start_date));

                        return (
                          <CommandItem
                            key={person.name}
                            value={person.name}
                            onSelect={() => setSelectedStatsPerson((current) => current === person.name ? null : person.name)}
                            className="block rounded-xl p-0 data-[selected=true]:bg-transparent data-[selected=true]:text-foreground"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl text-left hover:bg-muted/70 transition-colors">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={person.avatar_url || undefined} />
                                  <AvatarFallback className="text-sm font-bold bg-primary/20 text-primary">
                                    {person.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate">{person.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {person.count}x {typeLabel} · {person.days} dagen
                                  </p>
                                </div>
                                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={cn("h-full rounded-full", absenceType === "sick_leave" ? "bg-red-400" : "bg-blue-400")}
                                    style={{ width: `${Math.min(100, (person.days / (selectedMonth !== null ? 22 : 261)) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono text-muted-foreground w-10 text-right">
                                  {((person.days / (selectedMonth !== null ? 22 : 261)) * 100).toFixed(1)}%
                                </span>
                              </div>

                              {selectedStatsPerson === person.name && (
                                <div className="ml-4 pl-4 border-l border-border space-y-2">
                                  {personRecords.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">Geen registraties gevonden</p>
                                  ) : (
                                    personRecords.map((record) => (
                                      <div key={record.id} className="rounded-lg border bg-muted/30 p-3 flex items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium">
                                            {format(parseISO(record.start_date), "d MMM yyyy", { locale: nl })}
                                            {record.end_date
                                              ? ` — ${format(parseISO(record.end_date), "d MMM yyyy", { locale: nl })}`
                                              : " — heden"}
                                          </p>
                                          {record.notes && (
                                            <p className="text-xs text-muted-foreground mt-1 italic">{record.notes}</p>
                                          )}
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Weet je zeker dat je deze registratie wilt verwijderen?")) {
                                              handleDeleteRecord(record.id);
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
                </>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
