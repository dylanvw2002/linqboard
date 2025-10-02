import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Menu, ChevronDown, ArrowUp, Check, X, Maximize2, Trash2 } from "lucide-react";

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
}

interface SimpleCard {
  id: string;
  name: string;
  reason?: string;
}

const Board = () => {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [board, setBoard] = useState<any>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

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

    // Check if user is member
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
      // Get organization
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationId)
        .single();

      setOrganization(org);

      // Get board
      const { data: boardData } = await supabase
        .from("boards")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      setBoard(boardData);

      if (boardData) {
        // Get columns
        const { data: columnsData } = await supabase
          .from("columns")
          .select("*")
          .eq("board_id", boardData.id)
          .order("position");

        setColumns(columnsData || []);

        // Get tasks
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
    // Subscribe to task changes
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
    return date.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-orange-100 text-orange-700 border-orange-200";
      case "low": return "bg-teal-100 text-teal-700 border-teal-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "Hoog";
      case "medium": return "Medium";
      case "low": return "Laag";
      default: return priority;
    }
  };

  // Map database columns to fixed sections
  const getTodayTasks = () => tasks.filter(t => {
    const col = columns.find(c => c.id === t.column_id);
    return col?.name.toLowerCase().includes("vandaag");
  });

  const getThisWeekTasks = () => tasks.filter(t => {
    const col = columns.find(c => c.id === t.column_id);
    return col?.name.toLowerCase().includes("week");
  });

  const getSickTasks = () => tasks.filter(t => {
    const col = columns.find(c => c.id === t.column_id);
    return col?.name.toLowerCase().includes("ziek");
  });

  const getLeaveTasks = () => tasks.filter(t => {
    const col = columns.find(c => c.id === t.column_id);
    return col?.name.toLowerCase().includes("verlof");
  });

  const getCompletedTasks = () => tasks.filter(t => {
    const col = columns.find(c => c.id === t.column_id);
    return col?.name.toLowerCase().includes("afgerond") || col?.name.toLowerCase().includes("gedaan");
  });

  const getInfoTasks = () => tasks.filter(t => {
    const col = columns.find(c => c.id === t.column_id);
    return col?.name.toLowerCase().includes("info");
  });

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="p-3 bg-white hover:shadow-lg transition-all duration-200 border border-border rounded-[18px]">
      <div className="flex items-start gap-2 mb-2">
        <Menu className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0 cursor-grab" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-foreground mb-1">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-muted-foreground">{task.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3 ml-6 flex-wrap">
        <Badge className={`text-[10px] px-2 py-0.5 border ${getPriorityColor(task.priority)}`}>
          {getPriorityLabel(task.priority)}
        </Badge>
        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">Algemeen</Badge>
      </div>
      <div className="flex items-center gap-1 ml-6">
        <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-muted">
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-muted">
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-success/10 hover:text-success">
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );

  const SimpleTaskCard = ({ item }: { item: Task }) => (
    <Card className="p-3 bg-white hover:shadow-lg transition-all duration-200 border border-border rounded-[18px]">
      <div className="flex items-start gap-2">
        <Menu className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0 cursor-grab" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-foreground mb-1">{item.title}</h4>
          {item.description && (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          )}
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive flex-shrink-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const todayTasks = getTodayTasks();
  const weekTasks = getThisWeekTasks();
  const sickTasks = getSickTasks();
  const leaveTasks = getLeaveTasks();
  const completedTasks = getCompletedTasks();
  const infoTasks = getInfoTasks();

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.5);
        }
      `}</style>

      {/* Header */}
      <div className="bg-[hsl(142_76%_96%)] border-b-2 border-[hsl(142_76%_85%)]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/dashboard")}
                className="hover:bg-white/50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border-2 border-border">
                  <span className="text-xl font-bold text-primary">N</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {organization?.name || "NRG TOTAAL"} – To-Do Board
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Live overzicht voor het team – dubbelklik op een taak om te bewerken • Sleep om te ordenen
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right bg-white px-4 py-2 rounded-lg border border-border">
                <div className="text-lg font-bold text-foreground">{formatTime(currentTime)}</div>
                <div className="text-xs text-muted-foreground">{formatDate(currentTime)}</div>
              </div>
              <Button variant="outline" size="sm" className="bg-white hover:bg-white/80">
                <Maximize2 className="h-4 w-4 mr-2" />
                Volledig scherm
              </Button>
              <Button variant="outline" size="sm" className="bg-white hover:bg-white/80">
                <Trash2 className="h-4 w-4 mr-2" />
                Leeg Afgerond
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Board Grid */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Column 1: Vandaag */}
          <div className="flex flex-col h-[calc(100vh-200px)]">
            <div className="bg-[hsl(217_91%_96%)] border-2 border-[hsl(217_91%_85%)] rounded-t-[18px] p-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-base text-foreground">Vandaag</h3>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs hover:bg-white/50">
                  + Taak
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-[hsl(217_91%_96%)] border-2 border-t-0 border-[hsl(217_91%_85%)] rounded-b-[18px] p-3 overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                {todayTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
          </div>

          {/* Column 2: Deze week */}
          <div className="flex flex-col h-[calc(100vh-200px)]">
            <div className="bg-[hsl(142_76%_96%)] border-2 border-[hsl(142_76%_85%)] rounded-t-[18px] p-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-base text-foreground">Deze week</h3>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs hover:bg-white/50">
                  + Taak
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-[hsl(142_76%_96%)] border-2 border-t-0 border-[hsl(142_76%_85%)] rounded-b-[18px] p-3 overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                {weekTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
          </div>

          {/* Column 3: Ziek / Verlof */}
          <div className="flex flex-col h-[calc(100vh-200px)] gap-4">
            {/* Ziek */}
            <div className="flex flex-col flex-1 min-h-0">
              <div className="bg-[hsl(0_85%_96%)] border-2 border-[hsl(0_85%_85%)] rounded-t-[18px] p-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base text-foreground">Ziek</h3>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs hover:bg-white/50">
                    + Persoon
                  </Button>
                </div>
              </div>
              <div className="flex-1 bg-[hsl(0_85%_96%)] border-2 border-t-0 border-[hsl(0_85%_85%)] rounded-b-[18px] p-3 overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  {sickTasks.map(task => <SimpleTaskCard key={task.id} item={task} />)}
                </div>
              </div>
            </div>

            {/* Verlof */}
            <div className="flex flex-col flex-1 min-h-0">
              <div className="bg-[hsl(142_76%_96%)] border-2 border-[hsl(142_76%_85%)] rounded-t-[18px] p-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base text-foreground">Verlof</h3>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs hover:bg-white/50">
                    + Persoon
                  </Button>
                </div>
              </div>
              <div className="flex-1 bg-[hsl(142_76%_96%)] border-2 border-t-0 border-[hsl(142_76%_85%)] rounded-b-[18px] p-3 overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  {leaveTasks.map(task => <SimpleTaskCard key={task.id} item={task} />)}
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Afgerond / Belangrijke informatie */}
          <div className="flex flex-col h-[calc(100vh-200px)] gap-4">
            {/* Afgerond */}
            <div className="flex flex-col flex-1 min-h-0">
              <div className="bg-muted border-2 border-border rounded-t-[18px] p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-foreground">Afgerond</h3>
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                      {completedTasks.length}
                    </Badge>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs hover:bg-white/50">
                    🗑️
                  </Button>
                </div>
              </div>
              <div className="flex-1 bg-muted border-2 border-t-0 border-border rounded-b-[18px] p-3 overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  {completedTasks.map(task => <SimpleTaskCard key={task.id} item={task} />)}
                </div>
              </div>
            </div>

            {/* Belangrijke informatie */}
            <div className="flex flex-col flex-1 min-h-0">
              <div className="bg-[hsl(48_95%_96%)] border-2 border-[hsl(48_95%_85%)] rounded-t-[18px] p-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base text-foreground">Belangrijke informatie</h3>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs hover:bg-white/50">
                    + Info
                  </Button>
                </div>
              </div>
              <div className="flex-1 bg-[hsl(48_95%_96%)] border-2 border-t-0 border-[hsl(48_95%_85%)] rounded-b-[18px] p-3 overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  {infoTasks.map(task => <SimpleTaskCard key={task.id} item={task} />)}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Sneltoetsen: <span className="font-semibold">N</span> = nieuwe taak • <span className="font-semibold">F</span> = fullscreen • <span className="font-semibold">1–3</span> = prio aanpassen</p>
          <p className="mt-1">Data wordt automatisch gesynchroniseerd via de database</p>
        </div>
      </div>
    </div>
  );
};

export default Board;
