import { useState, useEffect, useMemo } from "react";
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
import { CalendarIcon, Plus, Trash2, BarChart3, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
}

interface OrgMember {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface AbsenceManagementDialogProps {
  organizationId: string;
  absenceType: "sick_leave" | "vacation";
  orgMembers: OrgMember[];
  children: React.ReactNode;
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

  useEffect(() => {
    if (open) {
      loadRecords();
    }
  }, [open, organizationId]);

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

  const handleAddRecord = async () => {
    if (!startDate) {
      toast.error("Selecteer een startdatum");
      return;
    }

    const personName =
      personSource === "member"
        ? orgMembers.find((m) => m.user_id === selectedMemberId)?.full_name
        : customName.trim();

    if (!personName) {
      toast.error("Selecteer of voer een naam in");
      return;
    }

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
    } catch (error: any) {
      toast.error("Fout bij toevoegen: " + error.message);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from("absence_records")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Record verwijderd");
      setRecords(records.filter((r) => r.id !== id));
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

  // Statistics calculation
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

  const personStats = useMemo(() => {
    const stats: Record<string, { name: string; count: number; days: number; avatar_url?: string | null }> = {};

    yearRecords.forEach((r) => {
      const key = r.user_id || r.person_name;
      if (!stats[key]) {
        const member = r.user_id ? orgMembers.find((m) => m.user_id === r.user_id) : null;
        stats[key] = {
          name: r.person_name,
          count: 0,
          days: 0,
          avatar_url: member?.avatar_url,
        };
      }
      stats[key].count += 1;

      const start = parseISO(r.start_date);
      const end = r.end_date ? parseISO(r.end_date) : new Date();
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31);
      const effectiveStart = start < yearStart ? yearStart : start;
      const effectiveEnd = end > yearEnd ? yearEnd : end;
      stats[key].days += Math.max(0, differenceInCalendarDays(effectiveEnd, effectiveStart) + 1);
    });

    return Object.values(stats).sort((a, b) => b.days - a.days);
  }, [yearRecords, orgMembers, selectedYear]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[96vw] sm:max-w-2xl max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-4 pt-6 sm:px-6 pb-3 shrink-0 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-4 sm:px-6 pb-4 sm:pb-6">
          <Tabs defaultValue="stats" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="stats" className="flex-1 gap-1.5">
                <BarChart3 className="h-4 w-4" />
                Statistieken
              </TabsTrigger>
              <TabsTrigger value="records" className="flex-1 gap-1.5">
                <Users className="h-4 w-4" />
                Registraties
              </TabsTrigger>
            </TabsList>

            {/* STATISTICS TAB */}
            <TabsContent value="stats" className="mt-4 space-y-4">
              {/* Year selector */}
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedYear((y) => y - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-bold min-w-[80px] text-center">
                  {selectedYear}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedYear((y) => y + 1)}
                  disabled={selectedYear >= new Date().getFullYear()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {personStats.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Geen {typeLabel}registraties in {selectedYear}
                </div>
              ) : (
                <div className="space-y-3">
                  {personStats.map((person) => (
                    <div
                      key={person.name}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={person.avatar_url || undefined} />
                        <AvatarFallback className="text-sm font-bold bg-primary/20 text-primary">
                          {person.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {person.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {person.count}x {typeLabel} · {person.days} dagen
                        </p>
                      </div>
                      {/* Mini bar */}
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            absenceType === "sick_leave"
                              ? "bg-red-400"
                              : "bg-blue-400"
                          )}
                          style={{
                            width: `${Math.min(100, (person.days / 365) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-10 text-right">
                        {((person.days / 365) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* RECORDS TAB */}
            <TabsContent value="records" className="mt-4 space-y-4">
              {!showAddForm ? (
                <Button onClick={() => setShowAddForm(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {absenceType === "sick_leave"
                    ? "Ziekmelding toevoegen"
                    : "Verlof toevoegen"}
                </Button>
              ) : (
                <div className="space-y-3 p-4 bg-muted/50 rounded-xl border">
                  <h4 className="font-semibold text-sm">
                    Nieuwe registratie
                  </h4>

                  {/* Person source */}
                  <div className="flex gap-2">
                    <Button
                      variant={personSource === "member" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPersonSource("member")}
                    >
                      Teamlid
                    </Button>
                    <Button
                      variant={personSource === "custom" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPersonSource("custom")}
                    >
                      Handmatig
                    </Button>
                  </div>

                  {personSource === "member" ? (
                    <div>
                      <Label>Persoon</Label>
                      <Select
                        value={selectedMemberId}
                        onValueChange={setSelectedMemberId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer teamlid" />
                        </SelectTrigger>
                        <SelectContent>
                          {orgMembers.map((m) => (
                            <SelectItem key={m.user_id} value={m.user_id}>
                              {m.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <Label>Naam</Label>
                      <Input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Voer naam in"
                      />
                    </div>
                  )}

                  {/* Date pickers */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Startdatum *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate
                              ? format(startDate, "d MMM yyyy", { locale: nl })
                              : "Kies datum"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>Einddatum</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate
                              ? format(endDate, "d MMM yyyy", { locale: nl })
                              : "Lopend"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <Label>Notitie (optioneel)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Eventuele opmerkingen..."
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddRecord} className="flex-1">
                      Toevoegen
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}

              {/* Records list */}
              {loading ? (
                <div className="text-center text-muted-foreground py-4">
                  Laden...
                </div>
              ) : records.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nog geen registraties
                </div>
              ) : (
                <div className="space-y-2">
                  {records.map((record) => {
                    const member = record.user_id
                      ? orgMembers.find((m) => m.user_id === record.user_id)
                      : null;
                    const days = record.end_date
                      ? differenceInCalendarDays(
                          parseISO(record.end_date),
                          parseISO(record.start_date)
                        ) + 1
                      : differenceInCalendarDays(
                          new Date(),
                          parseISO(record.start_date)
                        ) + 1;

                    return (
                      <div
                        key={record.id}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={member?.avatar_url || undefined}
                          />
                          <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                            {record.person_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {record.person_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(record.start_date), "d MMM yyyy", {
                              locale: nl,
                            })}
                            {record.end_date
                              ? ` — ${format(
                                  parseISO(record.end_date),
                                  "d MMM yyyy",
                                  { locale: nl }
                                )}`
                              : " — heden"}{" "}
                            · {days} {days === 1 ? "dag" : "dagen"}
                          </p>
                          {record.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">
                              {record.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteRecord(record.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
