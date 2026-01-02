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
import { ArrowLeft, Plus, CalendarIcon, Clock, Trash2, Edit, CheckCircle2 } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday, parseISO, addHours } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
    await Promise.all([fetchEvents(), fetchTasks()]);
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

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's organizations
    const { data: memberships } = await supabase
      .from("memberships")
      .select("organization_id")
      .eq("user_id", user.id);

    if (!memberships?.length) return;

    // Get boards for these organizations
    const { data: boards } = await supabase
      .from("boards")
      .select("id")
      .in("organization_id", memberships.map(m => m.organization_id));

    if (!boards?.length) return;

    // Get columns for these boards
    const { data: columns } = await supabase
      .from("columns")
      .select("id, name")
      .in("board_id", boards.map(b => b.id));

    if (!columns?.length) return;

    // Get tasks with deadlines
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("id, title, due_date, priority, column_id")
      .in("column_id", columns.map(c => c.id))
      .not("due_date", "is", null);

    if (tasksData) {
      const tasksWithColumns = tasksData.map(task => ({
        ...task,
        column_name: columns.find(c => c.id === task.column_id)?.name || "",
      })) as TaskWithDeadline[];
      setTasks(tasksWithColumns);
    }
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

  const openCreateDialog = () => {
    resetForm();
    // Pre-fill with selected date
    const dateStr = format(selectedDate, "yyyy-MM-dd");
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

  // Get events and tasks for selected date
  const selectedDateEvents = events.filter(event => 
    isSameDay(parseISO(event.start_time), selectedDate)
  );
  const selectedDateTasks = tasks.filter(task => 
    task.due_date && isSameDay(parseISO(task.due_date), selectedDate)
  );

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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Mijn Agenda</h1>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Afspraak
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={nl}
                className="rounded-md pointer-events-auto"
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
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>
                  {format(selectedDate, "EEEE d MMMM yyyy", { locale: nl })}
                </span>
                {isToday(selectedDate) && (
                  <Badge variant="default">Vandaag</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {selectedDateEvents.length === 0 && selectedDateTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mb-4 opacity-50" />
                    <p>Geen afspraken of taken voor deze dag</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={openCreateDialog}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Afspraak toevoegen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Events */}
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group"
                      >
                        <div className={`w-1 h-full min-h-[48px] rounded-full ${getColorClass(event.color)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{event.title}</h4>
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
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
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(event)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Tasks with deadlines */}
                    {selectedDateTasks.length > 0 && (
                      <>
                        {selectedDateEvents.length > 0 && (
                          <div className="border-t border-border my-4" />
                        )}
                        <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Taken met deadline
                        </div>
                        {selectedDateTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
                          >
                            <div className={`w-3 h-3 rounded-full mt-1.5 ${getPriorityColor(task.priority)}`} />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{task.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {task.column_name}
                                </Badge>
                                {task.priority && (
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs capitalize"
                                  >
                                    {task.priority === "high" ? "Hoog" : task.priority === "medium" ? "Gemiddeld" : "Laag"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
