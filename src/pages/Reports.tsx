import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BarChart3, Clock, CheckCircle2, Users, TrendingUp, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, startOfWeek, endOfWeek, eachWeekOfInterval } from "date-fns";
import { nl } from "date-fns/locale";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [period, setPeriod] = useState("month");

  // Data
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, inProgress: 0 });
  const [timeData, setTimeData] = useState<any[]>([]);
  const [tasksByColumn, setTasksByColumn] = useState<any[]>([]);
  const [taskCreationTrend, setTaskCreationTrend] = useState<any[]>([]);
  const [absenceStats, setAbsenceStats] = useState<any[]>([]);
  const [topTrackers, setTopTrackers] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data: memberships } = await supabase.from("memberships").select("organization_id, organizations(id, name)").eq("user_id", session.user.id);
      if (memberships && memberships.length > 0) {
        const orgs = memberships.map((m: any) => m.organizations).filter(Boolean);
        setOrganizations(orgs);
        if (orgs.length > 0) setSelectedOrg(orgs[0].id);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (!selectedOrg) return;
    fetchReportData();
  }, [selectedOrg, period]);

  const fetchReportData = async () => {
    const now = new Date();
    const start = period === "month" ? startOfMonth(now) : startOfMonth(subMonths(now, 2));
    const end = endOfMonth(now);

    // Fetch boards for this org
    const { data: boards } = await supabase.from("boards").select("id").eq("organization_id", selectedOrg);
    if (!boards || boards.length === 0) return;
    const boardIds = boards.map(b => b.id);

    // Fetch columns
    const { data: cols } = await supabase.from("columns").select("id, name, column_type, board_id").in("board_id", boardIds);
    if (!cols) return;
    const colIds = cols.map(c => c.id);
    const regularCols = cols.filter(c => c.column_type === "regular" || c.column_type === "completed");

    // Fetch tasks
    const { data: allTasks } = await supabase.from("tasks").select("id, column_id, created_at, position").in("column_id", colIds);
    if (!allTasks) return;

    // Task stats
    const completedCols = cols.filter(c => c.column_type === "completed").map(c => c.id);
    const completed = allTasks.filter(t => completedCols.includes(t.column_id)).length;
    setTaskStats({ total: allTasks.length, completed, inProgress: allTasks.length - completed });

    // Tasks by column (pie chart)
    const colCounts = regularCols.map(c => ({
      name: c.name,
      value: allTasks.filter(t => t.column_id === c.id).length,
    })).filter(c => c.value > 0);
    setTasksByColumn(colCounts);

    // Task creation trend (line chart)
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    const trend = weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const count = allTasks.filter(t => {
        const d = new Date(t.created_at);
        return d >= weekStart && d <= weekEnd;
      }).length;
      return { week: format(weekStart, "dd MMM", { locale: nl }), taken: count };
    });
    setTaskCreationTrend(trend);

    // Time entries
    const taskIds = allTasks.map(t => t.id);
    if (taskIds.length > 0) {
      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("user_id, duration_minutes")
        .in("task_id", taskIds.slice(0, 500))
        .not("duration_minutes", "is", null);

      if (timeEntries && timeEntries.length > 0) {
        // Get profiles
        const userIds = [...new Set(timeEntries.map((e: any) => e.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        const nameMap: Record<string, string> = {};
        profiles?.forEach((p: any) => { nameMap[p.user_id] = p.full_name; });

        const userTotals: Record<string, number> = {};
        timeEntries.forEach((e: any) => {
          userTotals[e.user_id] = (userTotals[e.user_id] || 0) + (e.duration_minutes || 0);
        });

        const trackers = Object.entries(userTotals)
          .map(([uid, mins]) => ({ name: nameMap[uid] || "Onbekend", minuten: mins }))
          .sort((a, b) => b.minuten - a.minuten);
        setTopTrackers(trackers);
        setTimeData(trackers);
      } else {
        setTopTrackers([]);
        setTimeData([]);
      }
    }

    // Absence stats
    const { data: absences } = await supabase
      .from("absence_records")
      .select("person_name, absence_type, start_date, end_date")
      .eq("organization_id", selectedOrg);
    
    if (absences && absences.length > 0) {
      const personStats: Record<string, { sick: number; vacation: number }> = {};
      absences.forEach((a: any) => {
        if (!personStats[a.person_name]) personStats[a.person_name] = { sick: 0, vacation: 0 };
        if (a.absence_type === "sick_leave") personStats[a.person_name].sick++;
        else personStats[a.person_name].vacation++;
      });
      setAbsenceStats(Object.entries(personStats).map(([name, s]) => ({
        name,
        ziekmeldingen: s.sick,
        verlof: s.vacation,
      })));
    } else {
      setAbsenceStats([]);
    }
  };

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}u ${m}m` : `${m}m`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Rapportages</h1>
              <p className="text-sm text-muted-foreground">Inzicht in je team en projecten</p>
            </div>
          </div>
          <div className="flex gap-3">
            {organizations.length > 1 && (
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Deze maand</SelectItem>
                <SelectItem value="quarter">Afgelopen 3 maanden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{taskStats.total}</p>
                  <p className="text-sm text-muted-foreground">Totaal taken</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{taskStats.completed}</p>
                  <p className="text-sm text-muted-foreground">Afgerond</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatMinutes(topTrackers.reduce((s, t) => s + t.minuten, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Uren gelogd</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{absenceStats.length}</p>
                  <p className="text-sm text-muted-foreground">Personen met verzuim</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task creation trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Taken aangemaakt per week
              </CardTitle>
            </CardHeader>
            <CardContent>
              {taskCreationTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={taskCreationTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line type="monotone" dataKey="taken" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-10">Geen data beschikbaar</p>
              )}
            </CardContent>
          </Card>

          {/* Tasks by column */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Taken per kolom
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasksByColumn.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={tasksByColumn} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name} (${value})`}>
                      {tasksByColumn.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-10">Geen data beschikbaar</p>
              )}
            </CardContent>
          </Card>

          {/* Time tracking per person */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Tijdregistratie per persoon
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={timeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                    <Tooltip formatter={(value: number) => formatMinutes(value)} />
                    <Bar dataKey="minuten" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-10">Nog geen tijd geregistreerd</p>
              )}
            </CardContent>
          </Card>

          {/* Absence overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4" />
                Verzuimoverzicht
              </CardTitle>
            </CardHeader>
            <CardContent>
              {absenceStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={absenceStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ziekmeldingen" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="verlof" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-10">Geen verzuimdata</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
