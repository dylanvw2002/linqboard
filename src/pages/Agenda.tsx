import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Plus, CalendarIcon, Clock, Trash2, Edit, CheckCircle2, Calendar as CalendarViewIcon, List, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, isToday, parseISO, addDays, addWeeks, isSameMonth, startOfMonth, endOfMonth, eachHourOfInterval, setHours, setMinutes, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  color: string;
  created_at: string;
}

interface TaskWithDeadline {
  id: string;
  title: string;
  due_date: string;
  priority: "low" | "medium" | "high" | null;
  column_name: string;
}

type ViewMode = "month" | "week" | "day";

const colorOptions = [
  { value: "blue", label: "Blauw", class: "bg-blue-500" },
  { value: "green", label: "Groen", class: "bg-green-500" },
  { value: "red", label: "Rood", class: "bg-red-500" },
  { value: "yellow", label: "Geel", class: "bg-yellow-500" },
  { value: "purple", label: "Paars", class: "bg-purple-500" },
  { value: "pink", label: "Roze", class: "bg-pink-500" },
  { value: "orange", label: "Oranje", class: "bg-orange-500" },
];

const getColorClass = (color: string) => {
  const found = colorOptions.find(c => c.value === color);
  return found?.class || "bg-blue-500";
};

export default function Agenda() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<TaskWithDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState("blue");

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    await Promise.all([fetchEvents(), fetchTasks(user.id)]);
    setLoading(false);
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
      return;
    }
    setEvents(data || []);
  };

  const fetchTasks = async (userId: string) => {
    // Get tasks where user is assigned
    const { data: assignedTasks } = await supabase
      .from("task_assignees")
      .select("task_id")
      .eq("user_id", userId);

    if (!assignedTasks?.length) {
      setTasks([]);
      return;
    }

    const taskIds = assignedTasks.map(a => a.task_id);

    // Get tasks with deadlines that user is assigned to
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("id, title, due_date, priority, column_id")
      .in("id", taskIds)
      .not("due_date", "is", null);

    if (!tasksData?.length) {
      setTasks([]);
      return;
    }

    // Get column names
    const columnIds = [...new Set(tasksData.map(t => t.column_id))];
    const { data: columns } = await supabase
      .from("columns")
      .select("id, name")
      .in("id", columnIds);

    const tasksWithColumns = tasksData.map(task => ({
      ...task,
      column_name: columns?.find(c => c.id === task.column_id)?.name || "",
    })) as TaskWithDeadline[];
    
    setTasks(tasksWithColumns);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setAllDay(false);
    setColor("blue");
    setEditingEvent(null);
  };

  const openCreateDialog = (date?: Date) => {
    resetForm();
    const targetDate = date || selectedDate;
    const dateStr = format(targetDate, "yyyy-MM-dd");
    setStartTime(`${dateStr}T09:00`);
    setEndTime(`${dateStr}T10:00`);
    setDialogOpen(true);
  };

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || "");
    setStartTime(format(parseISO(event.start_time), "yyyy-MM-dd'T'HH:mm"));
    setEndTime(event.end_time ? format(parseISO(event.end_time), "yyyy-MM-dd'T'HH:mm") : "");
    setAllDay(event.all_day);
    setColor(event.color);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Titel is verplicht");
      return;
    }
    if (!startTime) {
      toast.error("Starttijd is verplicht");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const eventData = {
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      start_time: new Date(startTime).toISOString(),
      end_time: endTime ? new Date(endTime).toISOString() : null,
      all_day: allDay,
      color,
    };

    if (editingEvent) {
      const { error } = await supabase
        .from("calendar_events")
        .update(eventData)
        .eq("id", editingEvent.id);

      if (error) {
        toast.error("Kon afspraak niet bijwerken");
        return;
      }
      toast.success("Afspraak bijgewerkt");
    } else {
      const { error } = await supabase
        .from("calendar_events")
        .insert(eventData);

      if (error) {
        toast.error("Kon afspraak niet toevoegen");
        return;
      }
      toast.success("Afspraak toegevoegd");
    }

    setDialogOpen(false);
    resetForm();
    fetchEvents();
  };

  const handleDelete = async (eventId: string) => {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      toast.error("Kon afspraak niet verwijderen");
      return;
    }
    toast.success("Afspraak verwijderd");
    fetchEvents();
  };

  // Get events and tasks for a specific date
  const getItemsForDate = (date: Date) => {
    const dateEvents = events.filter(event => 
      isSameDay(parseISO(event.start_time), date)
    );
    const dateTasks = tasks.filter(task => 
      task.due_date && isSameDay(parseISO(task.due_date), date)
    );
    return { events: dateEvents, tasks: dateTasks };
  };

  // Get dates that have events or tasks for calendar highlighting
  const datesWithItems = [
    ...events.map(e => parseISO(e.start_time)),
    ...tasks.filter(t => t.due_date).map(t => parseISO(t.due_date)),
  ];

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-muted";
    }
  };

  // Week view helpers
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Hours for day view
  const dayHours = Array.from({ length: 24 }, (_, i) => i);

  const renderEventCard = (event: CalendarEvent, compact = false) => (
    <div
      key={event.id}
      className={`flex items-start gap-2 p-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group cursor-pointer ${compact ? 'text-xs' : ''}`}
      onClick={() => openEditDialog(event)}
    >
      <div className={`w-1 h-full min-h-[24px] rounded-full ${getColorClass(event.color)} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'}`}>{event.title}</h4>
        {!compact && event.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {event.description}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {event.all_day ? (
            <span>Hele dag</span>
          ) : (
            <span>
              {format(parseISO(event.start_time), "HH:mm")}
              {event.end_time && ` - ${format(parseISO(event.end_time), "HH:mm")}`}
            </span>
          )}
        </div>
      </div>
      {!compact && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(event);
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(event.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );

  const renderTaskCard = (task: TaskWithDeadline, compact = false) => (
    <div
      key={task.id}
      className={`flex items-start gap-2 p-2 rounded-lg border border-border bg-muted/30 ${compact ? 'text-xs' : ''}`}
    >
      <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${getPriorityColor(task.priority)}`} />
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'}`}>{task.title}</h4>
        {!compact && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {task.column_name}
            </Badge>
            {task.priority && (
              <Badge variant="secondary" className="text-xs capitalize">
                {task.priority === "high" ? "Hoog" : task.priority === "medium" ? "Gemiddeld" : "Laag"}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderDayItems = (date: Date, compact = false) => {
    const { events: dayEvents, tasks: dayTasks } = getItemsForDate(date);
    
    if (dayEvents.length === 0 && dayTasks.length === 0) {
      return null;
    }

    return (
      <div className="space-y-1">
        {dayEvents.map(event => renderEventCard(event, compact))}
        {dayTasks.map(task => renderTaskCard(task, compact))}
      </div>
    );
  };

  // Month View Component
  const MonthView = () => {
    const { events: selectedDateEvents, tasks: selectedDateTasks } = getItemsForDate(selectedDate);

    return (
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-3'}`} style={{ minHeight: isMobile ? '400px' : '500px' }}>
        {/* Calendar */}
        <Card className={`${isMobile ? '' : 'lg:col-span-1'} flex flex-col`}>
          <CardContent className="p-4 flex-1 flex flex-col">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={nl}
              className="rounded-md pointer-events-auto w-full flex-1 flex flex-col [&_.rdp-months]:flex-1 [&_.rdp-month]:flex [&_.rdp-month]:flex-col [&_.rdp-month]:h-full [&_.rdp-caption]:mb-4 [&_.rdp-table]:flex-1 [&_.rdp-table]:flex [&_.rdp-table]:flex-col [&_.rdp-head]:mb-2 [&_.rdp-tbody]:flex-1 [&_.rdp-tbody]:flex [&_.rdp-tbody]:flex-col [&_.rdp-row]:flex-1 [&_.rdp-row]:flex [&_.rdp-cell]:flex-1 [&_.rdp-cell]:flex [&_.rdp-cell]:items-center [&_.rdp-cell]:justify-center [&_.rdp-day]:w-full [&_.rdp-day]:h-full [&_.rdp-day]:text-base [&_.rdp-head_row]:flex [&_.rdp-head_cell]:flex-1 [&_.rdp-head_cell]:text-center"
              modifiers={{
                hasItems: datesWithItems,
              }}
              modifiersStyles={{
                hasItems: {
                  fontWeight: "bold",
                  textDecoration: "underline",
                  textDecorationColor: "hsl(var(--primary))",
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card className={isMobile ? '' : 'lg:col-span-2'}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <span>
                {format(selectedDate, isMobile ? "EEE d MMM" : "EEEE d MMMM yyyy", { locale: nl })}
              </span>
              {isToday(selectedDate) && (
                <Badge variant="default">Vandaag</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className={isMobile ? "h-[300px]" : "h-[400px]"}>
              {selectedDateEvents.length === 0 && selectedDateTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm">Geen afspraken of taken</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-3"
                    onClick={() => openCreateDialog()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Toevoegen
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDateEvents.map(event => renderEventCard(event))}
                  {selectedDateTasks.length > 0 && selectedDateEvents.length > 0 && (
                    <div className="border-t border-border my-3" />
                  )}
                  {selectedDateTasks.length > 0 && (
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Mijn taken met deadline
                    </div>
                  )}
                  {selectedDateTasks.map(task => renderTaskCard(task))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Week View Component
  const WeekView = () => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedDate(addWeeks(selectedDate, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-base sm:text-lg">
            {format(weekStart, "d MMM", { locale: nl })} - {format(weekEnd, "d MMM yyyy", { locale: nl })}
          </CardTitle>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedDate(addWeeks(selectedDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-7'}`}>
          {weekDays.map((day) => {
            const { events: dayEvents, tasks: dayTasks } = getItemsForDate(day);
            const hasItems = dayEvents.length > 0 || dayTasks.length > 0;
            
            return (
              <div
                key={day.toISOString()}
                className={`rounded-lg border p-2 min-h-[120px] cursor-pointer transition-colors ${
                  isToday(day) ? 'border-primary bg-primary/5' : 'border-border'
                } ${isSameDay(day, selectedDate) ? 'ring-2 ring-primary' : ''} hover:bg-muted/50`}
                onClick={() => {
                  setSelectedDate(day);
                  if (isMobile) setViewMode("day");
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs sm:text-sm font-medium ${isToday(day) ? 'text-primary' : ''}`}>
                    {format(day, isMobile ? "EEE d" : "EEE", { locale: nl })}
                  </span>
                  {!isMobile && (
                    <span className={`text-lg font-bold ${isToday(day) ? 'text-primary' : ''}`}>
                      {format(day, "d")}
                    </span>
                  )}
                </div>
                <ScrollArea className="h-[80px]">
                  {hasItems ? (
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate ${getColorClass(event.color)} text-white`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayTasks.slice(0, 2).map(task => (
                        <div
                          key={task.id}
                          className="text-xs p-1 rounded truncate bg-muted border border-border"
                        >
                          📋 {task.title}
                        </div>
                      ))}
                      {(dayEvents.length > 3 || dayTasks.length > 2) && (
                        <div className="text-xs text-muted-foreground">
                          +{Math.max(0, dayEvents.length - 3) + Math.max(0, dayTasks.length - 2)} meer
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground opacity-50 text-center">
                      Geen items
                    </div>
                  )}
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  // Day View Component
  const DayView = () => {
    const { events: dayEvents, tasks: dayTasks } = getItemsForDate(selectedDate);
    
    // Group events by hour
    const getEventsForHour = (hour: number) => {
      return dayEvents.filter(event => {
        const eventHour = parseISO(event.start_time).getHours();
        return eventHour === hour;
      });
    };

    const allDayEvents = dayEvents.filter(e => e.all_day);
    const timedEvents = dayEvents.filter(e => !e.all_day);

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">
              {format(selectedDate, isMobile ? "EEE d MMM" : "EEEE d MMMM yyyy", { locale: nl })}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Vandaag
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              >
                →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          {/* All day events */}
          {(allDayEvents.length > 0 || dayTasks.length > 0) && (
            <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Hele dag / Taken
              </div>
              <div className="space-y-1">
                {allDayEvents.map(event => renderEventCard(event, true))}
                {dayTasks.map(task => renderTaskCard(task, true))}
              </div>
            </div>
          )}

          {/* Hourly timeline */}
          <ScrollArea className={isMobile ? "h-[400px]" : "h-[500px]"}>
            <div className="space-y-0">
              {dayHours.map((hour) => {
                const hourEvents = getEventsForHour(hour);
                
                return (
                  <div
                    key={hour}
                    className="flex border-t border-border min-h-[48px] hover:bg-muted/30 cursor-pointer"
                    onClick={() => {
                      const dateStr = format(selectedDate, "yyyy-MM-dd");
                      setStartTime(`${dateStr}T${hour.toString().padStart(2, '0')}:00`);
                      setEndTime(`${dateStr}T${(hour + 1).toString().padStart(2, '0')}:00`);
                      setDialogOpen(true);
                    }}
                  >
                    <div className="w-12 sm:w-16 flex-shrink-0 py-2 pr-2 text-right text-xs text-muted-foreground">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    <div className="flex-1 py-1 pl-2 border-l border-border">
                      {hourEvents.map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1.5 rounded mb-1 ${getColorClass(event.color)} text-white cursor-pointer`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(event);
                          }}
                        >
                          <div className="font-medium">{event.title}</div>
                          <div className="opacity-80">
                            {format(parseISO(event.start_time), "HH:mm")}
                            {event.end_time && ` - ${format(parseISO(event.end_time), "HH:mm")}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <h1 className="text-base sm:text-xl font-bold">Mijn Agenda</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex items-center bg-muted rounded-lg p-0.5">
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2 sm:px-3"
                  onClick={() => setViewMode("month")}
                >
                  <LayoutGrid className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline text-xs">Maand</span>
                </Button>
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2 sm:px-3"
                  onClick={() => setViewMode("week")}
                >
                  <CalendarViewIcon className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline text-xs">Week</span>
                </Button>
                <Button
                  variant={viewMode === "day" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2 sm:px-3"
                  onClick={() => setViewMode("day")}
                >
                  <List className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline text-xs">Dag</span>
                </Button>
              </div>

              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size={isMobile ? "sm" : "default"} onClick={() => openCreateDialog()}>
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Afspraak</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEvent ? "Afspraak bewerken" : "Nieuwe afspraak"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titel</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Afspraak titel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Beschrijving</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optionele beschrijving"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="all-day">Hele dag</Label>
                      <Switch
                        id="all-day"
                        checked={allDay}
                        onCheckedChange={setAllDay}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-time">Start</Label>
                        <Input
                          id="start-time"
                          type={allDay ? "date" : "datetime-local"}
                          value={allDay ? startTime.split("T")[0] : startTime}
                          onChange={(e) => setStartTime(allDay ? `${e.target.value}T00:00` : e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-time">Eind</Label>
                        <Input
                          id="end-time"
                          type={allDay ? "date" : "datetime-local"}
                          value={allDay ? endTime.split("T")[0] : endTime}
                          onChange={(e) => setEndTime(allDay ? `${e.target.value}T23:59` : e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Kleur</Label>
                      <div className="flex gap-2 flex-wrap">
                        {colorOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setColor(option.value)}
                            className={`w-8 h-8 rounded-full ${option.class} ${
                              color === option.value ? "ring-2 ring-offset-2 ring-primary" : ""
                            }`}
                            title={option.label}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSave} className="flex-1">
                        {editingEvent ? "Bijwerken" : "Toevoegen"}
                      </Button>
                      {editingEvent && (
                        <Button 
                          variant="destructive" 
                          size="icon"
                          onClick={() => {
                            handleDelete(editingEvent.id);
                            setDialogOpen(false);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {viewMode === "month" && <MonthView />}
        {viewMode === "week" && <WeekView />}
        {viewMode === "day" && <DayView />}
      </main>
    </div>
  );
}
