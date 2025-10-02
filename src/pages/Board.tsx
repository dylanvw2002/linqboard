import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Menu, ChevronDown, ArrowUp, Check, X, Maximize2, Trash2 } from "lucide-react";

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

const Board = () => {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [board, setBoard] = useState<any>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    checkAccess();
    fetchBoardData();
    setupRealtimeSubscriptions();
  }, [organizationId]);

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

  const getColumnColor = (columnName: string) => {
    const name = columnName.toLowerCase();
    if (name.includes("ziek")) return "bg-red-50 border-red-100";
    if (name.includes("verlof")) return "bg-green-50 border-green-100";
    if (name.includes("afgerond")) return "bg-gray-50 border-gray-100";
    return "bg-white border-gray-100";
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive" className="text-xs">Hoog</Badge>;
      case "medium":
        return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 border-orange-200">Medium</Badge>;
      case "low":
        return <Badge variant="secondary" className="text-xs bg-teal-100 text-teal-700 border-teal-200">Laag</Badge>;
      default:
        return null;
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const time = now.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
    const date = now.toLocaleDateString("nl-NL", { weekday: "long", day: "2-digit", month: "long" });
    return `${time} — ${date}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {organization?.name} – {board?.name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Live overzicht voor het team – dubbelklik op een taak om te bewerken • Sleep om te ordenen
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">{getCurrentDateTime()}</div>
              </div>
              <Button variant="outline" size="sm">
                <Maximize2 className="h-4 w-4 mr-2" />
                Volledig scherm
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Leeg Afgerond
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Board Columns */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className={`rounded-t-lg border-2 ${getColumnColor(column.name)} p-3 flex justify-between items-center`}>
                <h3 className="font-bold text-base text-gray-900">{column.name}</h3>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                  + Taak
                </Button>
              </div>

              {/* Column Content */}
              <div className={`flex-1 rounded-b-lg border-2 border-t-0 ${getColumnColor(column.name)} p-3 space-y-3 min-h-[400px]`}>
                {tasks
                  .filter(task => task.column_id === column.id)
                  .map((task) => (
                    <Card
                      key={task.id}
                      className="p-3 bg-white hover:shadow-md transition-shadow border-gray-200"
                    >
                      {/* Task Header */}
                      <div className="flex items-start gap-2 mb-2">
                        <Menu className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <h4 className="font-medium text-sm text-gray-900 flex-1">
                          {task.title}
                        </h4>
                      </div>

                      {/* Task Description */}
                      {task.description && (
                        <p className="text-xs text-gray-600 mb-2 ml-6">
                          {task.description}
                        </p>
                      )}

                      {/* Task Labels */}
                      <div className="flex items-center gap-2 mb-3 ml-6">
                        {getPriorityBadge(task.priority)}
                        <Badge variant="secondary" className="text-xs">Algemeen</Badge>
                      </div>

                      {/* Task Actions */}
                      <div className="flex items-center gap-1 ml-6">
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <ArrowUp className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <Check className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <X className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Board;
