import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { nl } from "date-fns/locale";
import { z } from "zod";
import { cn } from "@/lib/utils";

interface Column {
  id: string;
  name: string;
  position: number;
}

interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  position: number;
  due_date?: string | null;
}

const taskSchema = z.object({
  title: z.string().trim().min(1, "Titel is verplicht").max(200, "Titel mag maximaal 200 tekens zijn"),
  description: z.string().trim().max(1000, "Beschrijving mag maximaal 1000 tekens zijn").optional(),
});

const Board = () => {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [board, setBoard] = useState<any>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskDueDate, setEditTaskDueDate] = useState<Date | undefined>(undefined);
  const [editTaskPriority, setEditTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingTaskColumn, setEditingTaskColumn] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
    fetchBoardData();
    setupRealtimeSubscriptions();
  }, [organizationId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: membership } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!membership) {
      toast.error("Je hebt geen toegang tot deze organisatie");
      navigate("/dashboard");
    }
  };

  const fetchBoardData = async () => {
    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationId)
        .single();

      setOrganization(org);

      const { data: boardData } = await supabase
        .from("boards")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      setBoard(boardData);

      if (boardData) {
        const { data: columnsData } = await supabase
          .from("columns")
          .select("*")
          .eq("board_id", boardData.id)
          .order("position");

        setColumns(columnsData || []);

        if (columnsData && columnsData.length > 0) {
          const columnIds = columnsData.map(c => c.id);
          const { data: tasksData } = await supabase
            .from("tasks")
            .select("*")
            .in("column_id", columnIds)
            .order("position");

          setTasks(tasksData || []);
        }
      }
    } catch (error: any) {
      toast.error("Fout bij laden van board");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const tasksChannel = supabase
      .channel("tasks-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          fetchBoardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
    };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Hoog";
      case "medium":
        return "Middel";
      case "low":
        return "Laag";
      default:
        return priority;
    }
  };

  const getDeadlineBadgeColor = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const twoDaysFromNow = addDays(now, 2);

    if (isBefore(due, now)) {
      return "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]"; // Rood - verlopen
    } else if (isBefore(due, twoDaysFromNow)) {
      return "bg-[#fef3c7] text-[#7c2d12] border-[#fde68a]"; // Oranje - binnen 2 dagen
    } else {
      return "bg-[#dcfce7] text-[#065f46] border-[#bbf7d0]"; // Groen - toekomstig
    }
  };

  const getPriorityBadge = (priority: "low" | "medium" | "high") => {
    const config = {
      high: { label: "Hoog", color: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]" },
      medium: { label: "Middel", color: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]" },
      low: { label: "Laag", color: "bg-[#dcfce7] text-[#065f46] border-[#bbf7d0]" },
    };
    return config[priority];
  };

  const openEditDialog = (task: Task) => {
    const column = columns.find((col) => col.id === task.column_id);
    setEditingTaskColumn(column?.name || null);
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || "");
    setEditTaskDueDate(task.due_date ? new Date(task.due_date) : undefined);
    setEditTaskPriority(task.priority);
  };

  const handleEditTask = async () => {
    if (!editingTask) return;

    try {
      const validation = taskSchema.safeParse({
        title: editTaskTitle,
        description: editTaskDescription,
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .update({
          title: validation.data.title,
          description: validation.data.description || null,
          due_date: editTaskDueDate ? editTaskDueDate.toISOString() : null,
          priority: editTaskPriority,
        })
        .eq("id", editingTask.id);

      if (error) throw error;

      toast.success("Taak bijgewerkt");
      setEditingTask(null);
      await fetchBoardData();
    } catch (error: any) {
      toast.error("Fout bij bijwerken taak");
    }
  };

  const handleCompleteFromDialog = async () => {
    if (!editingTask) return;
    setEditingTask(null);
    await handleMarkDone(editingTask);
  };

  const handleDeleteFromDialog = async () => {
    if (!editingTask) return;
    const taskId = editingTask.id;
    setEditingTask(null);
    await handleDeleteTask(taskId);
  };

  const getColumnTasks = (columnName: string) =>
    tasks.filter((task) => {
      const column = columns.find((col) => col.id === task.column_id);
      return column?.name === columnName;
    });

  const handleClearCompleted = async () => {
    const completedColumn = columns.find((col) => col.name === "Afgerond");
    if (!completedColumn) return;

    const completedTasks = tasks.filter(
      (task) => task.column_id === completedColumn.id
    );

    for (const task of completedTasks) {
      await supabase.from("tasks").delete().eq("id", task.id);
    }

    toast.success(`${completedTasks.length} taken verwijderd`);
    await fetchBoardData();
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleAddTask = async (columnName: string) => {
    try {
      const validation = taskSchema.safeParse({
        title: newTaskTitle,
        description: newTaskDescription,
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      const column = columns.find((col) => col.name === columnName);
      if (!column) {
        toast.error("Kolom niet gevonden");
        return;
      }

      const maxPosition = tasks
        .filter((t) => t.column_id === column.id)
        .reduce((max, t) => Math.max(max, t.position), -1);

      const { error } = await supabase.from("tasks").insert({
        column_id: column.id,
        title: validation.data.title,
        description: validation.data.description || null,
        priority: newTaskPriority,
        due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null,
        position: maxPosition + 1,
      });

      if (error) throw error;

      toast.success("Taak toegevoegd");
      setOpenDialog(null);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("medium");
      setNewTaskDueDate(undefined);
      await fetchBoardData();
    } catch (error: any) {
      toast.error("Fout bij toevoegen taak");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
      toast.success("Taak verwijderd");
      await fetchBoardData();
    } catch (error: any) {
      toast.error("Fout bij verwijderen taak");
    }
  };

  const handleMarkDone = async (task: Task) => {
    try {
      const doneColumn = columns.find((col) => col.name === "Afgerond");
      if (!doneColumn) {
        toast.error("Afgerond kolom niet gevonden");
        return;
      }

      const maxPosition = tasks
        .filter((t) => t.column_id === doneColumn.id)
        .reduce((max, t) => Math.max(max, t.position), -1);

      const { error } = await supabase
        .from("tasks")
        .update({
          column_id: doneColumn.id,
          position: maxPosition + 1,
          priority: "low",
        })
        .eq("id", task.id);

      if (error) throw error;
      toast.success("Taak afgerond");
      await fetchBoardData();
    } catch (error: any) {
      toast.error("Fout bij afgeronden taak");
    }
  };

  const handleChangePriority = async (task: Task, direction: "up" | "down") => {
    const priorities: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];
    const currentIndex = priorities.indexOf(task.priority);
    
    let newPriority: "low" | "medium" | "high";
    if (direction === "up") {
      newPriority = currentIndex < 2 ? priorities[currentIndex + 1] : task.priority;
    } else {
      newPriority = currentIndex > 0 ? priorities[currentIndex - 1] : task.priority;
    }

    if (newPriority === task.priority) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ priority: newPriority })
        .eq("id", task.id);

      if (error) throw error;
      toast.success(`Prioriteit aangepast naar ${getPriorityLabel(newPriority)}`);
      await fetchBoardData();
    } catch (error: any) {
      toast.error("Fout bij aanpassen prioriteit");
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDraggedOverColumn(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent, columnName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggedOverColumn(columnName);
  };

  const handleDrop = async (e: React.DragEvent, columnName: string) => {
    e.preventDefault();
    if (!draggedTask) return;

    const targetColumn = columns.find((col) => col.name === columnName);
    if (!targetColumn) return;

    const currentColumn = columns.find((col) => col.id === draggedTask.column_id);
    
    // Check of de taak uit "Belangrijke informatie" komt
    if (currentColumn?.name === "Belangrijke informatie" && columnName !== "Belangrijke informatie") {
      toast.error("Items uit Belangrijke informatie kunnen niet naar andere kolommen verplaatst worden");
      setDraggedTask(null);
      setDraggedOverColumn(null);
      setIsDragging(false);
      return;
    }

    // Check of we proberen iets anders naar "Belangrijke informatie" te slepen
    if (currentColumn?.name !== "Belangrijke informatie" && columnName === "Belangrijke informatie") {
      toast.error("Alleen items uit Belangrijke informatie kunnen hierin geplaatst worden");
      setDraggedTask(null);
      setDraggedOverColumn(null);
      setIsDragging(false);
      return;
    }

    // Als de taak al in deze kolom zit, doe niets
    if (currentColumn?.name === columnName) {
      setDraggedTask(null);
      setDraggedOverColumn(null);
      setIsDragging(false);
      return;
    }

    try {
      const maxPosition = tasks
        .filter((t) => t.column_id === targetColumn.id)
        .reduce((max, t) => Math.max(max, t.position), -1);

      const { error } = await supabase
        .from("tasks")
        .update({
          column_id: targetColumn.id,
          position: maxPosition + 1,
        })
        .eq("id", draggedTask.id);

      if (error) throw error;
      toast.success(`Taak verplaatst naar ${columnName}`);
      await fetchBoardData();
    } catch (error: any) {
      toast.error("Fout bij verplaatsen taak");
    }

    setDraggedTask(null);
    setDraggedOverColumn(null);
    setIsDragging(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Board laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden relative bg-background">
      <div className="origin-top-left scale-[0.75] w-[133.33vw] h-[133.33vh]">
        <div className="grid grid-rows-[auto_1fr] gap-[18px] p-[22px] h-screen">
      <style>{`
        body, html {
          overflow-x: hidden !important;
        }
        .list::-webkit-scrollbar {
          width: 14px;
        }
        .list::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, hsl(250 70% 60%), hsl(280 70% 65%));
          border-radius: 10px;
          border: 4px solid transparent;
          background-clip: content-box;
        }
        .list::-webkit-scrollbar-track {
          background: transparent;
        }
        @keyframes pop {
          from {
            transform: scale(0.96);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(8px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Header */}
      <header className="grid grid-cols-[minmax(300px,1fr)_auto_auto] items-center gap-4 backdrop-blur-xl bg-white/80 dark:bg-card/90 border border-gray-200 dark:border-border px-5 py-[18px] rounded-[18px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10 min-w-0">
          <h1 className="font-extrabold tracking-[0.2px] leading-[1.1] text-[clamp(26px,3.5vw,48px)] bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {organization?.name || "NRG TOTAAL"} – To-Do Board
          </h1>
          <p className="text-muted-foreground font-semibold text-[clamp(12px,1.4vw,16px)]">
            Live overzicht voor het team – klik op een taak om te bewerken • Sleep om te ordenen
          </p>
        </div>
        <div className="relative z-10 [font-variant-numeric:tabular-nums] font-bold text-[clamp(20px,3vw,40px)] px-3.5 py-1.5 rounded-xl backdrop-blur-sm bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] shrink-0">
          <div className="text-primary whitespace-nowrap">{formatTime(currentTime)}</div>
          <div className="text-[clamp(10px,1.2vw,14px)] text-muted-foreground font-semibold whitespace-nowrap">{formatDate(currentTime)}</div>
        </div>
        <div className="flex gap-2.5 relative z-10">
          <button
            onClick={() => navigate("/dashboard")}
            className="backdrop-blur-md bg-card/80 text-foreground border border-border/60 px-3.5 py-2.5 rounded-xl font-bold cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 hover:bg-card text-[clamp(12px,1.4vw,16px)] flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={handleFullscreen}
            className="backdrop-blur-md bg-card/80 text-foreground border border-border/60 px-3.5 py-2.5 rounded-xl font-bold cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 hover:bg-card text-[clamp(12px,1.4vw,16px)]"
          >
            ⛶ Volledig scherm
          </button>
          <button
            onClick={handleClearCompleted}
            className="backdrop-blur-md bg-card/80 text-foreground border border-border/60 px-3.5 py-2.5 rounded-xl font-bold cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 hover:bg-card text-[clamp(12px,1.4vw,16px)]"
          >
            🧹 Leeg Afgerond
          </button>
        </div>
      </header>

      {/* Board Grid */}
      <main className="grid grid-cols-[repeat(4,minmax(260px,1fr))] gap-[18px] h-full max-[1100px]:grid-cols-2 max-[680px]:grid-cols-1">
        {/* Kolom 1: Vandaag */}
        <section className="flex flex-col min-w-0">
          <div className="flex items-center justify-between px-3.5 py-3 rounded-[14px] backdrop-blur-xl bg-white/60 dark:bg-card/60 border border-border/40 mb-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative overflow-hidden group">
            <div className="text-[clamp(16px,2vw,22px)] font-extrabold text-foreground relative z-10">Vandaag</div>
            <Dialog open={openDialog === "Vandaag"} onOpenChange={(open) => setOpenDialog(open ? "Vandaag" : null)}>
              <DialogTrigger asChild>
                <button className="backdrop-blur-md bg-card/80 text-foreground border border-border/60 px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-card transition-all relative z-10">
                  ＋ Taak
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nieuwe taak toevoegen - Vandaag</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titel *</Label>
                    <Input
                      id="title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Titel van de taak"
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Beschrijving</Label>
                    <Textarea
                      id="description"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Extra details..."
                      maxLength={1000}
                    />
                  </div>
                  <div>
                    <Label>Deadline</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newTaskDueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newTaskDueDate ? format(newTaskDueDate, "PPP", { locale: nl }) : "Selecteer datum"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newTaskDueDate}
                          onSelect={setNewTaskDueDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                        {newTaskDueDate && (
                          <div className="p-3 border-t">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => setNewTaskDueDate(undefined)}
                            >
                              Verwijder datum
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Prioriteit</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={newTaskPriority === "low" ? "default" : "outline"}
                        onClick={() => setNewTaskPriority("low")}
                        className="flex-1"
                      >
                        Laag
                      </Button>
                      <Button
                        type="button"
                        variant={newTaskPriority === "medium" ? "default" : "outline"}
                        onClick={() => setNewTaskPriority("medium")}
                        className="flex-1"
                      >
                        Middel
                      </Button>
                      <Button
                        type="button"
                        variant={newTaskPriority === "high" ? "default" : "outline"}
                        onClick={() => setNewTaskPriority("high")}
                        className="flex-1"
                      >
                        Hoog
                      </Button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddTask("Vandaag")}
                    className="w-full backdrop-blur-md bg-primary/90 text-primary-foreground border-0 px-3.5 py-2.5 rounded-xl font-bold hover:bg-primary transition-all hover:shadow-lg"
                  >
                    Toevoegen
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div 
            className="flex-1 overflow-auto px-1 pt-3.5 pb-1 grid gap-3 content-start list"
            onDragOver={(e) => handleDragOver(e, "Vandaag")}
            onDrop={(e) => handleDrop(e, "Vandaag")}
          >
            {getColumnTasks("Vandaag").map((task) => (
              <article
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                onClick={() => !isDragging && openEditDialog(task)}
                className={cn(
                  "relative backdrop-blur-xl bg-white/70 dark:bg-card/70 border border-border/40 rounded-[18px] p-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] animate-[pop_0.2s_ease-out] cursor-move hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-200",
                  draggedTask?.id === task.id && "opacity-50 scale-95"
                )}
              >
                <div className="absolute top-2 left-2 text-muted-foreground/50 text-sm select-none pointer-events-none">☰</div>
                <div className="flex items-center gap-1.5 justify-end mb-1 relative z-10">
                  {task.due_date && (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${getDeadlineBadgeColor(task.due_date)}`}>
                      📅 {format(new Date(task.due_date), "d MMM", { locale: nl })}
                    </span>
                  )}
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded-full text-xs font-bold border",
                    getPriorityBadge(task.priority).color
                  )}>
                    {getPriorityBadge(task.priority).label}
                  </span>
                </div>
                <h4 className="font-extrabold text-[clamp(14px,1.6vw,18px)] mb-1 text-foreground relative z-10">
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-muted-foreground text-[clamp(12px,1.2vw,14px)] relative z-10">
                    {task.description}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Kolom 2: Deze week */}
        <section className="flex flex-col min-w-0">
          <div className="flex items-center justify-between px-3.5 py-3 rounded-[14px] backdrop-blur-xl bg-white/60 dark:bg-card/60 border border-border/40 mb-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative overflow-hidden group">
            <div className="text-[clamp(16px,2vw,22px)] font-extrabold text-foreground relative z-10">Deze week</div>
            <Dialog open={openDialog === "Deze week"} onOpenChange={(open) => setOpenDialog(open ? "Deze week" : null)}>
              <DialogTrigger asChild>
                <button className="backdrop-blur-md bg-card/80 text-foreground border border-border/60 px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-card transition-all relative z-10">
                  ＋ Taak
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nieuwe taak toevoegen - Deze week</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title-week">Titel *</Label>
                    <Input
                      id="title-week"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Titel van de taak"
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description-week">Beschrijving</Label>
                    <Textarea
                      id="description-week"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Extra details..."
                      maxLength={1000}
                    />
                  </div>
                  <div>
                    <Label>Deadline</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newTaskDueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newTaskDueDate ? format(newTaskDueDate, "PPP", { locale: nl }) : "Selecteer datum"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newTaskDueDate}
                          onSelect={setNewTaskDueDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                        {newTaskDueDate && (
                          <div className="p-3 border-t">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => setNewTaskDueDate(undefined)}
                            >
                              Verwijder datum
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Prioriteit</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={newTaskPriority === "low" ? "default" : "outline"}
                        onClick={() => setNewTaskPriority("low")}
                        className="flex-1"
                      >
                        Laag
                      </Button>
                      <Button
                        type="button"
                        variant={newTaskPriority === "medium" ? "default" : "outline"}
                        onClick={() => setNewTaskPriority("medium")}
                        className="flex-1"
                      >
                        Middel
                      </Button>
                      <Button
                        type="button"
                        variant={newTaskPriority === "high" ? "default" : "outline"}
                        onClick={() => setNewTaskPriority("high")}
                        className="flex-1"
                      >
                        Hoog
                      </Button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddTask("Deze week")}
                    className="w-full backdrop-blur-md bg-primary/90 text-primary-foreground border-0 px-3.5 py-2.5 rounded-xl font-bold hover:bg-primary transition-all hover:shadow-lg"
                  >
                    Toevoegen
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div 
            className="flex-1 overflow-auto px-1 pt-3.5 pb-1 grid gap-3 content-start list"
            onDragOver={(e) => handleDragOver(e, "Deze week")}
            onDrop={(e) => handleDrop(e, "Deze week")}
          >
            {getColumnTasks("Deze week").map((task) => (
              <article
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                onClick={() => !isDragging && openEditDialog(task)}
                className={cn(
                  "relative backdrop-blur-xl bg-white/70 dark:bg-card/70 border border-border/40 rounded-[18px] p-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] animate-[pop_0.2s_ease-out] cursor-move hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-200",
                  draggedTask?.id === task.id && "opacity-50 scale-95"
                )}
              >
                <div className="absolute top-2 left-2 text-muted-foreground/50 text-sm select-none pointer-events-none">☰</div>
                <div className="flex items-center gap-1.5 justify-end mb-1 relative z-10">
                  {task.due_date && (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${getDeadlineBadgeColor(task.due_date)}`}>
                      📅 {format(new Date(task.due_date), "d MMM", { locale: nl })}
                    </span>
                  )}
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded-full text-xs font-bold border",
                    getPriorityBadge(task.priority).color
                  )}>
                    {getPriorityBadge(task.priority).label}
                  </span>
                </div>
                <h4 className="font-extrabold text-[clamp(14px,1.6vw,18px)] mb-1 text-foreground relative z-10">
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-muted-foreground text-[clamp(12px,1.2vw,14px)] relative z-10">
                    {task.description}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Kolom 3: Ziek / Verlof Stack */}
        <section className="flex flex-col min-w-0">
          <div className="grid grid-rows-[1fr_1fr] gap-3 h-full">
            {/* Ziek */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between px-3.5 py-3 rounded-[14px] backdrop-blur-xl bg-white/60 dark:bg-card/60 border border-border/40 mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative overflow-hidden group">
                <div className="text-[clamp(16px,2vw,22px)] font-extrabold text-foreground relative z-10">Ziek</div>
                <Dialog open={openDialog === "Ziek"} onOpenChange={(open) => setOpenDialog(open ? "Ziek" : null)}>
                  <DialogTrigger asChild>
                    <button className="backdrop-blur-md bg-card/80 text-foreground border border-border/60 px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-card transition-all relative z-10" title="Nieuwe naam/reden">＋</button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Persoon toevoegen - Ziek</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title-ziek">Naam *</Label>
                        <Input
                          id="title-ziek"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Naam van persoon"
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description-ziek">Reden</Label>
                        <Textarea
                          id="description-ziek"
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          placeholder="Extra details..."
                          maxLength={1000}
                        />
                      </div>
                      <div>
                        <Label>Terug verwacht op</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !newTaskDueDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newTaskDueDate ? format(newTaskDueDate, "PPP", { locale: nl }) : "Selecteer datum"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={newTaskDueDate}
                              onSelect={setNewTaskDueDate}
                              initialFocus
                              className="pointer-events-auto"
                            />
                            {newTaskDueDate && (
                              <div className="p-3 border-t">
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => setNewTaskDueDate(undefined)}
                                >
                                  Verwijder datum
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                      <button
                        onClick={() => handleAddTask("Ziek")}
                        className="w-full backdrop-blur-md bg-primary/90 text-primary-foreground border-0 px-3.5 py-2.5 rounded-xl font-bold hover:bg-primary transition-all hover:shadow-lg"
                      >
                        Toevoegen
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div 
                className="flex-1 overflow-auto px-1 pt-3.5 pb-1 grid gap-2 content-start list min-h-0"
                onDragOver={(e) => handleDragOver(e, "Ziek")}
                onDrop={(e) => handleDrop(e, "Ziek")}
              >
                {getColumnTasks("Ziek").map((task) => (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onClick={() => !isDragging && openEditDialog(task)}
                    className={cn(
                      "relative backdrop-blur-xl bg-white/70 dark:bg-card/70 border border-[hsl(30,90%,60%)]/20 rounded-[18px] p-2.5 shadow-[0_4px_16px_rgba(251,146,60,0.15)] animate-[pop_0.2s_ease-out] cursor-move hover:shadow-[0_8px_24px_rgba(251,146,60,0.25)] hover:-translate-y-1 transition-all duration-200 group",
                      draggedTask?.id === task.id && "opacity-50 scale-95"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(30,90%,60%)]/5 to-transparent rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className="absolute top-2 left-2 text-muted-foreground/50 text-xs select-none pointer-events-none">☰</div>
                    {task.due_date && (
                      <div className="flex justify-end mb-1 relative z-10">
                        <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-bold border ${getDeadlineBadgeColor(task.due_date)}`}>
                          📅 {format(new Date(task.due_date), "d MMM", { locale: nl })}
                        </span>
                      </div>
                    )}
                    <h4 className="font-extrabold text-[clamp(14px,1.6vw,18px)] mb-1 mt-4 text-foreground relative z-10">{task.title}</h4>
                    {task.description && <p className="text-muted-foreground text-[clamp(12px,1.2vw,14px)] relative z-10">{task.description}</p>}
                  </article>
                ))}
              </div>
            </div>

            {/* Verlof */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between px-3.5 py-3 rounded-[14px] backdrop-blur-xl bg-white/60 dark:bg-card/60 border border-border/40 mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative overflow-hidden group">
                <div className="text-[clamp(16px,2vw,22px)] font-extrabold text-foreground relative z-10">Verlof</div>
                <Dialog open={openDialog === "Verlof"} onOpenChange={(open) => setOpenDialog(open ? "Verlof" : null)}>
                  <DialogTrigger asChild>
                    <button className="backdrop-blur-md bg-card/80 text-foreground border border-border/60 px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-card transition-all relative z-10" title="Nieuwe naam/reden">＋</button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Persoon toevoegen - Verlof</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title-verlof">Naam *</Label>
                        <Input
                          id="title-verlof"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Naam van persoon"
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description-verlof">Reden</Label>
                        <Textarea
                          id="description-verlof"
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          placeholder="Extra details..."
                          maxLength={1000}
                        />
                      </div>
                      <div>
                        <Label>Terug verwacht op</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !newTaskDueDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newTaskDueDate ? format(newTaskDueDate, "PPP", { locale: nl }) : "Selecteer datum"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={newTaskDueDate}
                              onSelect={setNewTaskDueDate}
                              initialFocus
                              className="pointer-events-auto"
                            />
                            {newTaskDueDate && (
                              <div className="p-3 border-t">
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => setNewTaskDueDate(undefined)}
                                >
                                  Verwijder datum
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                      <button
                        onClick={() => handleAddTask("Verlof")}
                        className="w-full backdrop-blur-md bg-primary/90 text-primary-foreground border-0 px-3.5 py-2.5 rounded-xl font-bold hover:bg-primary transition-all hover:shadow-lg"
                      >
                        Toevoegen
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div 
                className="flex-1 overflow-auto px-1 pt-3.5 pb-1 grid gap-2 content-start list min-h-0"
                onDragOver={(e) => handleDragOver(e, "Verlof")}
                onDrop={(e) => handleDrop(e, "Verlof")}
              >
                {getColumnTasks("Verlof").map((task) => (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onClick={() => !isDragging && openEditDialog(task)}
                    className={cn(
                      "relative backdrop-blur-xl bg-white/70 dark:bg-card/70 border border-[hsl(145,70%,55%)]/20 rounded-[18px] p-2.5 shadow-[0_4px_16px_rgba(34,197,94,0.15)] animate-[pop_0.2s_ease-out] cursor-move hover:shadow-[0_8px_24px_rgba(34,197,94,0.25)] hover:-translate-y-1 transition-all duration-200 group",
                      draggedTask?.id === task.id && "opacity-50 scale-95"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(145,70%,55%)]/5 to-transparent rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className="absolute top-2 left-2 text-muted-foreground/50 text-xs select-none pointer-events-none">☰</div>
                    {task.due_date && (
                      <div className="flex justify-end mb-1 relative z-10">
                        <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-bold border ${getDeadlineBadgeColor(task.due_date)}`}>
                          📅 {format(new Date(task.due_date), "d MMM", { locale: nl })}
                        </span>
                      </div>
                    )}
                    <h4 className="font-extrabold text-[clamp(14px,1.6vw,18px)] mb-1 mt-4 text-foreground relative z-10">{task.title}</h4>
                    {task.description && <p className="text-muted-foreground text-[clamp(12px,1.2vw,14px)] relative z-10">{task.description}</p>}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Kolom 4: Afgerond / Belangrijke informatie Stack */}
        <section className="flex flex-col min-w-0">
          <div className="grid grid-rows-[1fr_1fr] gap-3 h-full">
            {/* Afgerond */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between px-3.5 py-3 rounded-[14px] backdrop-blur-xl bg-white/60 dark:bg-card/60 border border-border/40 mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative overflow-hidden group">
                <div className="text-[clamp(16px,2vw,22px)] font-extrabold text-foreground relative z-10">Afgerond</div>
                <span className="text-muted-foreground font-extrabold relative z-10">{getColumnTasks("Afgerond").length}</span>
              </div>
              <div 
                className="flex-1 overflow-auto px-1 pt-3.5 pb-1 grid gap-3 content-start list min-h-0"
                onDragOver={(e) => handleDragOver(e, "Afgerond")}
                onDrop={(e) => handleDrop(e, "Afgerond")}
              >
                {getColumnTasks("Afgerond").map((task) => (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onClick={() => !isDragging && openEditDialog(task)}
                    className={cn(
                      "relative backdrop-blur-xl bg-white/70 dark:bg-card/70 border border-border/40 rounded-[18px] p-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] animate-[pop_0.2s_ease-out] cursor-move hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-200",
                      draggedTask?.id === task.id && "opacity-50 scale-95"
                    )}
                  >
                    <div className="absolute top-2 left-2 text-muted-foreground/50 text-sm select-none pointer-events-none">☰</div>
                    <div className="flex items-center gap-1.5 justify-end mb-1 relative z-10">
                      {task.due_date && (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${getDeadlineBadgeColor(task.due_date)}`}>
                          📅 {format(new Date(task.due_date), "d MMM", { locale: nl })}
                        </span>
                      )}
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded-full text-xs font-bold border",
                        getPriorityBadge(task.priority).color
                      )}>
                        {getPriorityBadge(task.priority).label}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-[clamp(14px,1.6vw,18px)] mb-1 text-foreground relative z-10">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-muted-foreground text-[clamp(12px,1.2vw,14px)] relative z-10">
                        {task.description}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>

            {/* Belangrijke informatie */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between px-3.5 py-3 rounded-[14px] backdrop-blur-xl bg-white/60 dark:bg-card/60 border border-border/40 mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.06)] relative overflow-hidden group">
                <div className="text-[clamp(16px,2vw,22px)] font-extrabold text-foreground relative z-10">Belangrijke informatie</div>
                <Dialog open={openDialog === "Belangrijke informatie"} onOpenChange={(open) => setOpenDialog(open ? "Belangrijke informatie" : null)}>
                  <DialogTrigger asChild>
                    <button className="backdrop-blur-md bg-card/80 text-foreground border border-border/60 px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-card transition-all relative z-10" title="Nieuwe info">＋</button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Informatie toevoegen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title-info">Titel *</Label>
                        <Input
                          id="title-info"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Titel van de informatie"
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description-info">Details</Label>
                        <Textarea
                          id="description-info"
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          placeholder="Extra details..."
                          maxLength={1000}
                        />
                      </div>
                      <button
                        onClick={() => handleAddTask("Belangrijke informatie")}
                        className="w-full backdrop-blur-md bg-primary/90 text-primary-foreground border-0 px-3.5 py-2.5 rounded-xl font-bold hover:bg-primary transition-all hover:shadow-lg"
                      >
                        Toevoegen
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div 
                className="flex-1 overflow-auto px-1 pt-3.5 pb-1 grid gap-2 content-start list min-h-0"
                onDragOver={(e) => handleDragOver(e, "Belangrijke informatie")}
                onDrop={(e) => handleDrop(e, "Belangrijke informatie")}
              >
                {getColumnTasks("Belangrijke informatie").map((task) => (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onClick={() => !isDragging && openEditDialog(task)}
                    className={cn(
                      "relative backdrop-blur-xl bg-white/70 dark:bg-card/70 border border-border/40 rounded-[18px] p-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] animate-[pop_0.2s_ease-out] cursor-move hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-200",
                      draggedTask?.id === task.id && "opacity-50 scale-95"
                    )}
                  >
                    <div className="absolute top-2 left-2 text-muted-foreground/50 text-xs select-none pointer-events-none">☰</div>
                    <h4 className="font-extrabold text-[clamp(14px,1.6vw,18px)] mb-1 mt-4 text-foreground relative z-10">{task.title}</h4>
                    {task.description && <p className="text-muted-foreground text-[clamp(12px,1.2vw,14px)] relative z-10">{task.description}</p>}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Task Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTaskColumn === "Belangrijke informatie" ? "Informatie bewerken" : "Taak bewerken"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Titel *</Label>
              <Input
                id="edit-title"
                value={editTaskTitle}
                onChange={(e) => setEditTaskTitle(e.target.value)}
                placeholder="Titel van de taak"
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Beschrijving</Label>
              <Textarea
                id="edit-description"
                value={editTaskDescription}
                onChange={(e) => setEditTaskDescription(e.target.value)}
                placeholder="Extra details..."
                maxLength={1000}
              />
            </div>
            {editingTaskColumn !== "Belangrijke informatie" && editingTaskColumn !== "Ziek" && editingTaskColumn !== "Verlof" && (
              <>
                <div>
                  <Label>Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editTaskDueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editTaskDueDate ? format(editTaskDueDate, "PPP", { locale: nl }) : "Kies een datum"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editTaskDueDate}
                        onSelect={setEditTaskDueDate}
                        initialFocus
                        locale={nl}
                        className="pointer-events-auto"
                      />
                      {editTaskDueDate && (
                        <div className="p-3 border-t">
                          <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => setEditTaskDueDate(undefined)}
                          >
                            Wis deadline
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Prioriteit</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={editTaskPriority === "low" ? "default" : "outline"}
                      onClick={() => setEditTaskPriority("low")}
                      className="flex-1"
                    >
                      Laag
                    </Button>
                    <Button
                      variant={editTaskPriority === "medium" ? "default" : "outline"}
                      onClick={() => setEditTaskPriority("medium")}
                      className="flex-1"
                    >
                      Middel
                    </Button>
                    <Button
                      variant={editTaskPriority === "high" ? "default" : "outline"}
                      onClick={() => setEditTaskPriority("high")}
                      className="flex-1"
                    >
                      Hoog
                    </Button>
                  </div>
                </div>
              </>
            )}
            {(editingTaskColumn === "Ziek" || editingTaskColumn === "Verlof") && (
              <div>
                <Label>Terug verwacht op</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editTaskDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editTaskDueDate ? format(editTaskDueDate, "PPP", { locale: nl }) : "Kies een datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editTaskDueDate}
                      onSelect={setEditTaskDueDate}
                      initialFocus
                      locale={nl}
                      className="pointer-events-auto"
                    />
                    {editTaskDueDate && (
                      <div className="p-3 border-t">
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={() => setEditTaskDueDate(undefined)}
                        >
                          Wis datum
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleDeleteFromDialog} variant="destructive">
                Verwijderen
              </Button>
              {editingTaskColumn !== "Belangrijke informatie" && (
                <Button onClick={handleCompleteFromDialog} variant="outline" className="flex-1">
                  ✔ Voltooien
                </Button>
              )}
              <Button onClick={handleEditTask} className="flex-1">
                Opslaan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

        </div>
      </div>
    </div>
  );
};

export default Board;
