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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, ArrowLeft, Trash2, Pencil, Plus, Upload, X, Image, ZoomIn, ZoomOut } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { nl, enUS, es, de } from "date-fns/locale";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import type { Locale } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/logo-transparent.png";
import defaultBackground from "@/assets/default-board-background.png";
import { TaskAttachments, AttachmentCount } from "@/components/TaskAttachments";
import { ActiveUsers } from "@/components/ActiveUsers";
import { ColumnManagement } from "@/components/ColumnManagement";
import { ColumnEditSidebar } from "@/components/ColumnEditSidebar";
import { ResizeHandles } from "@/components/ResizeHandles";
import { SimpleTaskCard } from "@/components/SimpleTaskCard";
import { getGlowStyles, GlowType } from "@/lib/glowStyles";
import { ColumnType } from "@/lib/columnTypes";
import { BackgroundCropEditor } from "@/components/BackgroundCropEditor";
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
  avatar_url?: string;
}

interface Task {
  id: string;
  column_id: string;
  title: string;
  assignees?: Assignee[];
  description: string | null;
  priority: "low" | "medium" | "high" | null;
  position: number;
  due_date?: string | null;
}

const Board = () => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  
  const taskSchema = z.object({
    title: z.string().trim().min(1, t('board.titleRequired')).max(200, t('board.titleMaxLength')),
    description: z.string().trim().max(1000, t('board.descriptionMaxLength')).optional()
  });

  // Touch gesture state for mobile/tablet
  const [touchState, setTouchState] = useState({
    initialDistance: 0,
    initialZoom: 1,
    lastTouch: { x: 0, y: 0 },
    isPinching: false,
    isPanning: false
  });
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  
  const {
    organizationId
  } = useParams();
  const navigate = useNavigate();
  
  // Redirect 'demo' to real demo UUID
  useEffect(() => {
    if (organizationId === 'demo') {
      navigate('/board/00000000-0000-0000-0000-000000000000', { replace: true });
    }
  }, [organizationId, navigate]);
  
  // Detect demo mode by UUID
  const isDemo = organizationId === '00000000-0000-0000-0000-000000000000';
  
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [board, setBoard] = useState<any>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | null>("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskDueDate, setEditTaskDueDate] = useState<Date | undefined>(undefined);
  const [editTaskPriority, setEditTaskPriority] = useState<"low" | "medium" | "high" | null>("medium");
  const [orgMembers, setOrgMembers] = useState<Assignee[]>([]);
  const [editTaskAssignees, setEditTaskAssignees] = useState<string[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingTaskColumn, setEditingTaskColumn] = useState<string | null>(null);
  const [columnManagementOpen, setColumnManagementOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState<string>("from-blue-50 to-blue-100");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [backgroundPositionX, setBackgroundPositionX] = useState<number>(50);
  const [backgroundPositionY, setBackgroundPositionY] = useState<number>(50);
  const [backgroundScale, setBackgroundScale] = useState<number>(100);
  const [backgroundFitMode, setBackgroundFitMode] = useState<'scale' | 'cover'>('scale');
  const [cropEditorOpen, setCropEditorOpen] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
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
  const [userPlan, setUserPlan] = useState<string>('free');
  const [canCustomizeBackground, setCanCustomizeBackground] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(0.75);
  const GRID_SIZE = 20;
  const SNAP_THRESHOLD = 15;
  const SCALE_FACTOR = zoomLevel; // UI scale factor (now dynamic)

  // Get date-fns locale based on current language
  const getDateLocale = (): Locale => {
    switch (i18n.language) {
      case 'nl': return nl;
      case 'en': return enUS;
      case 'es': return es;
      case 'de': return de;
      default: return nl;
    }
  };

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getMidpoint = (touch1: React.Touch, touch2: React.Touch) => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  });

  // Touch event handlers for pan (1 finger) and pinch-to-zoom (2 fingers)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // 1 finger - start pan
      setTouchState({
        ...touchState,
        lastTouch: { x: e.touches[0].clientX, y: e.touches[0].clientY },
        isPanning: true,
        isPinching: false
      });
    } else if (e.touches.length === 2) {
      // 2 fingers - start pinch
      const distance = getDistance(e.touches[0], e.touches[1]);
      setTouchState({
        initialDistance: distance,
        initialZoom: zoomLevel,
        lastTouch: { x: 0, y: 0 },
        isPinching: true,
        isPanning: false
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchState.isPanning) {
      // 1 finger - pan
      e.preventDefault();
      
      const deltaX = e.touches[0].clientX - touchState.lastTouch.x;
      const deltaY = e.touches[0].clientY - touchState.lastTouch.y;
      
      setPanPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setTouchState(prev => ({
        ...prev,
        lastTouch: { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }));
    } else if (e.touches.length === 2 && touchState.isPinching) {
      // 2 fingers - pinch to zoom (no minimum limit on mobile)
      e.preventDefault();
      
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / touchState.initialDistance;
      const newZoom = Math.min(Math.max(touchState.initialZoom * scale, 0.01), 3);
      
      setZoomLevel(newZoom);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setTouchState(prev => ({
        ...prev,
        isPanning: false,
        isPinching: false
      }));
    } else if (e.touches.length === 1 && touchState.isPinching) {
      // Switched from 2 to 1 finger - start panning
      setTouchState({
        ...touchState,
        lastTouch: { x: e.touches[0].clientX, y: e.touches[0].clientY },
        isPanning: true,
        isPinching: false
      });
    }
  };
  
  const checkAccess = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      navigate("/auth");
      return;
    }
    
    // Check if user has membership
    const { data: membership } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();
    
    // If no membership and this is the demo board, create one automatically
    if (!membership && isDemo) {
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          role: 'member'
        });
      
      if (membershipError) {
        console.error('Error creating demo membership:', membershipError);
        toast.error("Kon geen toegang krijgen tot de demo. Log eerst in.");
        navigate('/auth');
        return;
      }
    } else if (!membership) {
      // Not demo and no membership - redirect to dashboard
      toast.error(t('board.noAccess'));
      navigate("/dashboard");
      return;
    }
  };

  const fetchOrgMembers = async () => {
    try {
      const { data: memberships } = await supabase
        .from("memberships")
        .select("user_id")
        .eq("organization_id", organizationId);
      
      if (memberships && memberships.length > 0) {
        const userIds = memberships.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        
        if (profiles) {
          setOrgMembers(profiles);
        }
      }
    } catch (error) {
      console.error(t('board.errorLoadingMembers'), error);
    }
  };

  const fetchBoardData = async () => {
    try {
      const { data: orgData } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationId)
        .single();

      if (orgData) {
        setOrganization(orgData);
      }

      const { data: boardData } = await supabase
        .from("boards")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      if (boardData) {
        setBoard(boardData);
        setSelectedBackground(boardData.background_gradient || "from-blue-50 to-blue-100");
        setBackgroundImageUrl(boardData.background_image_url);
        setBackgroundPositionX(boardData.background_position_x ?? 50);
        setBackgroundPositionY(boardData.background_position_y ?? 50);
        setBackgroundScale(boardData.background_scale ?? 100);
        setBackgroundFitMode(boardData.background_fit_mode || 'scale');
      }

      const { data: columnsData } = await supabase
        .from("columns")
        .select("*")
        .eq("board_id", boardData?.id)
        .order("position");

      if (columnsData) {
        setColumns(columnsData);
      }

      const { data: tasksData } = await supabase
        .from("tasks")
        .select(`
          *,
          task_assignees (
            user_id,
            profiles (
              user_id,
              full_name,
              avatar_url
            )
          )
        `)
        .in("column_id", columnsData?.map(c => c.id) || [])
        .order("position");

      if (tasksData) {
        const tasksWithAssignees = tasksData.map(task => ({
          ...task,
          assignees: task.task_assignees?.map((ta: any) => ({
            user_id: ta.profiles.user_id,
            full_name: ta.profiles.full_name,
            avatar_url: ta.profiles.avatar_url
          })) || []
        }));
        setTasks(tasksWithAssignees);
      }
    } catch (error) {
      console.error("Error fetching board data:", error);
      toast.error(t('board.errorLoadingBoard'));
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const columnsSubscription = supabase
      .channel('columns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'columns',
          filter: `board_id=eq.${board?.id}`
        },
        () => {
          fetchBoardData();
        }
      )
      .subscribe();

    const tasksSubscription = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          fetchBoardData();
        }
      )
      .subscribe();

    const taskAssigneesSubscription = supabase
      .channel('task-assignees-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_assignees'
        },
        () => {
          fetchBoardData();
        }
      )
      .subscribe();

    return () => {
      columnsSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
      taskAssigneesSubscription.unsubscribe();
    };
  };

  useEffect(() => {
    if (organizationId && organizationId !== 'demo') {
      checkAccess();
      fetchBoardData();
      fetchOrgMembers();
    }
  }, [organizationId]);

  useEffect(() => {
    if (board?.id) {
      return setupRealtimeSubscriptions();
    }
  }, [board?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchUserPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserPlan(profile.subscription_tier || 'free');
          setCanCustomizeBackground(profile.subscription_tier === 'premium' || profile.subscription_tier === 'enterprise');
        }
      }
    };
    
    fetchUserPlan();
  }, []);

  const formatDueDate = (dueDate: string | null | undefined) => {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);
    
    if (isBefore(date, today)) {
      return { text: format(date, 'dd MMM', { locale: getDateLocale() }), color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (date.toDateString() === today.toDateString()) {
      return { text: t('board.today'), color: 'text-orange-600', bgColor: 'bg-orange-50' };
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return { text: t('board.tomorrow'), color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    } else {
      return { text: format(date, 'dd MMM', { locale: getDateLocale() }), color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string | null) => {
    switch (priority) {
      case 'high': return t('board.priorityHigh');
      case 'medium': return t('board.priorityMedium');
      case 'low': return t('board.priorityLow');
      default: return t('board.priorityNone');
    }
  };

  const handleCreateTask = async (columnId: string) => {
    try {
      const validation = taskSchema.safeParse({
        title: newTaskTitle,
        description: newTaskDescription
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      const maxPosition = Math.max(
        ...tasks.filter(t => t.column_id === columnId).map(t => t.position),
        -1
      );

      const { error } = await supabase.from("tasks").insert({
        column_id: columnId,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || null,
        priority: newTaskPriority,
        position: maxPosition + 1,
        due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null
      });

      if (error) throw error;

      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("medium");
      setNewTaskDueDate(undefined);
      setOpenDialog(null);
      toast.success(t('board.taskCreated'));
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(t('board.errorCreatingTask'));
    }
  };

  const handleUpdateTask = async () => {
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

      const { error: taskError } = await supabase
        .from("tasks")
        .update({
          title: editTaskTitle.trim(),
          description: editTaskDescription.trim() || null,
          priority: editTaskPriority,
          due_date: editTaskDueDate ? editTaskDueDate.toISOString() : null
        })
        .eq("id", editingTask.id);

      if (taskError) throw taskError;

      const { error: deleteError } = await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", editingTask.id);

      if (deleteError) throw deleteError;

      if (editTaskAssignees.length > 0) {
        const { error: assignError } = await supabase
          .from("task_assignees")
          .insert(
            editTaskAssignees.map(userId => ({
              task_id: editingTask.id,
              user_id: userId
            }))
          );

        if (assignError) throw assignError;
      }

      setEditingTask(null);
      setEditingTaskColumn(null);
      toast.success(t('board.taskUpdated'));
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(t('board.errorUpdatingTask'));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) throw error;

      toast.success(t('board.taskDeleted'));
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(t('board.errorDeletingTask'));
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDraggedOverColumn(columnId);
  };

  const handleDrop = async (columnId: string) => {
    if (!draggedTask) return;

    try {
      const tasksInColumn = tasks.filter(t => t.column_id === columnId);
      const maxPosition = Math.max(...tasksInColumn.map(t => t.position), -1);

      const { error } = await supabase
        .from("tasks")
        .update({
          column_id: columnId,
          position: maxPosition + 1
        })
        .eq("id", draggedTask.id);

      if (error) throw error;

      toast.success(t('board.taskMoved'));
    } catch (error) {
      console.error("Error moving task:", error);
      toast.error(t('board.errorMovingTask'));
    } finally {
      setDraggedTask(null);
      setDraggedOverColumn(null);
      setIsDragging(false);
    }
  };

  const openEditDialog = (task: Task, columnId: string) => {
    setEditingTask(task);
    setEditingTaskColumn(columnId);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || "");
    setEditTaskPriority(task.priority);
    setEditTaskDueDate(task.due_date ? new Date(task.due_date) : undefined);
    setEditTaskAssignees(task.assignees?.map(a => a.user_id) || []);
  };

  const toggleAssignee = (userId: string) => {
    setEditTaskAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBackgroundChange = async (gradient: string) => {
    if (!canCustomizeBackground) {
      toast.error(t('board.premiumFeature'));
      return;
    }

    setSelectedBackground(gradient);
    
    try {
      const { error } = await supabase
        .from('boards')
        .update({ 
          background_gradient: gradient,
          background_image_url: null,
          background_position_x: 50,
          background_position_y: 50,
          background_scale: 100
        })
        .eq('id', board.id);

      if (error) throw error;
      
      setBackgroundImageUrl(null);
      setBackgroundPositionX(50);
      setBackgroundPositionY(50);
      setBackgroundScale(100);
      toast.success(t('board.backgroundUpdated'));
    } catch (error) {
      console.error('Error updating background:', error);
      toast.error(t('board.errorUpdatingBackground'));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canCustomizeBackground) {
      toast.error(t('board.premiumFeature'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('board.imageTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPendingImageFile(file);
      setPendingImagePreview(event.target?.result as string);
      setCropEditorOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob, cropData: { x: number; y: number; scale: number }) => {
    setUploadingBackground(true);
    setCropEditorOpen(false);

    try {
      const fileName = `${board.id}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('board-backgrounds')
        .upload(fileName, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('board-backgrounds')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('boards')
        .update({ 
          background_image_url: publicUrl,
          background_gradient: null,
          background_position_x: cropData.x,
          background_position_y: cropData.y,
          background_scale: cropData.scale,
          background_fit_mode: 'scale'
        })
        .eq('id', board.id);

      if (updateError) throw updateError;

      setBackgroundImageUrl(publicUrl);
      setBackgroundPositionX(cropData.x);
      setBackgroundPositionY(cropData.y);
      setBackgroundScale(cropData.scale);
      setBackgroundFitMode('scale');
      setSelectedBackground('');
      toast.success(t('board.backgroundUpdated'));
    } catch (error) {
      console.error('Error uploading background:', error);
      toast.error(t('board.errorUploadingBackground'));
    } finally {
      setUploadingBackground(false);
      setPendingImageFile(null);
      setPendingImagePreview(null);
    }
  };

  const handleRemoveBackground = async () => {
    if (!canCustomizeBackground) {
      toast.error(t('board.premiumFeature'));
      return;
    }

    try {
      const { error } = await supabase
        .from('boards')
        .update({ 
          background_image_url: null,
          background_gradient: 'from-blue-50 to-blue-100',
          background_position_x: 50,
          background_position_y: 50,
          background_scale: 100
        })
        .eq('id', board.id);

      if (error) throw error;

      setBackgroundImageUrl(null);
      setSelectedBackground('from-blue-50 to-blue-100');
      setBackgroundPositionX(50);
      setBackgroundPositionY(50);
      setBackgroundScale(100);
      toast.success(t('board.backgroundRemoved'));
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error(t('board.errorRemovingBackground'));
    }
  };

  const snapToGrid = (value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  const findSnapGuides = (col: Column, allColumns: Column[]) => {
    const guides: { x?: number; y?: number } = {};
    const threshold = SNAP_THRESHOLD;

    allColumns.forEach(other => {
      if (other.id === col.id) return;

      if (Math.abs(col.x_position - other.x_position) < threshold) {
        guides.x = other.x_position;
      }
      if (Math.abs(col.x_position + col.width - (other.x_position + other.width)) < threshold) {
        guides.x = other.x_position + other.width - col.width;
      }
      if (Math.abs(col.y_position - other.y_position) < threshold) {
        guides.y = other.y_position;
      }
      if (Math.abs(col.y_position + col.height - (other.y_position + other.height)) < threshold) {
        guides.y = other.y_position + other.height - col.height;
      }
    });

    return guides;
  };

  const handleColumnDragStart = (e: React.MouseEvent, column: Column) => {
    if (!editMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDraggedColumn(column);
    setDragOffset({ x: offsetX, y: offsetY });
    setDragPreview({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleColumnDragMove = (e: MouseEvent) => {
    if (!draggedColumn || !editMode) return;

    const containerRect = document.getElementById('board-container')?.getBoundingClientRect();
    if (!containerRect) return;

    let newX = (e.clientX - containerRect.left - dragOffset.x - panPosition.x) / SCALE_FACTOR;
    let newY = (e.clientY - containerRect.top - dragOffset.y - panPosition.y) / SCALE_FACTOR;

    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    newX = snapToGrid(newX);
    newY = snapToGrid(newY);

    const updatedColumn = { ...draggedColumn, x_position: newX, y_position: newY };
    const guides = findSnapGuides(updatedColumn, columns);

    if (guides.x !== undefined) newX = guides.x;
    if (guides.y !== undefined) newY = guides.y;

    setSnapGuides(guides);
    setDragPreview({ 
      x: e.clientX - dragOffset.x, 
      y: e.clientY - dragOffset.y 
    });

    setColumns(prev =>
      prev.map(col =>
        col.id === draggedColumn.id
          ? { ...col, x_position: newX, y_position: newY }
          : col
      )
    );
  };

  const handleColumnDragEnd = async () => {
    if (!draggedColumn || !editMode) return;

    try {
      const updatedColumn = columns.find(c => c.id === draggedColumn.id);
      if (!updatedColumn) return;

      const { error } = await supabase
        .from('columns')
        .update({
          x_position: updatedColumn.x_position,
          y_position: updatedColumn.y_position
        })
        .eq('id', draggedColumn.id);

      if (error) throw error;

      toast.success(t('board.columnMoved'));
    } catch (error) {
      console.error('Error updating column position:', error);
      toast.error(t('board.errorMovingColumn'));
    } finally {
      setDraggedColumn(null);
      setDragOffset({ x: 0, y: 0 });
      setDragPreview(null);
      setSnapGuides(null);
    }
  };

  useEffect(() => {
    if (draggedColumn && editMode) {
      const handleMouseMove = (e: MouseEvent) => handleColumnDragMove(e);
      const handleMouseUp = () => handleColumnDragEnd();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedColumn, dragOffset, columns, editMode, panPosition, SCALE_FACTOR]);

  const handleResizeStart = (e: React.MouseEvent, column: Column, handle: string) => {
    if (!editMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      col: column
    });
    setSelectedColumn(column);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizing || !resizeStart || !resizeHandle || !editMode) return;

    const deltaX = (e.clientX - resizeStart.x) / SCALE_FACTOR;
    const deltaY = (e.clientY - resizeStart.y) / SCALE_FACTOR;

    let newWidth = resizeStart.col.width;
    let newHeight = resizeStart.col.height;
    let newX = resizeStart.col.x_position;
    let newY = resizeStart.col.y_position;

    if (resizeHandle.includes('e')) {
      newWidth = Math.max(200, resizeStart.col.width + deltaX);
    }
    if (resizeHandle.includes('w')) {
      const maxDelta = resizeStart.col.width - 200;
      const constrainedDelta = Math.min(deltaX, maxDelta);
      newWidth = resizeStart.col.width - constrainedDelta;
      newX = resizeStart.col.x_position + constrainedDelta;
    }
    if (resizeHandle.includes('s')) {
      newHeight = Math.max(300, resizeStart.col.height + deltaY);
    }
    if (resizeHandle.includes('n')) {
      const maxDelta = resizeStart.col.height - 300;
      const constrainedDelta = Math.min(deltaY, maxDelta);
      newHeight = resizeStart.col.height - constrainedDelta;
      newY = resizeStart.col.y_position + constrainedDelta;
    }

    newWidth = snapToGrid(newWidth);
    newHeight = snapToGrid(newHeight);
    newX = snapToGrid(newX);
    newY = snapToGrid(newY);

    setColumns(prev =>
      prev.map(col =>
        col.id === resizeStart.col.id
          ? { ...col, width: newWidth, height: newHeight, x_position: newX, y_position: newY }
          : col
      )
    );
  };

  const handleResizeEnd = async () => {
    if (!resizing || !resizeStart || !editMode) return;

    try {
      const updatedColumn = columns.find(c => c.id === resizeStart.col.id);
      if (!updatedColumn) return;

      const { error } = await supabase
        .from('columns')
        .update({
          width: updatedColumn.width,
          height: updatedColumn.height,
          x_position: updatedColumn.x_position,
          y_position: updatedColumn.y_position
        })
        .eq('id', resizeStart.col.id);

      if (error) throw error;

      toast.success(t('board.columnResized'));
    } catch (error) {
      console.error('Error resizing column:', error);
      toast.error(t('board.errorResizingColumn'));
    } finally {
      setResizing(false);
      setResizeHandle(null);
      setResizeStart(null);
    }
  };

  useEffect(() => {
    if (resizing && editMode) {
      const handleMouseMove = (e: MouseEvent) => handleResizeMove(e);
      const handleMouseUp = () => handleResizeEnd();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing, resizeStart, resizeHandle, columns, editMode, SCALE_FACTOR]);

  const handleDeleteColumn = async (columnId: string) => {
    try {
      const { error } = await supabase
        .from('columns')
        .delete()
        .eq('id', columnId);

      if (error) throw error;

      toast.success(t('board.columnDeleted'));
      setDeleteColumnId(null);
    } catch (error) {
      console.error('Error deleting column:', error);
      toast.error(t('board.errorDeletingColumn'));
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.5), 3));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const backgroundStyle = backgroundImageUrl
    ? {
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: backgroundFitMode === 'cover' ? 'cover' : `${backgroundScale}%`,
        backgroundPosition: backgroundFitMode === 'cover' 
          ? 'center' 
          : `${backgroundPositionX}% ${backgroundPositionY}%`,
        backgroundRepeat: 'no-repeat'
      }
    : {};

  return (
    <div 
      className={cn(
        "min-h-screen relative overflow-hidden",
        !backgroundImageUrl && `bg-gradient-to-br ${selectedBackground}`
      )}
      style={backgroundStyle}
      onWheel={handleWheel}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('board.backToDashboard')}
              </Button>
              <div className="flex items-center gap-3">
                <img src={logo} alt="Logo" className="h-8 w-8" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {organization?.name}
                  </h1>
                  <p className="text-sm text-gray-500">{board?.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 px-2 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  className="h-7 w-7 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[3rem] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  className="h-7 w-7 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <ActiveUsers organizationId={organizationId!} />
              
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? t('board.doneEditing') : t('board.editLayout')}
              </Button>

              <ColumnManagement
                boardId={board?.id}
                open={columnManagementOpen}
                onOpenChange={setColumnManagementOpen}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Board Canvas */}
      <div 
        id="board-container"
        className="absolute inset-0 pt-[73px]"
        style={{
          cursor: editMode ? 'move' : 'default',
          touchAction: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${SCALE_FACTOR})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'relative'
          }}
        >
          {/* Snap guides */}
          {snapGuides?.x !== undefined && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-blue-500 pointer-events-none z-50"
              style={{ left: `${snapGuides.x}px` }}
            />
          )}
          {snapGuides?.y !== undefined && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-blue-500 pointer-events-none z-50"
              style={{ top: `${snapGuides.y}px` }}
            />
          )}

          {/* Columns */}
          {columns.map((column) => {
            const columnTasks = tasks.filter(t => t.column_id === column.id);
            const isDraggedOver = draggedOverColumn === column.id;
            const isBeingDragged = draggedColumn?.id === column.id;
            const isSelected = selectedColumn?.id === column.id;

            return (
              <div
                key={column.id}
                className={cn(
                  "absolute bg-white/90 backdrop-blur-sm rounded-lg shadow-lg transition-all",
                  isDraggedOver && "ring-2 ring-primary",
                  isBeingDragged && "opacity-50",
                  isSelected && editMode && "ring-2 ring-blue-500",
                  editMode && "cursor-move hover:shadow-xl"
                )}
                style={{
                  left: `${column.x_position}px`,
                  top: `${column.y_position}px`,
                  width: `${column.width}px`,
                  height: `${column.height}px`,
                  ...getGlowStyles(column.glow_type)
                }}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={() => handleDrop(column.id)}
                onMouseDown={(e) => handleColumnDragStart(e, column)}
                onClick={() => editMode && setSelectedColumn(column)}
              >
                {/* Column Header */}
                <div 
                  className="px-4 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white"
                  style={{
                    height: `${column.header_height}px`,
                    width: column.header_width ? `${column.header_width}px` : '100%'
                  }}
                >
                  <h3 className="font-semibold text-gray-900 truncate flex-1">
                    {column.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {columnTasks.length}
                    </span>
                    {editMode && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingColumn(column);
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteColumnId(column.id);
                          }}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {!editMode && (
                      <Dialog open={openDialog === column.id} onOpenChange={(open) => setOpenDialog(open ? column.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>{t('board.createTask')}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="title">{t('board.taskTitle')}</Label>
                              <Input
                                id="title"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder={t('board.taskTitlePlaceholder')}
                                maxLength={200}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="description">{t('board.taskDescription')}</Label>
                              <Textarea
                                id="description"
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                placeholder={t('board.taskDescriptionPlaceholder')}
                                rows={3}
                                maxLength={1000}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('board.priority')}</Label>
                              <Select value={newTaskPriority || undefined} onValueChange={(value) => setNewTaskPriority(value as any)}>
                                <SelectTrigger>
                                  <span className={cn("px-2 py-1 rounded text-xs font-medium", getPriorityColor(newTaskPriority))}>
                                    {getPriorityLabel(newTaskPriority)}
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">
                                    <span className={cn("px-2 py-1 rounded text-xs font-medium", getPriorityColor("low"))}>
                                      {t('board.priorityLow')}
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="medium">
                                    <span className={cn("px-2 py-1 rounded text-xs font-medium", getPriorityColor("medium"))}>
                                      {t('board.priorityMedium')}
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="high">
                                    <span className={cn("px-2 py-1 rounded text-xs font-medium", getPriorityColor("high"))}>
                                      {t('board.priorityHigh')}
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>{t('board.dueDate')}</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {newTaskDueDate ? format(newTaskDueDate, 'PPP', { locale: getDateLocale() }) : t('board.pickDate')}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={newTaskDueDate}
                                    onSelect={setNewTaskDueDate}
                                    locale={getDateLocale()}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setOpenDialog(null)}>
                              {t('board.cancel')}
                            </Button>
                            <Button onClick={() => handleCreateTask(column.id)}>
                              {t('board.create')}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>

                {/* Column Content */}
                <div 
                  className="overflow-y-auto"
                  style={{
                    height: `calc(100% - ${column.header_height}px)`,
                    padding: `${column.content_padding_top}px ${column.content_padding_right}px ${column.content_padding_bottom}px ${column.content_padding_left}px`
                  }}
                >
                  <div className="space-y-3">
                    {columnTasks
                      .sort((a, b) => a.position - b.position)
                      .map((task) => (
                        <SimpleTaskCard
                          key={task.id}
                          task={task}
                          onEdit={() => openEditDialog(task, column.id)}
                          onDelete={() => handleDeleteTask(task.id)}
                          onDragStart={() => handleDragStart(task)}
                          formatDueDate={formatDueDate}
                          getPriorityColor={getPriorityColor}
                          getPriorityLabel={getPriorityLabel}
                          isDragging={isDragging && draggedTask?.id === task.id}
                        />
                      ))}
                  </div>
                </div>

                {/* Resize Handles */}
                {editMode && isSelected && (
                  <ResizeHandles
                    onResizeStart={(e, handle) => handleResizeStart(e, column, handle)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('board.editTask')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">{t('board.taskTitle')}</Label>
              <Input
                id="edit-title"
                value={editTaskTitle}
                onChange={(e) => setEditTaskTitle(e.target.value)}
                placeholder={t('board.taskTitlePlaceholder')}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('board.taskDescription')}</Label>
              <Textarea
                id="edit-description"
                value={editTaskDescription}
                onChange={(e) => setEditTaskDescription(e.target.value)}
                placeholder={t('board.taskDescriptionPlaceholder')}
                rows={3}
                maxLength={1000}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('board.priority')}</Label>
              <Select value={editTaskPriority || undefined} onValueChange={(value) => setEditTaskPriority(value as any)}>
                <SelectTrigger>
                  <span className={cn("px-2 py-1 rounded text-xs font-medium", getPriorityColor(editTaskPriority))}>
                    {getPriorityLabel(editTaskPriority)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", getPriorityColor("low"))}>
                      {t('board.priorityLow')}
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", getPriorityColor("medium"))}>
                      {t('board.priorityMedium')}
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", getPriorityColor("high"))}>
                      {t('board.priorityHigh')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('board.dueDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editTaskDueDate ? format(editTaskDueDate, 'PPP', { locale: getDateLocale() }) : t('board.pickDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editTaskDueDate}
                    onSelect={setEditTaskDueDate}
                    locale={getDateLocale()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>{t('board.assignees')}</Label>
              <div className="flex flex-wrap gap-2">
                {orgMembers.map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => toggleAssignee(member.user_id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                      editTaskAssignees.includes(member.user_id)
                        ? "bg-primary/10 border-primary"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>
                        {member.full_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.full_name}</span>
                  </button>
                ))}
              </div>
            </div>
            {editingTask && (
              <div className="space-y-2">
                <Label>{t('board.attachments')}</Label>
                <TaskAttachments taskId={editingTask.id} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              {t('board.cancel')}
            </Button>
            <Button onClick={handleUpdateTask}>
              {t('board.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Column Edit Sidebar */}
      {editingColumn && (
        <ColumnEditSidebar
          column={editingColumn}
          onClose={() => setEditingColumn(null)}
          onUpdate={(updates) => {
            setColumns(prev =>
              prev.map(col =>
                col.id === editingColumn.id ? { ...col, ...updates } : col
              )
            );
          }}
        />
      )}

      {/* Delete Column Confirmation */}
      <AlertDialog open={!!deleteColumnId} onOpenChange={(open) => !open && setDeleteColumnId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('board.deleteColumnTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('board.deleteColumnDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('board.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteColumnId && handleDeleteColumn(deleteColumnId)}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('board.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Background Crop Editor */}
      {cropEditorOpen && pendingImagePreview && (
        <BackgroundCropEditor
          imageUrl={pendingImagePreview}
          onComplete={handleCropComplete}
          onCancel={() => {
            setCropEditorOpen(false);
            setPendingImageFile(null);
            setPendingImagePreview(null);
          }}
        />
      )}

      {/* Background Customization Panel */}
      {editMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">{t('board.background')}:</span>
            
            {/* Gradient presets */}
            <div className="flex gap-2">
              {[
                'from-blue-50 to-blue-100',
                'from-purple-50 to-purple-100',
                'from-green-50 to-green-100',
                'from-orange-50 to-orange-100',
                'from-pink-50 to-pink-100'
              ].map((gradient) => (
                <button
                  key={gradient}
                  onClick={() => handleBackgroundChange(gradient)}
                  className={cn(
                    "w-10 h-10 rounded-lg border-2 transition-all",
                    selectedBackground === gradient && !backgroundImageUrl
                      ? "border-primary scale-110"
                      : "border-gray-200 hover:border-gray-300",
                    `bg-gradient-to-br ${gradient}`
                  )}
                />
              ))}
            </div>

            {/* Image upload */}
            <div className="flex gap-2 border-l border-gray-200 pl-4">
              <label className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                backgroundImageUrl
                  ? "bg-primary/10 border-primary"
                  : "bg-white border-gray-200 hover:border-gray-300"
              )}>
                <Image className="h-4 w-4" />
                <span className="text-sm">{t('board.uploadImage')}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={uploadingBackground}
                />
              </label>

              {backgroundImageUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveBackground}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
