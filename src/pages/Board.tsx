import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Users } from "lucide-react";

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-destructive";
      case "medium":
        return "border-l-4 border-l-warning";
      case "low":
        return "border-l-4 border-l-success";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">{organization?.name}</h1>
              <p className="text-muted-foreground">{board?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border">
              <Users className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">{onlineUsers.length || 1} online</span>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe taak
            </Button>
          </div>
        </div>

        {/* Board Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {columns.map((column) => (
            <div key={column.id} className="min-h-[500px]">
              <div className="mb-4">
                <h3 className="font-semibold text-lg px-2">{column.name}</h3>
                <p className="text-sm text-muted-foreground px-2">
                  {tasks.filter(t => t.column_id === column.id).length} taken
                </p>
              </div>
              
              <div className="space-y-3">
                {tasks
                  .filter(task => task.column_id === column.id)
                  .map((task) => (
                    <Card
                      key={task.id}
                      className={`p-4 cursor-pointer hover:shadow-md transition-all ${getPriorityColor(task.priority)}`}
                    >
                      <h4 className="font-medium mb-2">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </Card>
                  ))}
                
                {tasks.filter(t => t.column_id === column.id).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Geen taken
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Board;
