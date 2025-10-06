import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarIcon, ArrowLeft, Trash2, Pencil, Plus } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { nl } from "date-fns/locale";
import { z } from "zod";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-transparent.png";
import { TaskAttachments, AttachmentCount } from "@/components/TaskAttachments";
import { ActiveUsers } from "@/components/ActiveUsers";
import { ColumnManagement } from "@/components/ColumnManagement";
import { ColumnEditSidebar } from "@/components/ColumnEditSidebar";
import { ResizeHandles } from "@/components/ResizeHandles";
import { SimpleTaskCard } from "@/components/SimpleTaskCard";
import { getGlowStyles, GlowType } from "@/lib/glowStyles";
import { ColumnType } from "@/lib/columnTypes";
interface Column {
  id: string;
  name: string;
  position: number;
  width_ratio: number;
  board_id: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  header_height: number;
  header_width?: number;
  content_padding_top: number;
  content_padding_right: number;
  content_padding_bottom: number;
  content_padding_left: number;
  glow_type?: GlowType;
  column_type?: ColumnType;
}
interface Assignee {
  user_id: string;
  full_name: string;
}

interface Task {
  id: string;
  column_id: string;
  title: string;
  assignees?: Assignee[];
  description: string | null;
  priority: "low" | "medium" | "high";
  position: number;
  due_date?: string | null;
}
const taskSchema = z.object({
  title: z.string().trim().min(1, "Titel is verplicht").max(200, "Titel mag maximaal 200 tekens zijn"),
  description: z.string().trim().max(1000, "Beschrijving mag maximaal 1000 tekens zijn").optional()
});
const Board = () => {
  const {
    organizationId
  } = useParams();
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
  const [orgMembers, setOrgMembers] = useState<Assignee[]>([]);
  const [editTaskAssignees, setEditTaskAssignees] = useState<string[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingTaskColumn, setEditingTaskColumn] = useState<string | null>(null);
  const [columnManagementOpen, setColumnManagementOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<Column | null>(null);
  const [draggedOverColumnId, setDraggedOverColumnId] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [dragOffset, setDragOffset] = useState({
    x: 0,
    y: 0
  });
  const [dragPreview, setDragPreview] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [snapGuides, setSnapGuides] = useState<{
    x?: number;
    y?: number;
  } | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
  const [resizing, setResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    y: number;
    col: Column;
  } | null>(null);
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);
  const GRID_SIZE = 20;
  const SNAP_THRESHOLD = 15;
  const SCALE_FACTOR = 0.75; // UI scale factor

  const handleAddColumn = async () => {
    try {
      // Place new column in a visible area (not too far right)
      // Find the rightmost column within reasonable bounds
      const visibleColumns = columns.filter(c => c.x_position < 1500);
      const maxX = visibleColumns.length > 0 ? Math.max(...visibleColumns.map(c => c.x_position + (c.width || 300))) : 40;
      const newX = maxX + 40; // Add some spacing

      const {
        data,
        error
      } = await supabase.from('columns').insert({
        board_id: board?.id,
        name: `Nieuwe kolom ${columns.length + 1}`,
        position: columns.length,
        width_ratio: 1,
        x_position: newX,
        y_position: 50,
        width: 300,
        height: 600
      }).select().single();
      if (error) throw error;
      toast.success("Kolom toegevoegd");
      await fetchBoardData();

      // Scroll to the new column
      setTimeout(() => {
        const mainElement = document.querySelector('main');
        if (mainElement && data) {
          mainElement.scrollTo({
            left: (newX - 100) * SCALE_FACTOR,
            behavior: 'smooth'
          });
        }
      }, 100);
    } catch (error: any) {
      toast.error("Fout bij toevoegen: " + error.message);
    }
  };
  const handleDeleteColumn = async () => {
    if (!deleteColumnId) return;
    try {
      // First, check if there are tasks in this column
      const columnTasks = tasks.filter(t => t.column_id === deleteColumnId);
      if (columnTasks.length > 0) {
        // Move all tasks to the first column
        const firstColumn = columns.find(c => c.id !== deleteColumnId);
        if (firstColumn) {
          await Promise.all(columnTasks.map(task => supabase.from('tasks').update({
            column_id: firstColumn.id
          }).eq('id', task.id)));
        }
      }

      // Delete the column
      const {
        error
      } = await supabase.from('columns').delete().eq('id', deleteColumnId);
      if (error) throw error;
      toast.success("Kolom verwijderd");
      await fetchBoardData();
      setDeleteColumnId(null);
    } catch (error: any) {
      toast.error("Fout bij verwijderen: " + error.message);
    }
  };
  useEffect(() => {
    checkAccess();
    fetchBoardData();
    fetchOrgMembers();
  }, [organizationId]);
  useEffect(() => {
    if (!board?.id) return;
    const cleanup = setupRealtimeSubscriptions();
    return () => {
      if (cleanup) cleanup();
    };
  }, [board?.id]);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!editMode) {
      setSelectedColumn(null);
    }
  }, [editMode]);
  const checkAccess = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    const {
      data: membership
    } = await supabase.from("memberships").select("*").eq("user_id", session.user.id).eq("organization_id", organizationId).single();
    if (!membership) {
      toast.error("Je hebt geen toegang tot deze organisatie");
      navigate("/dashboard");
    }
  };

  const fetchOrgMembers = async () => {
    try {
      const { data } = await supabase
        .from("memberships")
        .select("user_id, profiles(user_id, full_name)")
        .eq("organization_id", organizationId);
      
      if (data) {
        const members = data.map(m => ({
          user_id: m.user_id,
          full_name: (m.profiles as any)?.full_name || "Onbekend"
        }));
        setOrgMembers(members);
      }
    } catch (error) {
      console.error("Fout bij laden van teamleden:", error);
    }
  };
  const fetchBoardData = async () => {
    try {
      const {
        data: org
      } = await supabase.from("organizations").select("*").eq("id", organizationId).single();
      setOrganization(org);
      const {
        data: boardData
      } = await supabase.from("boards").select("*").eq("organization_id", organizationId).single();
      setBoard(boardData);
      if (boardData) {
        const {
          data: columnsData
        } = await supabase.from("columns").select("*").eq("board_id", boardData.id).order("position");
        setColumns(columnsData || []);
        if (columnsData && columnsData.length > 0) {
          const columnIds = columnsData.map(c => c.id);
          const {
            data: tasksData
          } = await supabase.from("tasks").select("*").in("column_id", columnIds).order("position");
          
          // Fetch assignees for all tasks
          if (tasksData && tasksData.length > 0) {
            const taskIds = tasksData.map(t => t.id);
            const { data: assigneesData } = await supabase
              .from("task_assignees")
              .select("task_id, user_id, profiles(user_id, full_name)")
              .in("task_id", taskIds);
            
            // Map assignees to tasks
            const tasksWithAssignees = tasksData.map(task => ({
              ...task,
              assignees: assigneesData
                ?.filter(a => a.task_id === task.id)
                .map(a => ({
                  user_id: a.user_id,
                  full_name: (a.profiles as any)?.full_name || "Onbekend"
                })) || []
            }));
            
            setTasks(tasksWithAssignees);
          } else {
            setTasks([]);
          }
        }
      }
    } catch (error: any) {
      toast.error("Fout bij laden van board");
    } finally {
      setLoading(false);
    }
  };
  const setupRealtimeSubscriptions = () => {
    const channel = supabase.channel(`board-changes-${organizationId}`).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "tasks"
    }, () => {
      fetchBoardData();
    }).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "columns"
    }, () => {
      fetchBoardData();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short"
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
      return "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]";
    } else if (isBefore(due, twoDaysFromNow)) {
      return "bg-[#fef3c7] text-[#7c2d12] border-[#fde68a]";
    } else {
      return "bg-[#dcfce7] text-[#065f46] border-[#bbf7d0]";
    }
  };
  const getPriorityBadge = (priority: "low" | "medium" | "high") => {
    const config = {
      high: {
        label: "Hoog",
        color: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]"
      },
      medium: {
        label: "Middel",
        color: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
      },
      low: {
        label: "Laag",
        color: "bg-[#dcfce7] text-[#065f46] border-[#bbf7d0]"
      }
    };
    return config[priority];
  };
  const openEditDialog = (task: Task) => {
    const column = columns.find(col => col.id === task.column_id);
    setEditingTaskColumn(column?.name || null);
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || "");
    setEditTaskDueDate(task.due_date ? new Date(task.due_date) : undefined);
    setEditTaskPriority(task.priority);
    setEditTaskAssignees(task.assignees?.map(a => a.user_id) || []);
  };

  const handleAddAssignee = async (userId: string) => {
    if (!editingTask) return;
    try {
      const { error } = await supabase.from("task_assignees").insert({
        task_id: editingTask.id,
        user_id: userId
      });
      if (error) throw error;
      setEditTaskAssignees([...editTaskAssignees, userId]);
      await fetchBoardData();
    } catch (error) {
      toast.error("Fout bij toevoegen van teamlid");
    }
  };

  const handleRemoveAssignee = async (userId: string) => {
    if (!editingTask) return;
    try {
      const { error } = await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", editingTask.id)
        .eq("user_id", userId);
      if (error) throw error;
      setEditTaskAssignees(editTaskAssignees.filter(id => id !== userId));
      await fetchBoardData();
    } catch (error) {
      toast.error("Fout bij verwijderen van teamlid");
    }
  };
  const handleEditTask = async () => {
    if (!editingTask) return;
    try {
      const validation = taskSchema.safeParse({
        title: editTaskTitle,
        description: editTaskDescription
      });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
      const {
        error
      } = await supabase.from("tasks").update({
        title: validation.data.title,
        description: validation.data.description || null,
        due_date: editTaskDueDate ? editTaskDueDate.toISOString() : null,
        priority: editTaskPriority
      }).eq("id", editingTask.id);
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
  const getColumnTasks = (columnId: string) => tasks.filter(task => task.column_id === columnId);
  const handleClearCompleted = async () => {
    const completedColumn = columns.find(col => col.name === "Afgerond");
    if (!completedColumn) return;
    const completedTasks = tasks.filter(task => task.column_id === completedColumn.id);
    if (completedTasks.length === 0) {
      toast.error("Er zijn geen voltooide taken om te wissen");
      return;
    }
    try {
      const {
        error
      } = await supabase.from("tasks").delete().eq("column_id", completedColumn.id);
      if (error) throw error;
      toast.success(`${completedTasks.length} voltooide taken verwijderd`);
      await fetchBoardData();
    } catch (error: any) {
      toast.error("Fout bij wissen taken");
    }
  };
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
  const handleAddTask = async (columnId: string) => {
    try {
      const validation = taskSchema.safeParse({
        title: newTaskTitle,
        description: newTaskDescription
      });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
      const column = columns.find(col => col.id === columnId);
      if (!column) {
        toast.error("Kolom niet gevonden");
        return;
      }
      const maxPosition = tasks.filter(t => t.column_id === column.id).reduce((max, t) => Math.max(max, t.position), -1);
      const {
        error
      } = await supabase.from("tasks").insert({
        column_id: column.id,
        title: validation.data.title,
        description: validation.data.description || null,
        priority: newTaskPriority,
        due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null,
        position: maxPosition + 1
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
      const {
        error
      } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
      toast.success("Taak verwijderd");
      await fetchBoardData();
    } catch (error: any) {
      toast.error("Fout bij verwijderen taak");
    }
  };
  const handleMarkDone = async (task: Task) => {
    const completedColumn = columns.find(col => col.name === "Afgerond");
    if (!completedColumn) {
      toast.error("Afgerond kolom niet gevonden");
      return;
    }
    try {
      const maxPosition = tasks.filter(t => t.column_id === completedColumn.id).reduce((max, t) => Math.max(max, t.position), -1);
      const {
        error
      } = await supabase.from("tasks").update({
        column_id: completedColumn.id,
        position: maxPosition + 1
      }).eq("id", task.id);
      if (error) throw error;
      toast.success("Taak voltooid");
      await fetchBoardData();
    } catch (error: any) {
      toast.error("Fout bij voltooien taak");
    }
  };
  const handleChangePriority = async (taskId: string, newPriority: "low" | "medium" | "high") => {
    try {
      const {
        error
      } = await supabase.from("tasks").update({
        priority: newPriority
      }).eq("id", taskId);
      if (error) throw error;
      toast.success(`Prioriteit aangepast naar ${getPriorityLabel(newPriority)}`);
      await fetchBoardData();
    } catch (error: any) {
      toast.error("Fout bij aanpassen prioriteit");
    }
  };
  const calculateSnap = (x: number, y: number) => {
    // 1. Snap to grid
    let snappedX = Math.round(x / GRID_SIZE) * GRID_SIZE;
    let snappedY = Math.round(y / GRID_SIZE) * GRID_SIZE;

    // 2. Check alignment with other columns
    const guides: {
      x?: number;
      y?: number;
    } = {};
    for (const col of columns) {
      if (col.id === draggedColumn?.id) continue;

      // X alignment check
      if (Math.abs(snappedX - col.x_position) < SNAP_THRESHOLD) {
        snappedX = col.x_position;
        guides.x = col.x_position;
      }

      // Y alignment check
      if (Math.abs(snappedY - col.y_position) < SNAP_THRESHOLD) {
        snappedY = col.y_position;
        guides.y = col.y_position;
      }
    }
    return {
      snappedX,
      snappedY,
      guides
    };
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
  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggedOverColumn(columnId);
  };
  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (!draggedTask) return;
    const targetColumn = columns.find(col => col.id === columnId);
    if (!targetColumn) return;
    const currentColumn = columns.find(col => col.id === draggedTask.column_id);
    if (currentColumn?.id === columnId) {
      setDraggedTask(null);
      setDraggedOverColumn(null);
      setIsDragging(false);
      return;
    }
    try {
      const maxPosition = tasks.filter(t => t.column_id === targetColumn.id).reduce((max, t) => Math.max(max, t.position), -1);
      const {
        error
      } = await supabase.from("tasks").update({
        column_id: targetColumn.id,
        position: maxPosition + 1
      }).eq("id", draggedTask.id);
      if (error) throw error;
      toast.success(`Taak verplaatst naar ${targetColumn.name}`);
      await fetchBoardData();
    } catch (error: any) {
      toast.error("Fout bij verplaatsen taak");
    }
    setDraggedTask(null);
    setDraggedOverColumn(null);
    setIsDragging(false);
  };
  const startResize = (e: React.MouseEvent, column: Column, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    setResizeHandle(handle);
    const startX = e.clientX / SCALE_FACTOR;
    const startY = e.clientY / SCALE_FACTOR;
    let currentColumn = {
      ...column
    };
    setSelectedColumn(currentColumn);
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX / SCALE_FACTOR - startX;
      const deltaY = moveEvent.clientY / SCALE_FACTOR - startY;
      const updated = {
        ...column
      };

      // Unified resize: width and header_width scale together, height adjusts independently
      if (handle === 'nw') {
        // Top-left: shrink from top-left
        const newWidth = Math.max(100, (column.width || 300) - deltaX);
        const newHeight = Math.max(100, (column.height || 600) - deltaY);
        updated.width = newWidth;
        updated.header_width = newWidth;
        updated.height = newHeight;
        // header_height stays independent
        updated.content_padding_top = Math.max(0, (column.content_padding_top || 0) + deltaY);
        // Don't adjust left/right padding - cards should match header width
      }
      if (handle === 'ne') {
        // Top-right: expand right, shrink top
        const newWidth = Math.max(100, (column.width || 300) + deltaX);
        const newHeight = Math.max(100, (column.height || 600) - deltaY);
        updated.width = newWidth;
        updated.header_width = newWidth;
        updated.height = newHeight;
        // header_height stays independent
        updated.content_padding_top = Math.max(0, (column.content_padding_top || 0) + deltaY);
        // Don't adjust left/right padding - cards should match header width
      }
      if (handle === 'sw') {
        // Bottom-left: shrink left, expand bottom
        const newWidth = Math.max(100, (column.width || 300) - deltaX);
        const newHeight = Math.max(100, (column.height || 600) + deltaY);
        updated.width = newWidth;
        updated.header_width = newWidth;
        updated.height = newHeight;
        // header_height stays independent
        updated.content_padding_bottom = Math.max(0, (column.content_padding_bottom || 0) - deltaY);
        // Don't adjust left/right padding - cards should match header width
      }
      if (handle === 'se') {
        // Bottom-right: expand both
        const newWidth = Math.max(100, (column.width || 300) + deltaX);
        const newHeight = Math.max(100, (column.height || 600) + deltaY);
        updated.width = newWidth;
        updated.header_width = newWidth;
        updated.height = newHeight;
        // header_height stays independent
        updated.content_padding_bottom = Math.max(0, (column.content_padding_bottom || 0) - deltaY);
        // Don't adjust left/right padding - cards should match header width
      }
      if (handle === 'header-bottom') {
        // Header bottom: only adjust header height
        const newHeaderHeight = Math.max(40, (column.header_height || 60) + deltaY);
        updated.header_height = newHeaderHeight;
      }
      currentColumn = updated;
      setSelectedColumn(updated);
    };
    const handleMouseUp = async () => {
      try {
        const updateData: any = {
          header_height: Math.round(currentColumn.header_height || 60),
          header_width: currentColumn.header_width ? Math.round(currentColumn.header_width) : null,
          content_padding_top: Math.round(currentColumn.content_padding_top || 0),
          content_padding_right: Math.round(currentColumn.content_padding_right || 0),
          content_padding_bottom: Math.round(currentColumn.content_padding_bottom || 0),
          content_padding_left: Math.round(currentColumn.content_padding_left || 0)
        };

        // Only add width and height if they're valid numbers
        if (currentColumn.width && !isNaN(currentColumn.width)) {
          updateData.width = Math.round(currentColumn.width);
        }
        if (currentColumn.height && !isNaN(currentColumn.height)) {
          updateData.height = Math.round(currentColumn.height);
        }
        const {
          error
        } = await supabase.from('columns').update(updateData).eq('id', currentColumn.id);
        if (error) throw error;
        toast.success("Kolom aangepast");
        await fetchBoardData();
      } catch (error: any) {
        console.error('Update error:', error);
        toast.error("Fout bij aanpassen: " + error.message);
      }
      setResizing(false);
      setResizeHandle(null);
      setResizeStart(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Board laden...</p>
        </div>
      </div>;
  }
  return <div className="h-screen overflow-hidden relative bg-background">
      <div className="origin-top-left scale-[0.75] w-[133.33vw] h-[133.33vh] overflow-hidden bg-blue-50">
        <div className="flex flex-col gap-[18px] p-[22px] h-screen">
      
      <style>{`
        @keyframes pop {
          from {
            transform: scale(0.95);
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
      <header className="flex items-center justify-between gap-4 backdrop-blur-[60px] bg-white/20 dark:bg-card/20 border-2 border-white/40 dark:border-white/20 px-5 py-[18px] rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_16px_rgba(255,255,255,0.1),inset_0_2px_2px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_2px_2px_rgba(255,255,255,0.2)] relative overflow-visible before:absolute before:inset-0 before:rounded-[28px] before:bg-gradient-to-br before:from-white/30 before:via-white/10 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[27px] after:bg-gradient-to-br after:from-transparent after:to-white/5 after:pointer-events-none">
        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="min-w-0">
            <h1 className="font-extrabold tracking-[0.2px] leading-[1.1] text-[clamp(26px,3.5vw,48px)] bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent drop-shadow-sm">
              {organization?.name || "NRG TOTAAL"} – To-Do Board
            </h1>
            <p className="text-muted-foreground font-semibold text-[clamp(12px,1.4vw,16px)]">
              Live overzicht voor het team – klik op een taak om te bewerken • Sleep om te ordenen
            </p>
          </div>
          <div className="[font-variant-numeric:tabular-nums] font-bold text-[clamp(20px,3vw,40px)] px-3.5 py-1.5 rounded-2xl backdrop-blur-[15px] bg-gradient-to-br from-primary/10 to-accent/10 border border-white/20 dark:border-white/10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] shrink-0 relative">
            <div className="text-primary whitespace-nowrap relative z-10">{formatTime(currentTime)}</div>
            <div className="text-[clamp(10px,1.2vw,14px)] text-muted-foreground font-semibold whitespace-nowrap relative z-10">{formatDate(currentTime)}</div>
          </div>
        </div>
        <div className="flex gap-2.5 relative z-10">
          <button onClick={() => navigate("/dashboard")} className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 text-foreground border-2 border-white/40 dark:border-white/20 px-3.5 py-2.5 rounded-2xl font-bold cursor-pointer transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,0.7)] hover:-translate-y-1 hover:bg-white/30 dark:hover:bg-card/30 text-[clamp(12px,1.4vw,16px)] flex items-center gap-2 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[15px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <button onClick={handleFullscreen} className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 text-foreground border-2 border-white/40 dark:border-white/20 px-3.5 py-2.5 rounded-2xl font-bold cursor-pointer transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,0.7)] hover:-translate-y-1 hover:bg-white/30 dark:hover:bg-card/30 text-[clamp(12px,1.4vw,16px)] relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[15px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none">
            ⛶ Volledig scherm
          </button>
          <button onClick={() => setEditMode(!editMode)} className={cn("backdrop-blur-[60px] text-foreground border-2 p-2.5 rounded-2xl font-bold cursor-pointer transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,0.7)] hover:-translate-y-1 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[15px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none", editMode ? "bg-primary/30 dark:bg-primary/30 border-primary/60 dark:border-primary/60 hover:bg-primary/40 dark:hover:bg-primary/40" : "bg-white/20 dark:bg-card/20 border-white/40 dark:border-white/20 hover:bg-white/30 dark:hover:bg-card/30")} title={editMode ? "Bewerkmodus uit" : "Bewerkmodus inschakelen"}>
            <Pencil size={20} />
          </button>
          <button onClick={handleClearCompleted} className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 text-foreground border-2 border-white/40 dark:border-white/20 p-2.5 rounded-2xl font-bold cursor-pointer transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,0.7)] hover:-translate-y-1 hover:bg-white/30 dark:hover:bg-card/30 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[15px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none">
            <Trash2 size={20} />
          </button>
          <ActiveUsers organizationId={organizationId!} />
        </div>
      </header>

      {/* Canvas Board */}
      {editMode && <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm font-semibold text-primary">
            🔧 Bewerkmodus actief - Klik op HEADER of TAAKGEBIED → sleep handles om te resizen
          </span>
          <div className="flex items-center gap-2">
            
            <Button onClick={handleAddColumn} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Kolom toevoegen
            </Button>
          </div>
        </div>}
      <main className="relative flex-1 min-h-0 overflow-auto bg-gradient-to-br from-blue-50 to-blue-100" style={{
          minWidth: '3000px',
          minHeight: '2000px'
        }} 
        onClick={(e) => {
          if (editMode && selectedColumn && e.target === e.currentTarget) {
            setSelectedColumn(null);
          }
        }}
        onDragOver={editMode ? e => {
          e.preventDefault();
          if (!draggedColumn) return;
          const canvas = e.currentTarget.getBoundingClientRect();
          // Account for UI scale factor
          const rawX = Math.max(0, (e.clientX - canvas.left) / SCALE_FACTOR - dragOffset.x);
          const rawY = Math.max(0, (e.clientY - canvas.top) / SCALE_FACTOR - dragOffset.y);
          const {
            snappedX,
            snappedY,
            guides
          } = calculateSnap(rawX, rawY);
          setDragPreview({
            x: snappedX,
            y: snappedY
          });
          setSnapGuides(guides);
        } : undefined} onDrop={editMode ? async e => {
          e.preventDefault();
          if (!draggedColumn || !dragPreview) return;
          try {
            await supabase.from('columns').update({
              x_position: dragPreview.x,
              y_position: dragPreview.y
            }).eq('id', draggedColumn.id);
            toast.success("Kolom verplaatst");
            await fetchBoardData();
          } catch (error: any) {
            toast.error("Fout bij verplaatsen: " + error.message);
          }
          setDraggedColumn(null);
          setDragPreview(null);
          setSnapGuides(null);
        } : undefined}>
        {/* Grid overlay in edit mode */}
        {editMode && <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `
                linear-gradient(to right, hsl(var(--border) / 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border) / 0.1) 1px, transparent 1px)
              `,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
          }} />}

        {/* Snap guide lines */}
        {snapGuides?.x !== undefined && <div className="absolute top-0 h-full w-[2px] bg-destructive/70 pointer-events-none z-50" style={{
            left: `${snapGuides.x}px`
          }} />}
        {snapGuides?.y !== undefined && <div className="absolute left-0 w-full h-[2px] bg-destructive/70 pointer-events-none z-50" style={{
            top: `${snapGuides.y}px`
          }} />}

        {/* Preview overlay during drag */}
        {dragPreview && draggedColumn && <>
            <div className="absolute border-4 border-dashed border-primary/50 bg-primary/10 rounded-[24px] pointer-events-none z-40" style={{
              left: `${dragPreview.x}px`,
              top: `${dragPreview.y}px`,
              width: `${draggedColumn.width}px`,
              height: `${draggedColumn.height}px`
            }} />
            {/* Position tooltip */}
            <div className="absolute bg-popover text-popover-foreground border px-3 py-1.5 rounded-md text-xs font-medium pointer-events-none z-50 shadow-lg" style={{
              left: `${dragPreview.x + 10}px`,
              top: `${dragPreview.y - 35}px`
            }}>
              x: {dragPreview.x}px, y: {dragPreview.y}px
            </div>
          </>}

        {columns.map(column => {
            const isSelected = selectedColumn?.id === column.id;
            const displayColumn = isSelected && resizing ? selectedColumn : column;
            return <section key={column.id} className={cn("absolute flex flex-col transition-all", editMode && !isSelected && "cursor-move hover:ring-2 hover:ring-primary hover:shadow-2xl", draggedColumn?.id === column.id && "opacity-50", isSelected && "ring-4 ring-primary shadow-2xl")} style={{
              left: `${displayColumn.x_position}px`,
              top: `${displayColumn.y_position}px`,
              width: `${displayColumn.width}px`,
              height: `${displayColumn.height}px`
            }} draggable={editMode && !isSelected} onDragStart={editMode && !isSelected ? e => {
              setDraggedColumn(column);
              const rect = e.currentTarget.getBoundingClientRect();
              const canvas = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
              setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
              });
            } : undefined} onDragEnd={editMode && !isSelected ? () => {
              setDraggedColumn(null);
              setDragPreview(null);
              setSnapGuides(null);
            } : undefined}>
            {/* Unified resize handles at column level */}
            {isSelected && editMode && <>
                <ResizeHandles mode="column" onMouseDown={(e, handle) => startResize(e, displayColumn, handle)} activeHandle={resizeHandle} headerHeight={displayColumn.header_height || 60} />
                <div className="absolute -top-10 left-0 bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-lg z-50 whitespace-nowrap">
                  Kolom: {displayColumn.width}px × {displayColumn.height}px | Header: {displayColumn.header_height || 60}px × {displayColumn.header_width || displayColumn.width}px | Padding: T:{displayColumn.content_padding_top || 0} R:{displayColumn.content_padding_right || 0} B:{displayColumn.content_padding_bottom || 0} L:{displayColumn.content_padding_left || 0}
                </div>
              </>}
            
            <div className={cn("flex items-center justify-between px-3.5 py-3 rounded-[24px] backdrop-blur-[60px] border-2 mb-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.08),inset_0_2px_2px_rgba(255,255,255,0.5)] relative overflow-visible group before:absolute before:inset-0 before:rounded-[24px] before:bg-gradient-to-br before:from-white/30 before:via-white/10 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[23px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none transition-all", getGlowStyles(column.glow_type).header, draggedColumn?.id === column.id && "opacity-40 scale-95", isSelected && editMode && "ring-2 ring-purple-500")} style={{
                height: `${displayColumn.header_height || 60}px`,
                minHeight: `${displayColumn.header_height || 60}px`
              }} onClick={e => {
                if (editMode) {
                  e.stopPropagation();
                  setSelectedColumn(column);
                }
              }}>
              <div className={cn("text-[clamp(16px,2vw,22px)] font-extrabold text-foreground relative z-10 drop-shadow-sm flex items-center gap-2", editMode && "cursor-pointer hover:text-primary transition-colors")} onClick={e => {
                  if (editMode) {
                    e.stopPropagation();
                    setEditingColumn(displayColumn);
                  }
                }}>
                {editMode && <span className="text-muted-foreground cursor-grab active:cursor-grabbing">⋮⋮</span>}
                {displayColumn.name}
              </div>
              <Dialog open={openDialog === column.id} onOpenChange={open => setOpenDialog(open ? column.id : null)}>
                <DialogTrigger asChild>
                  {editMode ? <button className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 border-2 border-white/40 dark:border-white/20 px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15),inset_0_2px_2px_rgba(255,255,255,0.7)] relative z-10 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[9px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none" onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteColumnId(column.id);
                    }}>
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-500" />
                    </button> : <button className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 text-foreground border-2 border-white/40 dark:border-white/20 px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-white/30 dark:hover:bg-card/30 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15),inset_0_2px_2px_rgba(255,255,255,0.7)] relative z-10 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[9px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none">
                      +
                    </button>}
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Nieuwe taak toevoegen - {column.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`title-${column.id}`}>{column.column_type === 'sick_leave' || column.column_type === 'vacation' ? "Naam" : "Titel"} *</Label>
                      <Input id={`title-${column.id}`} value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder={column.column_type === 'sick_leave' || column.column_type === 'vacation' ? "Naam van de persoon" : "Titel van de taak"} maxLength={200} />
                    </div>
                    <div>
                      <Label htmlFor={`description-${column.id}`}>{column.column_type === 'sick_leave' || column.column_type === 'vacation' ? "Reden" : "Beschrijving"}</Label>
                      <Textarea id={`description-${column.id}`} value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} placeholder={column.column_type === 'sick_leave' || column.column_type === 'vacation' ? "Reden voor afwezigheid..." : "Extra details..."} maxLength={1000} />
                    </div>
                    <div>
                      <Label>{column.column_type === 'sick_leave' || column.column_type === 'vacation' ? "Terug verwacht op" : "Deadline"}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newTaskDueDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newTaskDueDate ? format(newTaskDueDate, "PPP", {
                                locale: nl
                              }) : "Selecteer datum"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={newTaskDueDate} onSelect={setNewTaskDueDate} initialFocus className="pointer-events-auto" />
                          {newTaskDueDate && <div className="p-3 border-t">
                              <Button variant="outline" className="w-full" onClick={() => setNewTaskDueDate(undefined)}>
                                Verwijder datum
                              </Button>
                            </div>}
                        </PopoverContent>
                      </Popover>
                    </div>
                    {!(column.column_type === 'sick_leave' || column.column_type === 'vacation') && <div>
                      <Label>Prioriteit</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant={newTaskPriority === "low" ? "default" : "outline"} onClick={() => setNewTaskPriority("low")} className="flex-1">
                          Laag
                        </Button>
                        <Button type="button" variant={newTaskPriority === "medium" ? "default" : "outline"} onClick={() => setNewTaskPriority("medium")} className="flex-1">
                          Middel
                        </Button>
                        <Button type="button" variant={newTaskPriority === "high" ? "default" : "outline"} onClick={() => setNewTaskPriority("high")} className="flex-1">
                          Hoog
                        </Button>
                      </div>
                    </div>}
                    <button onClick={() => handleAddTask(column.id)} className="w-full backdrop-blur-md bg-primary/90 text-primary-foreground border-0 px-3.5 py-2.5 rounded-xl font-bold hover:bg-primary transition-all hover:shadow-lg">
                      Toevoegen
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div onDragOver={e => handleDragOver(e, column.id)} onDrop={e => handleDrop(e, column.id)} className={cn("flex-1 min-h-0 relative overflow-visible")} style={{
                paddingTop: `${displayColumn.content_padding_top || 0}px`,
                paddingRight: `${displayColumn.content_padding_right || 0}px`,
                paddingBottom: `${displayColumn.content_padding_bottom || 0}px`,
                paddingLeft: `${displayColumn.content_padding_left || 0}px`
              }} onClick={e => {
                if (editMode) {
                  e.stopPropagation();
                  setSelectedColumn(column);
                }
              }}>
              {/* Task rendering */}
              <div className="space-y-2.5">
                {getColumnTasks(column.id).map(task => {
                    const isSimpleColumn = column.column_type === 'sick_leave' || column.column_type === 'vacation';
                    if (isSimpleColumn) {
                      return <SimpleTaskCard key={task.id} title={task.title} description={task.description} dueDate={task.due_date} onClick={() => !isDragging && openEditDialog(task)} glowShadow={getGlowStyles(column.glow_type).cardShadow} assignees={task.assignees} />;
                    }
                    return <article key={task.id} draggable onDragStart={e => handleDragStart(e, task)} onDragEnd={handleDragEnd} onClick={() => !isDragging && openEditDialog(task)} className={cn("relative backdrop-blur-[60px] bg-white/25 dark:bg-card/25 border-2 border-white/40 dark:border-white/20 rounded-[24px] p-3.5 animate-[pop_0.2s_ease-out] cursor-move hover:-translate-y-2 transition-all duration-300 before:absolute before:inset-0 before:rounded-[24px] before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[23px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none", getGlowStyles(column.glow_type).cardShadow, draggedTask?.id === task.id && "opacity-50 scale-95")}>
                    <div className="absolute top-2 left-2 text-muted-foreground/50 text-sm select-none pointer-events-none">☰</div>
                    <div className="flex items-center gap-1.5 justify-end mb-1 relative z-10">
                      <AttachmentCount taskId={task.id} />
                      {task.due_date && <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${getDeadlineBadgeColor(task.due_date)}`}>
                          📅 {format(new Date(task.due_date), "d MMM", {
                            locale: nl
                          })}
                        </span>}
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-bold border", getPriorityBadge(task.priority).color)}>
                        {getPriorityBadge(task.priority).label}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-[clamp(14px,1.6vw,18px)] mb-1 text-foreground relative z-10">
                      {task.title}
                    </h4>
                    {task.description && <p className="text-muted-foreground text-[clamp(12px,1.2vw,14px)] relative z-10">
                        {task.description}
                      </p>}
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 relative z-10">
                        {task.assignees.slice(0, 3).map((assignee, idx) => (
                          <Avatar key={assignee.user_id} className="h-6 w-6 border-2 border-white" style={{ marginLeft: idx > 0 ? '-8px' : '0' }}>
                            <AvatarFallback className="text-[10px] bg-primary/10">
                              {assignee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {task.assignees.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold" style={{ marginLeft: '-8px' }}>
                            +{task.assignees.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </article>;
                  })}
              </div>
            </div>
          </section>;
          })}
      </main>

      {/* Edit Task Dialog */}
      <Dialog open={editingTask !== null} onOpenChange={open => !open && setEditingTask(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Taak bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
                const taskColumn = columns.find(c => c.id === editingTask?.column_id);
                const isSimpleColumn = taskColumn && (taskColumn.column_type === 'sick_leave' || taskColumn.column_type === 'vacation');
                return <>
                  <div>
                    <Label htmlFor="edit-title">{isSimpleColumn ? "Naam" : "Titel"} *</Label>
                    <Input id="edit-title" value={editTaskTitle} onChange={e => setEditTaskTitle(e.target.value)} placeholder={isSimpleColumn ? "Naam van de persoon" : "Titel van de taak"} maxLength={200} />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">{isSimpleColumn ? "Reden" : "Beschrijving"}</Label>
                    <Textarea id="edit-description" value={editTaskDescription} onChange={e => setEditTaskDescription(e.target.value)} placeholder={isSimpleColumn ? "Reden voor afwezigheid..." : "Extra details..."} maxLength={1000} />
                  </div>
                  {!isSimpleColumn && <div>
                      <Label>Prioriteit</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant={editTaskPriority === "low" ? "default" : "outline"} onClick={() => setEditTaskPriority("low")} className="flex-1">
                          Laag
                        </Button>
                        <Button type="button" variant={editTaskPriority === "medium" ? "default" : "outline"} onClick={() => setEditTaskPriority("medium")} className="flex-1">
                          Middel
                        </Button>
                        <Button type="button" variant={editTaskPriority === "high" ? "default" : "outline"} onClick={() => setEditTaskPriority("high")} className="flex-1">
                          Hoog
                        </Button>
                      </div>
                    </div>}
                  <div>
                    <Label>{isSimpleColumn ? "Terug verwacht op" : "Deadline"}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editTaskDueDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editTaskDueDate ? format(editTaskDueDate, "PPP", {
                            locale: nl
                          }) : "Selecteer datum"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={editTaskDueDate} onSelect={setEditTaskDueDate} initialFocus locale={nl} className="pointer-events-auto" />
                        {editTaskDueDate && <div className="p-3 border-t">
                            <Button variant="ghost" className="w-full" onClick={() => setEditTaskDueDate(undefined)}>
                              Wis datum
                            </Button>
                          </div>}
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label>Toegewezen aan</Label>
                    <div className="space-y-3">
                      {editTaskAssignees.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {editTaskAssignees.map(userId => {
                            const member = orgMembers.find(m => m.user_id === userId);
                            if (!member) return null;
                            return (
                              <div key={userId} className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{member.full_name}</span>
                                <button
                                  onClick={() => handleRemoveAssignee(userId)}
                                  className="ml-1 text-muted-foreground hover:text-destructive"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <Select
                        onValueChange={(value) => {
                          if (value && !editTaskAssignees.includes(value)) {
                            handleAddAssignee(value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <span className="text-muted-foreground">Teamlid toevoegen...</span>
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          {orgMembers
                            .filter(m => !editTaskAssignees.includes(m.user_id))
                            .map(member => (
                              <SelectItem key={member.user_id} value={member.user_id}>
                                {member.full_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {editingTask && <TaskAttachments taskId={editingTask.id} />}
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleDeleteFromDialog} variant="destructive">
                      Verwijderen
                    </Button>
                    <Button onClick={handleCompleteFromDialog} variant="outline" className="flex-1">
                      ✔ Voltooien
                    </Button>
                    <Button onClick={handleEditTask} className="flex-1">
                      Opslaan
                    </Button>
                  </div>
                </>;
              })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Column Management Dialog */}
      <ColumnManagement open={columnManagementOpen} onOpenChange={setColumnManagementOpen} columns={columns} boardId={board?.id || ''} onColumnsChange={fetchBoardData} />

      {/* Column Edit Sidebar */}
      {editingColumn && <ColumnEditSidebar column={editingColumn} onClose={() => setEditingColumn(null)} onSave={fetchBoardData} />}

      {/* Delete Column Confirmation */}
      <AlertDialog open={!!deleteColumnId} onOpenChange={open => !open && setDeleteColumnId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kolom verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze kolom wilt verwijderen? Alle taken in deze kolom worden verplaatst naar de eerste kolom.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteColumn} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        </div>
      </div>
      
      {/* Logo links onderaan */}
      <img src={logo} alt="LinqBoard Logo" className="fixed -bottom-8 left-2 h-32 w-auto z-50 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate("/dashboard")} />
    </div>;
};
export default Board;