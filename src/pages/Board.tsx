import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, ArrowLeft, Trash2, Pencil, Plus, Upload, X, Image, ZoomIn, ZoomOut, Mail, StickyNote, Clock, Calculator, Link, Users, Trophy, Filter, Calendar as CalendarLucide, Clipboard as ClipboardIcon, FileText, Target, CheckSquare, Archive, CheckCircle2, Zap, Paperclip, Layout, BarChart3 } from "lucide-react";
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
import { TaskHistory } from "@/components/TaskHistory";
import { TaskHistoryDialog } from "@/components/TaskHistoryDialog";
import { ActiveUsers } from "@/components/ActiveUsers";
import { ColumnManagement } from "@/components/ColumnManagement";
import { TaskReminders } from "@/components/TaskReminders";
import { NotificationPermissionBanner } from "@/components/NotificationPermissionBanner";
import { useDesktopNotifications } from "@/hooks/useDesktopNotifications";
import { ColumnEditSidebar } from "@/components/ColumnEditSidebar";
import { ResizeHandles } from "@/components/ResizeHandles";
import { SimpleTaskCard } from "@/components/SimpleTaskCard";
import { TaskChecklist } from "@/components/TaskChecklist";
import { TaskChecklistCreate, NewChecklistItem } from "@/components/TaskChecklistCreate";

import { getGlowStyles, GlowType } from "@/lib/glowStyles";
import { ColumnType } from "@/lib/columnTypes";
import { BackgroundCropEditor } from "@/components/BackgroundCropEditor";
import { TeamMemberSelect } from "@/components/TeamMemberSelect";
import { WidgetContainer } from "@/components/WidgetContainer";
import { Badge } from "@/components/ui/badge";
import { FixedChatWidget } from "@/components/FixedChatWidget";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { AbsenceManagementDialog } from "@/components/AbsenceManagementDialog";
import { PersonSearchSelect } from "@/components/PersonSearchSelect";
import { AbsenceHistorySection } from "@/components/AbsenceHistorySection";
import { RecurrenceSelect } from "@/components/RecurrenceSelect";
import { TimeTracker } from "@/components/TimeTracker";
import { TaskDependencies } from "@/components/TaskDependencies";
import { TaskArchiveDialog } from "@/components/TaskArchiveDialog";
interface Column {
  id: string;
  name: string;
  position: number;
  mobile_position?: number;
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
// Demo data - will be populated with translations
const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000000';

// Function to get demo data with translations
const getDemoData = (t: any) => {
  const DEMO_ORG = {
    id: DEMO_ORG_ID,
    name: t('demo.orgName')
  };
  const DEMO_BOARD = {
    id: 'demo-board',
    name: t('demo.boardName'),
    background_gradient: 'from-background via-primary/5 to-accent/5',
    background_image_url: null,
    background_fit_mode: 'cover',
    background_position_x: 50,
    background_position_y: 50,
    background_scale: 100
  };
  const DEMO_COLUMNS: Column[] = [{
    id: 'col-0',
    name: t('demo.columns.announcements'),
    position: 0,
    width_ratio: 1,
    board_id: 'demo-board',
    x_position: 40,
    y_position: 50,
    width: 350,
    height: 400,
    header_height: 60,
    content_padding_top: 0,
    content_padding_right: 0,
    content_padding_bottom: 0,
    content_padding_left: 0,
    glow_type: 'orange',
    column_type: 'announcement'
  }, {
    id: 'col-1',
    name: t('demo.columns.todo'),
    position: 1,
    width_ratio: 1,
    board_id: 'demo-board',
    x_position: 430,
    y_position: 50,
    width: 300,
    height: 600,
    header_height: 60,
    content_padding_top: 0,
    content_padding_right: 0,
    content_padding_bottom: 0,
    content_padding_left: 0,
    glow_type: 'blue',
    column_type: 'regular'
  }, {
    id: 'col-2',
    name: t('demo.columns.inProgress'),
    position: 2,
    width_ratio: 1,
    board_id: 'demo-board',
    x_position: 770,
    y_position: 50,
    width: 300,
    height: 600,
    header_height: 60,
    content_padding_top: 0,
    content_padding_right: 0,
    content_padding_bottom: 0,
    content_padding_left: 0,
    glow_type: 'yellow',
    column_type: 'regular'
  }, {
    id: 'col-3',
    name: t('demo.columns.review'),
    position: 3,
    width_ratio: 1,
    board_id: 'demo-board',
    x_position: 1110,
    y_position: 50,
    width: 300,
    height: 600,
    header_height: 60,
    content_padding_top: 0,
    content_padding_right: 0,
    content_padding_bottom: 0,
    content_padding_left: 0,
    glow_type: 'purple',
    column_type: 'regular'
  }, {
    id: 'col-4',
    name: t('demo.columns.sick'),
    position: 4,
    width_ratio: 1,
    board_id: 'demo-board',
    x_position: 1450,
    y_position: 50,
    width: 300,
    height: 600,
    header_height: 60,
    content_padding_top: 0,
    content_padding_right: 0,
    content_padding_bottom: 0,
    content_padding_left: 0,
    glow_type: 'red',
    column_type: 'sick_leave'
  }, {
    id: 'col-5',
    name: t('demo.columns.vacation'),
    position: 5,
    width_ratio: 1,
    board_id: 'demo-board',
    x_position: 1790,
    y_position: 50,
    width: 300,
    height: 600,
    header_height: 60,
    content_padding_top: 0,
    content_padding_right: 0,
    content_padding_bottom: 0,
    content_padding_left: 0,
    glow_type: 'blue',
    column_type: 'vacation'
  }, {
    id: 'col-6',
    name: t('demo.columns.completed'),
    position: 6,
    width_ratio: 1,
    board_id: 'demo-board',
    x_position: 2130,
    y_position: 50,
    width: 300,
    height: 600,
    header_height: 60,
    content_padding_top: 0,
    content_padding_right: 0,
    content_padding_bottom: 0,
    content_padding_left: 0,
    glow_type: 'green',
    column_type: 'regular'
  }];
  const DEMO_MEMBERS: Assignee[] = [{
    user_id: 'user-1',
    full_name: 'Jan de Vries',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jan'
  }, {
    user_id: 'user-2',
    full_name: 'Sophie Bakker',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie'
  }, {
    user_id: 'user-3',
    full_name: 'Tom Jansen',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom'
  }, {
    user_id: 'user-4',
    full_name: 'Lisa Vermeer',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa'
  }, {
    user_id: 'user-5',
    full_name: 'Mark Hendriks',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark'
  }, {
    user_id: 'user-6',
    full_name: 'Emma van Dam',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'
  }, {
    user_id: 'user-7',
    full_name: 'Bas Peters',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bas'
  }, {
    user_id: 'user-8',
    full_name: 'Anna de Groot',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna'
  }, {
    user_id: 'user-9',
    full_name: 'Pieter Smit',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pieter'
  }, {
    user_id: 'user-10',
    full_name: 'Maria van Dijk',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'
  }];
  const DEMO_TASKS: Task[] = [
  // Belangrijke mededelingen
  {
    id: 'task-0-1',
    column_id: 'col-0',
    title: t('demo.tasks.announcement1'),
    description: t('demo.tasks.announcement1Desc'),
    priority: 'high',
    position: 0,
    due_date: null,
    assignees: []
  }, {
    id: 'task-0-2',
    column_id: 'col-0',
    title: t('demo.tasks.announcement2'),
    description: t('demo.tasks.announcement2Desc'),
    priority: 'medium',
    position: 1,
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: []
  }, {
    id: 'task-0-3',
    column_id: 'col-0',
    title: t('demo.tasks.announcement3'),
    description: t('demo.tasks.announcement3Desc'),
    priority: 'medium',
    position: 2,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: []
  }, {
    id: 'task-1',
    column_id: 'col-1',
    title: t('demo.tasks.task1'),
    description: t('demo.tasks.task1Desc'),
    priority: 'high',
    position: 0,
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: [DEMO_MEMBERS[0]]
  }, {
    id: 'task-2',
    column_id: 'col-1',
    title: t('demo.tasks.task2'),
    description: null,
    priority: 'medium',
    position: 1,
    due_date: null,
    assignees: [DEMO_MEMBERS[1]]
  }, {
    id: 'task-3',
    column_id: 'col-1',
    title: t('demo.tasks.task3'),
    description: t('demo.tasks.task3Desc'),
    priority: 'low',
    position: 2,
    due_date: null,
    assignees: []
  }, {
    id: 'task-4',
    column_id: 'col-1',
    title: t('demo.tasks.task4'),
    description: null,
    priority: 'high',
    position: 3,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: [DEMO_MEMBERS[2]]
  }, {
    id: 'task-5',
    column_id: 'col-1',
    title: t('demo.tasks.task5'),
    description: null,
    priority: 'medium',
    position: 4,
    due_date: null,
    assignees: []
  }, {
    id: 'task-6',
    column_id: 'col-2',
    title: t('demo.tasks.task6'),
    description: t('demo.tasks.task6Desc'),
    priority: 'high',
    position: 0,
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: [DEMO_MEMBERS[1], DEMO_MEMBERS[2]]
  }, {
    id: 'task-7',
    column_id: 'col-2',
    title: t('demo.tasks.task7'),
    description: null,
    priority: 'medium',
    position: 1,
    due_date: null,
    assignees: [DEMO_MEMBERS[0]]
  }, {
    id: 'task-8',
    column_id: 'col-2',
    title: t('demo.tasks.task8'),
    description: t('demo.tasks.task8Desc'),
    priority: 'medium',
    position: 2,
    due_date: null,
    assignees: [DEMO_MEMBERS[3]]
  }, {
    id: 'task-9',
    column_id: 'col-2',
    title: t('demo.tasks.task9'),
    description: null,
    priority: 'low',
    position: 3,
    due_date: null,
    assignees: []
  }, {
    id: 'task-10',
    column_id: 'col-2',
    title: t('demo.tasks.task10'),
    description: null,
    priority: 'high',
    position: 4,
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: [DEMO_MEMBERS[4]]
  }, {
    id: 'task-11',
    column_id: 'col-3',
    title: t('demo.tasks.task11'),
    description: t('demo.tasks.task11Desc'),
    priority: 'high',
    position: 0,
    due_date: null,
    assignees: [DEMO_MEMBERS[2]]
  }, {
    id: 'task-12',
    column_id: 'col-3',
    title: t('demo.tasks.task12'),
    description: null,
    priority: 'medium',
    position: 1,
    due_date: null,
    assignees: [DEMO_MEMBERS[0]]
  }, {
    id: 'task-13',
    column_id: 'col-3',
    title: t('demo.tasks.task13'),
    description: null,
    priority: 'low',
    position: 2,
    due_date: null,
    assignees: []
  }, {
    id: 'task-14',
    column_id: 'col-3',
    title: t('demo.tasks.task14'),
    description: null,
    priority: 'medium',
    position: 3,
    due_date: null,
    assignees: [DEMO_MEMBERS[3]]
  }, {
    id: 'task-15',
    column_id: 'col-4',
    title: t('demo.tasks.sick1'),
    description: t('demo.tasks.sick1Desc'),
    priority: null,
    position: 0,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: []
  }, {
    id: 'task-16',
    column_id: 'col-4',
    title: t('demo.tasks.sick2'),
    description: t('demo.tasks.sick2Desc'),
    priority: null,
    position: 1,
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: []
  }, {
    id: 'task-17',
    column_id: 'col-5',
    title: t('demo.tasks.vacation1'),
    description: t('demo.tasks.vacation1Desc'),
    priority: null,
    position: 0,
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: []
  }, {
    id: 'task-18',
    column_id: 'col-5',
    title: t('demo.tasks.vacation2'),
    description: t('demo.tasks.vacation2Desc'),
    priority: null,
    position: 1,
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: []
  }, {
    id: 'task-19',
    column_id: 'col-6',
    title: t('demo.tasks.completed1'),
    description: null,
    priority: 'high',
    position: 0,
    due_date: null,
    assignees: [DEMO_MEMBERS[1]]
  }, {
    id: 'task-20',
    column_id: 'col-6',
    title: t('demo.tasks.completed2'),
    description: null,
    priority: 'high',
    position: 1,
    due_date: null,
    assignees: [DEMO_MEMBERS[0], DEMO_MEMBERS[2]]
  }, {
    id: 'task-21',
    column_id: 'col-6',
    title: t('demo.tasks.completed3'),
    description: null,
    priority: 'medium',
    position: 2,
    due_date: null,
    assignees: [DEMO_MEMBERS[3]]
  }, {
    id: 'task-22',
    column_id: 'col-6',
    title: t('demo.tasks.completed4'),
    description: null,
    priority: 'medium',
    position: 3,
    due_date: null,
    assignees: []
  }, {
    id: 'task-23',
    column_id: 'col-6',
    title: t('demo.tasks.completed5'),
    description: null,
    priority: 'low',
    position: 4,
    due_date: null,
    assignees: [DEMO_MEMBERS[4]]
  }];
  return {
    DEMO_ORG,
    DEMO_BOARD,
    DEMO_COLUMNS,
    DEMO_MEMBERS,
    DEMO_TASKS
  };
};
const Board = () => {
  const {
    t,
    i18n
  } = useTranslation();
  const isMobile = useIsMobile();
  const { requestPermission } = useDesktopNotifications();
  
  const taskSchema = z.object({
    title: z.string().trim().min(1, t('board.titleRequired')).max(200, t('board.titleMaxLength')),
    description: z.string().trim().optional()
  });

  // Touch gesture state for mobile/tablet
  const [touchState, setTouchState] = useState({
    initialDistance: 0,
    initialZoom: 1,
    lastTouch: {
      x: 0,
      y: 0
    },
    isPinching: false,
    isPanning: false
  });
  const [panPosition, setPanPosition] = useState({
    x: 0,
    y: 0
  });
  const {
    organizationId: rawOrgId
  } = useParams();
  const navigate = useNavigate();

  // Redirect demo to real UUID
  const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000000';
  const organizationId = rawOrgId === 'demo' ? DEMO_ORG_ID : rawOrgId;

  // Detect demo mode
  const isDemo = organizationId === DEMO_ORG_ID;
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [board, setBoard] = useState<any>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [widgets, setWidgets] = useState<any[]>([]);

  // Demo mode: store initial data for reset on refresh
  const [demoInitialData, setDemoInitialData] = useState<{
    columns: Column[];
    tasks: Task[];
    board: any;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | null>("medium");
  const [newTaskHours, setNewTaskHours] = useState<string>("8");
  const [newTaskEndDate, setNewTaskEndDate] = useState<Date | undefined>(undefined);
  const [newTaskStartDate, setNewTaskStartDate] = useState<Date>(new Date());
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>(undefined);
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
  const [newTaskChecklistItems, setNewTaskChecklistItems] = useState<NewChecklistItem[]>([]);
  const [newTaskRecurrencePattern, setNewTaskRecurrencePattern] = useState<string | null>(null);
  const [newTaskRecurrenceInterval, setNewTaskRecurrenceInterval] = useState(1);
  const [newTaskRecurrenceEndDate, setNewTaskRecurrenceEndDate] = useState<Date | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskEditMode, setIsTaskEditMode] = useState(false);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskDueDate, setEditTaskDueDate] = useState<Date | undefined>(undefined);
  const [editTaskPriority, setEditTaskPriority] = useState<"low" | "medium" | "high" | null>("medium");
  const [orgMembers, setOrgMembers] = useState<Assignee[]>([]);
  const [manualPersonNames, setManualPersonNames] = useState<string[]>([]);
  const [editTaskAssignees, setEditTaskAssignees] = useState<string[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [draggedOverTaskIndex, setDraggedOverTaskIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPendingDrag, setIsPendingDrag] = useState(false);
  const [taskDragPosition, setTaskDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [taskDragOffset, setTaskDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [taskDragVelocity, setTaskDragVelocity] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [taskDragWidth, setTaskDragWidth] = useState<number>(280);
  const lastDragPositionRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartPositionRef = useRef<{ x: number; y: number } | null>(null);
  const pendingDragTaskRef = useRef<Task | null>(null);
  const draggedTaskColumnRef = useRef<string | null>(null);
  const draggedTaskGlowRef = useRef<GlowType | undefined>(undefined);
  const DRAG_THRESHOLD = 5; // pixels before drag activates
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
  const [clearCompletedColumnId, setClearCompletedColumnId] = useState<string | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<any | null>(null);
  const [widgetDragOffset, setWidgetDragOffset] = useState({
    x: 0,
    y: 0
  });
  const [widgetDragPreview, setWidgetDragPreview] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [resizingWidget, setResizingWidget] = useState(false);
  const [widgetResizeHandle, setWidgetResizeHandle] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [canCustomizeBackground, setCanCustomizeBackground] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(isMobile ? 0.33 : 0.75);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportSelectedMembers, setExportSelectedMembers] = useState<string[]>([]);
  const [exportEmails, setExportEmails] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [exportIncludeAttachments, setExportIncludeAttachments] = useState(true);
  const [exportingTask, setExportingTask] = useState(false);
  const [orgMembersWithEmails, setOrgMembersWithEmails] = useState<Array<{
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
  }>>([]);

  // Filter state
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<"low" | "medium" | "high" | null>(null);
  const [filterDeadline, setFilterDeadline] = useState<"overdue" | "today" | "this-week" | "no-deadline" | null>(null);
  const [filterKeyword, setFilterKeyword] = useState<string>("");
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // Mobile column carousel state
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);
  const [mobileSortBy, setMobileSortBy] = useState<"position" | "deadline" | "priority" | "newest" | "oldest">("position");
  const mobileMainRef = useRef<HTMLElement>(null);
  
  // Auto scroll to top when changing columns on mobile
  useEffect(() => {
    if (isMobile && mobileMainRef.current) {
      // Wait for transition to complete before scrolling
      setTimeout(() => {
        mobileMainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 120);
    }
  }, [currentColumnIndex, isMobile]);
  
  // Mobile swipe state
  const [swipeStartX, setSwipeStartX] = useState<number>(0);
  const [swipeStartY, setSwipeStartY] = useState<number>(0);
  const [swiping, setSwiping] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const GRID_SIZE = 20;
  const SNAP_THRESHOLD = 15;
  const SCALE_FACTOR = zoomLevel; // UI scale factor (now dynamic)
  const BOARD_SCALE = isMobile ? 1 : SCALE_FACTOR;

  // Get date-fns locale based on current language
  const getDateLocale = (): Locale => {
    switch (i18n.language) {
      case 'nl':
        return nl;
      case 'en':
        return enUS;
      case 'es':
        return es;
      case 'de':
        return de;
      default:
        return nl;
    }
  };

  // Sort tasks function for mobile
  const sortTasks = (tasks: Task[]) => {
    const sorted = [...tasks];
    switch (mobileSortBy) {
      case "deadline":
        return sorted.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2, null: 3 };
        return sorted.sort((a, b) => {
          const aPriority = a.priority || null;
          const bPriority = b.priority || null;
          return priorityOrder[aPriority] - priorityOrder[bPriority];
        });
      case "newest":
        return sorted.sort((a, b) => b.position - a.position);
      case "oldest":
        return sorted.sort((a, b) => a.position - b.position);
      case "position":
      default:
        return sorted.sort((a, b) => a.position - b.position);
    }
  };

  // Filter tasks function
  const filterTasks = (tasks: Task[]) => {
    return tasks.filter(task => {
      // Keyword filter - search in title and description
      if (filterKeyword.trim()) {
        const keyword = filterKeyword.toLowerCase().trim();
        const titleMatch = task.title.toLowerCase().includes(keyword);
        const descMatch = task.description?.toLowerCase().includes(keyword) || false;
        if (!titleMatch && !descMatch) return false;
      }
      if (filterAssignee) {
        if (filterAssignee === "unassigned") {
          if (task.assignees && task.assignees.length > 0) return false;
        } else {
          const hasAssignee = task.assignees?.some(a => a.user_id === filterAssignee);
          if (!hasAssignee) return false;
        }
      }
      if (filterPriority && task.priority !== filterPriority) {
        return false;
      }
      if (filterDeadline) {
        const today = new Date();
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        if (filterDeadline === "no-deadline" && task.due_date) return false;
        if (filterDeadline === "overdue" && (!dueDate || !isBefore(dueDate, today))) return false;
        if (filterDeadline === "today" && (!dueDate || dueDate.toDateString() !== today.toDateString())) return false;
        if (filterDeadline === "this-week") {
          const weekEnd = addDays(today, 7);
          if (!dueDate || dueDate < today || dueDate > weekEnd) return false;
        }
      }
      return true;
    });
  };

  // Update active filters count
  useEffect(() => {
    let count = 0;
    if (filterKeyword.trim()) count++;
    if (filterAssignee) count++;
    if (filterPriority) count++;
    if (filterDeadline) count++;
    setActiveFiltersCount(count);
  }, [filterKeyword, filterAssignee, filterPriority, filterDeadline]);
  const handleAddColumn = async () => {
    if (isDemo) {
      const visibleColumns = columns.filter(c => c.x_position < 1500);
      const maxX = visibleColumns.length > 0 ? Math.max(...visibleColumns.map(c => c.x_position + (c.width || 300))) : 40;
      const newX = maxX + 40;
      const newColumn: Column = {
        id: `demo-col-${Date.now()}`,
        board_id: board?.id,
        name: `${t('board.newColumn')} ${columns.length + 1}`,
        position: columns.length,
        width_ratio: 1,
        x_position: newX,
        y_position: 50,
        width: 300,
        height: 600,
        header_height: 60,
        content_padding_top: 0,
        content_padding_right: 0,
        content_padding_bottom: 0,
        content_padding_left: 0,
        glow_type: 'default',
        column_type: 'regular'
      };
      setColumns([...columns, newColumn]);
      toast.success(t('board.columnAdded') + ' (demo)');
      return;
    }
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
        name: `${t('board.newColumn')} ${columns.length + 1}`,
        position: columns.length,
        width_ratio: 1,
        x_position: newX,
        y_position: 50,
        width: 300,
        height: 600
      }).select().single();
      if (error) throw error;
      toast.success(t('board.columnAdded'));
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
  const handleBackgroundChange = async (gradient: string) => {
    if (!canCustomizeBackground && !isDemo) {
      toast.error('Upgrade naar Team of Business voor aangepaste achtergronden');
      return;
    }
    if (isDemo) {
      setSelectedBackground(gradient);
      setBackgroundImageUrl(null);
      toast.success(t('board.backgroundUpdated') + ' (demo)');
      return;
    }
    try {
      const {
        error
      } = await supabase.from("boards").update({
        background_gradient: gradient,
        background_image_url: null
      }).eq("id", board?.id);
      if (error) throw error;
      setSelectedBackground(gradient);
      setBackgroundImageUrl(null);
      toast.success(t('board.backgroundUpdated') || 'Achtergrond bijgewerkt');
    } catch (error: any) {
      toast.error("Fout bij bijwerken achtergrond: " + error.message);
    }
  };
  const handleBackgroundImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canCustomizeBackground && !isDemo) {
      toast.error('Upgrade naar Team of Business voor aangepaste achtergronden');
      return;
    }
    if (isDemo) {
      toast.info('Achtergrond upload uitgeschakeld in demo mode');
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Selecteer een afbeelding');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Afbeelding te groot (max 5MB)');
      return;
    }

    // Create preview URL and open crop editor
    const previewUrl = URL.createObjectURL(file);
    setPendingImageFile(file);
    setPendingImagePreview(previewUrl);
    setCropEditorOpen(true);

    // Reset the input so the same file can be selected again
    event.target.value = '';
  };
  const handleRemoveBackgroundImage = async () => {
    try {
      const {
        error
      } = await supabase.from("boards").update({
        background_image_url: 'default',
        background_gradient: 'from-background via-primary/5 to-accent/5',
        background_fit_mode: 'cover',
        background_position_x: 50,
        background_position_y: 50,
        background_scale: 100
      }).eq("id", board?.id);
      if (error) throw error;
      setBackgroundImageUrl(null);
      setSelectedBackground('from-background via-primary/5 to-accent/5');
      setBackgroundPositionX(50);
      setBackgroundPositionY(50);
      setBackgroundScale(100);
      setBackgroundFitMode('cover');
      toast.success(t('board.backgroundRemoved'));
    } catch (error: any) {
      toast.error("Fout bij verwijderen: " + error.message);
    }
  };
  const handleSetDefaultBackground = async () => {
    try {
      const {
        error
      } = await supabase.from("boards").update({
        background_image_url: 'default',
        background_gradient: 'from-background via-primary/5 to-accent/5',
        background_fit_mode: 'cover',
        background_position_x: 50,
        background_position_y: 50,
        background_scale: 100
      }).eq("id", board?.id);
      if (error) throw error;
      setBackgroundImageUrl(null);
      setSelectedBackground('from-background via-primary/5 to-accent/5');
      setBackgroundFitMode('cover');
      setBackgroundPositionX(50);
      setBackgroundPositionY(50);
      setBackgroundScale(100);
      toast.success(t('board.backgroundSetDefault'));
    } catch (error: any) {
      console.error("Error setting default background:", error);
      toast.error(t('board.backgroundSetDefaultError'));
    }
  };
  const handleApplyBackgroundCrop = async (positionX: number, positionY: number, scale: number, fitMode: 'scale' | 'cover') => {
    try {
      setUploadingBackground(true);

      // If we have a pending file, upload it first
      if (pendingImageFile) {
        const fileExt = pendingImageFile.name.split('.').pop();
        const fileName = `${board?.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        const {
          error: uploadError
        } = await supabase.storage.from('board-backgrounds').upload(filePath, pendingImageFile, {
          upsert: true
        });
        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('board-backgrounds').getPublicUrl(filePath);

        // Update board with image URL and crop settings
        const {
          error: updateError
        } = await supabase.from("boards").update({
          background_image_url: publicUrl,
          background_position_x: positionX,
          background_position_y: positionY,
          background_scale: scale,
          background_fit_mode: fitMode
        }).eq("id", board?.id);
        if (updateError) throw updateError;
        setBackgroundImageUrl(publicUrl);

        // Clean up
        if (pendingImagePreview) {
          URL.revokeObjectURL(pendingImagePreview);
        }
        setPendingImageFile(null);
        setPendingImagePreview(null);
      } else {
        // Just update crop settings for existing image
        const {
          error
        } = await supabase.from("boards").update({
          background_position_x: positionX,
          background_position_y: positionY,
          background_scale: scale,
          background_fit_mode: fitMode
        }).eq("id", board?.id);
        if (error) throw error;
      }
      setBackgroundPositionX(positionX);
      setBackgroundPositionY(positionY);
      setBackgroundScale(scale);
      setBackgroundFitMode(fitMode);
      setCropEditorOpen(false);
      toast.success('Achtergrond opgeslagen');
    } catch (error: any) {
      toast.error("Fout bij opslaan: " + error.message);
    } finally {
      setUploadingBackground(false);
    }
  };
  const handleDeleteColumn = async () => {
    if (!deleteColumnId) return;
    if (isDemo) {
      const columnTasks = tasks.filter(t => t.column_id === deleteColumnId);
      if (columnTasks.length > 0) {
        const firstColumn = columns.find(c => c.id !== deleteColumnId);
        if (firstColumn) {
          const updatedTasks = tasks.map(task => task.column_id === deleteColumnId ? {
            ...task,
            column_id: firstColumn.id
          } : task);
          setTasks(updatedTasks);
        }
      }
      setColumns(columns.filter(c => c.id !== deleteColumnId));
      toast.success(t('board.columnDeleted') + ' (demo)');
      setDeleteColumnId(null);
      return;
    }
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
      toast.success(t('board.columnDeleted'));
      await fetchBoardData();
      setDeleteColumnId(null);
    } catch (error: any) {
      toast.error(t('board.deleteError') + error.message);
    }
  };
  
  // Delete all tasks in a completed column
  const handleClearCompletedTasks = async () => {
    if (!clearCompletedColumnId) return;
    
    const columnTasks = tasks.filter(t => t.column_id === clearCompletedColumnId);
    if (columnTasks.length === 0) {
      toast.info(t('board.noTasksToDelete'));
      setClearCompletedColumnId(null);
      return;
    }
    
    if (isDemo) {
      setTasks(tasks.filter(t => t.column_id !== clearCompletedColumnId));
      toast.success(t('board.tasksCleared') + ' (demo)');
      setClearCompletedColumnId(null);
      return;
    }
    
    try {
      const taskIds = columnTasks.map(t => t.id);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get column name for archive
      const colName = columns.find(c => c.id === clearCompletedColumnId)?.name || "Afgerond";

      // Fetch assignee names and labels for each task
      const { data: assigneeData } = await supabase.from("task_assignees").select("task_id, user_id").in("task_id", taskIds);
      const { data: labelData } = await supabase.from("task_labels").select("task_id, label").in("task_id", taskIds);
      const { data: timeData } = await supabase.from("time_entries").select("task_id, duration_minutes").in("task_id", taskIds);

      // Map assignee user_ids to names
      const assigneeUserIds = [...new Set((assigneeData || []).map(a => a.user_id))];
      const profileMap: Record<string, string> = {};
      if (assigneeUserIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", assigneeUserIds);
        (profiles || []).forEach(p => { profileMap[p.user_id] = p.full_name; });
      }

      // Build archive records
      const archiveRecords = columnTasks.map(task => {
        const taskAssignees = (assigneeData || []).filter(a => a.task_id === task.id).map(a => profileMap[a.user_id] || "Onbekend");
        const taskLabels = (labelData || []).filter(l => l.task_id === task.id).map(l => l.label);
        const totalMinutes = (timeData || []).filter(te => te.task_id === task.id).reduce((sum, te) => sum + (te.duration_minutes || 0), 0);
        return {
          original_task_id: task.id,
          board_id: board?.id || "",
          column_name: colName,
          title: task.title,
          description: task.description,
          priority: task.priority,
          due_date: task.due_date,
          assignee_names: taskAssignees.length > 0 ? taskAssignees : null,
          labels: taskLabels.length > 0 ? taskLabels : null,
          time_logged_minutes: totalMinutes,
          archived_by: session.user.id,
          organization_id: organizationId,
        };
      });

      // Insert archive records
      await supabase.from("archived_tasks").insert(archiveRecords as any);

      // Delete related records first
      await supabase.from('task_assignees').delete().in('task_id', taskIds);
      await supabase.from('task_labels').delete().in('task_id', taskIds);
      await supabase.from('task_attachments').delete().in('task_id', taskIds);
      await supabase.from('task_reminders').delete().in('task_id', taskIds);
      await supabase.from('comments').delete().in('task_id', taskIds);
      await supabase.from('time_entries').delete().in('task_id', taskIds);
      await supabase.from('task_dependencies').delete().in('task_id', taskIds);
      
      // Delete the tasks
      const { error } = await supabase.from('tasks').delete().in('id', taskIds);
      if (error) throw error;
      
      toast.success(t('board.tasksCleared'));
      await fetchBoardData();
      setClearCompletedColumnId(null);
    } catch (error: any) {
      toast.error(t('board.deleteError') + error.message);
    }
  };
  const handleAddWidget = async (widgetType: "chat" | "notes" | "timer" | "calculator" | "quick-links" | "calendar" | "notifications" | "achievements") => {
    if (isDemo) {
      toast.info('Widgets uitgeschakeld in demo mode');
      return;
    }

    // Default afmetingen per widget type
    const defaultSizes = {
      chat: {
        width: 56,
        height: 56
      },
      notes: {
        width: 300,
        height: 400
      },
      timer: {
        width: 250,
        height: 250
      },
      calculator: {
        width: 250,
        height: 350
      },
      'quick-links': {
        width: 300,
        height: 400
      },
      calendar: {
        width: 320,
        height: 400
      },
      notifications: {
        width: 300,
        height: 450
      },
      achievements: {
        width: 300,
        height: 350
      }
    };
    const size = defaultSizes[widgetType];
    try {
      const {
        data,
        error
      } = await supabase.from('widgets').insert({
        board_id: board?.id,
        widget_type: widgetType,
        x_position: 100,
        y_position: 100,
        width: size.width,
        height: size.height,
        settings: {}
      }).select().single();
      if (error) throw error;
      setWidgets([...widgets, data]);
      toast.success('Widget toegevoegd!');
    } catch (error: any) {
      toast.error('Fout bij toevoegen widget: ' + error.message);
    }
  };
  const handleDeleteWidget = async (widgetId: string) => {
    if (isDemo) {
      toast.info('Widgets uitgeschakeld in demo mode');
      return;
    }
    try {
      const {
        error
      } = await supabase.from('widgets').delete().eq('id', widgetId);
      if (error) throw error;
      setWidgets(widgets.filter(w => w.id !== widgetId));
      toast.success('Widget verwijderd');
    } catch (error: any) {
      toast.error('Fout bij verwijderen widget: ' + error.message);
    }
  };
  const handleUpdateWidget = async (widgetId: string, updates: any) => {
    if (isDemo) return;
    try {
      const {
        error
      } = await supabase.from('widgets').update(updates).eq('id', widgetId);
      if (error) throw error;
      setWidgets(widgets.map(w => w.id === widgetId ? {
        ...w,
        ...updates
      } : w));
    } catch (error: any) {
      console.error('Error updating widget:', error);
    }
  };
  const handleWidgetDragStart = (e: React.DragEvent, widget: any) => {
    setDraggedWidget(widget);
    const rect = e.currentTarget.getBoundingClientRect();
    setWidgetDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };
  const handleWidgetDragEnd = () => {
    setDraggedWidget(null);
    setWidgetDragPreview(null);
    setSnapGuides(null);
  };
  useEffect(() => {
    if (isDemo) {
      // In demo mode, load demo data with translations
      const demoData = getDemoData(t);
      setOrganization(demoData.DEMO_ORG);
      setBoard({
        ...demoData.DEMO_BOARD,
        organization_id: DEMO_ORG_ID,
        background_gradient: 'from-blue-50 to-blue-100'
      });
      setColumns(demoData.DEMO_COLUMNS);
      setTasks(demoData.DEMO_TASKS);
      setOrgMembers(demoData.DEMO_MEMBERS);
      setSelectedBackground('from-blue-50 to-blue-100');

      // Load default background (landing page gradient)
      setBackgroundImageUrl(null);
      setSelectedBackground('from-background via-primary/5 to-accent/5');
      setBackgroundFitMode('cover');
      setBackgroundScale(100);
      setBackgroundPositionX(50);
      setBackgroundPositionY(50);
      setLoading(false);
      return;
    }
    checkAccess();
    fetchBoardData();
    fetchOrgMembers();
    fetchOrgMembersWithEmails();
    fetchManualPersonNames();
    fetchUserPlan();
    checkBackgroundPermission();
  }, [organizationId, isDemo, t]);
  const fetchOrgMembersWithEmails = async () => {
    if (!organizationId || isDemo) return;
    const {
      data,
      error
    } = await supabase.rpc('get_org_member_emails', {
      _org_id: organizationId
    });
    if (!error && data) {
      console.log('Fetched org members with emails:', data);
      setOrgMembersWithEmails(data);
    } else if (error) {
      console.error('Error fetching org members with emails:', error);
    }
  };
  const fetchUserPlan = async () => {
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) return;
      const {
        data,
        error
      } = await supabase.functions.invoke('get-subscription-status', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) throw error;
      if (data?.limits?.plan) {
        setUserPlan(data.limits.plan);
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
    }
  };
  const checkBackgroundPermission = async () => {
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) return;
      const {
        data,
        error
      } = await supabase.functions.invoke('check-background-permission');
      if (error) throw error;
      if (data) {
        setCanCustomizeBackground(data.canCustomize);
      }
    } catch (error) {
      console.error('Error checking background permission:', error);
    }
  };
  useEffect(() => {
    if (!board?.id || isDemo) return;
    console.log('🔌 Setting up realtime subscription for board:', board.id);
    const cleanup = setupRealtimeSubscriptions();
    return () => {
      console.log('🔌 Cleaning up realtime subscription');
      if (cleanup) cleanup();
    };
  }, [board?.id, isDemo]);
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

  // Load zoom level from localStorage, but force 0.33 on mobile
  useEffect(() => {
    if (isMobile) {
      setZoomLevel(0.33);
    } else {
      const savedZoom = localStorage.getItem('boardZoomLevel');
      if (savedZoom) {
        const parsedZoom = parseFloat(savedZoom);
        if (parsedZoom >= 0.5 && parsedZoom <= 1.0) {
          setZoomLevel(parsedZoom);
        }
      }
    }
  }, [isMobile]);

  // Save zoom level to localStorage
  useEffect(() => {
    localStorage.setItem('boardZoomLevel', zoomLevel.toString());
  }, [zoomLevel]);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          handleZoomReset();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomLevel]);

  // Touch gesture helpers
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  const getMidpoint = (touch1: React.Touch, touch2: React.Touch) => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  });

  // Mobile swipe handlers for column navigation
  const handleMobileSwipeStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setSwipeStartX(e.touches[0].clientX);
      setSwipeStartY(e.touches[0].clientY);
      setSwiping(true);
    }
  };

  const handleMobileSwipeMove = (e: React.TouchEvent) => {
    if (!swiping || e.touches.length !== 1) return;
    
    // Allow vertical scrolling but prevent default for horizontal swipes
    const deltaX = e.touches[0].clientX - swipeStartX;
    const deltaY = e.touches[0].clientY - swipeStartY;
    
    // If horizontal movement is dominant, prevent default to stop vertical scroll
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
    }
  };

  const handleMobileSwipeEnd = (e: React.TouchEvent) => {
    if (!swiping) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeStartX;
    const deltaY = touch.clientY - swipeStartY;
    
    // Check if horizontal swipe is dominant (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && currentColumnIndex > 0) {
        // Swipe right - go to previous column
        setIsTransitioning(true);
        setSlideDirection('right');
        setTimeout(() => {
          setCurrentColumnIndex(prev => Math.max(0, prev - 1));
          setTimeout(() => {
            setIsTransitioning(false);
            setSlideDirection(null);
          }, 30);
        }, 60);
      } else if (deltaX < 0 && currentColumnIndex < columns.length - 1) {
        // Swipe left - go to next column
        setIsTransitioning(true);
        setSlideDirection('left');
        setTimeout(() => {
          setCurrentColumnIndex(prev => Math.min(columns.length - 1, prev + 1));
          setTimeout(() => {
            setIsTransitioning(false);
            setSlideDirection(null);
          }, 30);
        }, 60);
      }
    }
    
    setSwiping(false);
  };

  // Touch event handlers for pan (1 finger) and pinch-to-zoom (2 fingers)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // 1 finger - start pan
      setTouchState({
        ...touchState,
        lastTouch: {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        },
        isPanning: true,
        isPinching: false
      });
    } else if (e.touches.length === 2) {
      // 2 fingers - start pinch
      const distance = getDistance(e.touches[0], e.touches[1]);
      setTouchState({
        initialDistance: distance,
        initialZoom: zoomLevel,
        lastTouch: {
          x: 0,
          y: 0
        },
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
        lastTouch: {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        }
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
        lastTouch: {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        },
        isPanning: true,
        isPinching: false
      });
    }
  };
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

    // Check for existing membership
    const {
      data: membership
    } = await supabase.from("memberships").select("*").eq("user_id", session.user.id).eq("organization_id", organizationId).single();

    // Auto-create membership for demo org if missing
    if (!membership && isDemo) {
      await supabase.from("memberships").insert({
        user_id: session.user.id,
        organization_id: organizationId,
        role: 'member'
      });
      return; // Membership created, continue
    }
    if (!membership) {
      toast.error(t('board.noAccess'));
      navigate("/dashboard");
    }
  };
  const fetchOrgMembers = async () => {
    try {
      const {
        data: memberships
      } = await supabase.from("memberships").select("user_id").eq("organization_id", organizationId);
      if (memberships && memberships.length > 0) {
        const userIds = memberships.map(m => m.user_id);
        const {
          data: profiles
        } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds);
        if (profiles) {
          setOrgMembers(profiles);
        }
      }
    } catch (error) {
      console.error(t('board.errorLoadingMembers'), error);
    }
  };
  const fetchManualPersonNames = async () => {
    if (!organizationId || isDemo) return;
    try {
      const [vacationRes, absenceRes, membershipsRes] = await Promise.all([
        supabase
          .from("person_vacation_settings")
          .select("person_name")
          .eq("organization_id", organizationId),
        supabase
          .from("absence_records")
          .select("person_name")
          .eq("organization_id", organizationId),
        supabase
          .from("memberships")
          .select("user_id")
          .eq("organization_id", organizationId),
      ]);
      const vacNames = vacationRes.data?.map(d => d.person_name) || [];
      const absNames = absenceRes.data?.map(d => d.person_name) || [];
      
      // Fetch profile names for org members independently to avoid race condition
      let memberNames: string[] = [];
      const memberIds = membershipsRes.data?.map(m => m.user_id) || [];
      if (memberIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("full_name")
          .in("user_id", memberIds);
        memberNames = profiles?.map(p => p.full_name) || [];
      }
      
      const manualOnly = [...new Set([...vacNames, ...absNames])].filter(n => !memberNames.includes(n));
      setManualPersonNames(manualOnly);
    } catch (error) {
      console.error("Error fetching manual person names:", error);
    }
  };
  const fetchBoardData = async () => {
    try {
      if (!organizationId) {
        navigate("/dashboard");
        return;
      }

      // Parallel fetch: organization and board
      const [orgResult, boardResult] = await Promise.all([supabase.from("organizations").select("*").eq("id", organizationId).single(), supabase.from("boards").select("*").eq("organization_id", organizationId).single()]);
      setOrganization(orgResult.data);
      setBoard(boardResult.data);
      
      // Store as template for new organizations
      if (boardResult.data?.id) {
        localStorage.setItem('lastViewedBoardId', boardResult.data.id);
      }
      
      if (!boardResult.data) {
        setLoading(false);
        return;
      }

      // Set background gradient from board data
      if (boardResult.data.background_gradient) {
        setSelectedBackground(boardResult.data.background_gradient);
      }

      // Set background image from board data
      if (boardResult.data.background_image_url) {
        // Use landing page gradient for 'default' marker
        if (boardResult.data.background_image_url === 'default') {
          setBackgroundImageUrl(null);
          setSelectedBackground('from-background via-primary/5 to-accent/5');
        } else {
          setBackgroundImageUrl(boardResult.data.background_image_url);
          setBackgroundPositionX(boardResult.data.background_position_x ?? 50);
          setBackgroundPositionY(boardResult.data.background_position_y ?? 50);
          setBackgroundScale(boardResult.data.background_scale ?? 100);
          const fitModeValue = boardResult.data.background_fit_mode;
          setBackgroundFitMode(fitModeValue === 'cover' || fitModeValue === 'scale' ? fitModeValue : 'cover');
        }
      }

      // Fetch columns
      const {
        data: columnsData
      } = await supabase.from("columns").select("*").eq("board_id", boardResult.data.id).order("position");

      // Sort columns based on mobile_position for mobile view, position for desktop
      const sortedColumns = columnsData ? columnsData.sort((a, b) => {
        // For mobile, use mobile_position if available, otherwise fall back to position
        const posA = a.mobile_position ?? a.position;
        const posB = b.mobile_position ?? b.position;
        return posA - posB;
      }) : [];
      setColumns(sortedColumns);

      // Fetch widgets (excluding chat widgets which are now handled by FixedChatWidget)
      const {
        data: widgetsData
      } = await supabase.from("widgets").select("*").eq("board_id", boardResult.data.id);
      setWidgets((widgetsData || []).filter(w => w.widget_type !== 'chat'));
      if (columnsData && columnsData.length > 0) {
        const columnIds = columnsData.map(c => c.id);

        // Fetch tasks
        const {
          data: tasksData
        } = await supabase.from("tasks").select("*").in("column_id", columnIds).order("position");
        console.log('📋 Opgehaalde taken:', tasksData?.length, 'taken');
        console.log('📋 Kolom IDs:', columnIds);
        if (tasksData && tasksData.length > 0) {
          const absenceColumns = new Map(
            (columnsData || [])
              .filter(c => c.column_type === 'sick_leave' || c.column_type === 'vacation')
              .map(c => [c.id, c.column_type])
          );

          const absenceTaskCandidates = tasksData.filter(task => absenceColumns.has(task.column_id));
          let hiddenAbsenceTaskIds = new Set<string>();

          if (absenceTaskCandidates.length > 0) {
            const personNames = [...new Set(absenceTaskCandidates.map(task => task.title))];
            const { data: absenceRecords } = await supabase
              .from("absence_records")
              .select("id, person_name, absence_type, start_date, end_date")
              .eq("organization_id", organizationId)
              .in("person_name", personNames);

            const today = format(new Date(), "yyyy-MM-dd");
            hiddenAbsenceTaskIds = new Set(
              absenceTaskCandidates
                .filter(task => {
                  const columnType = absenceColumns.get(task.column_id);
                  const personRecords = absenceRecords?.filter(record =>
                    record.person_name === task.title &&
                    record.absence_type === columnType
                  ) || [];
                  // Hide task only if there are records but NONE are active (all have end_date <= today)
                  if (personRecords.length === 0) return false;
                  const hasActiveRecord = personRecords.some(record =>
                    !record.end_date || record.end_date > today
                  );
                  return !hasActiveRecord;
                })
                .map(task => task.id)
            );
          }

          const visibleTasksData = tasksData.filter(task => !hiddenAbsenceTaskIds.has(task.id));
          const taskIds = visibleTasksData.map(t => t.id);

          // Parallel fetch: assignees and profiles
          const [assigneesResult, allProfilesResult] = await Promise.all([supabase.from("task_assignees").select("task_id, user_id").in("task_id", taskIds),
          // Fetch all org member profiles at once
          supabase.from("memberships").select("user_id").eq("organization_id", organizationId).then(async ({
            data: memberships
          }) => {
            if (!memberships || memberships.length === 0) return {
              data: []
            };
            const userIds = memberships.map(m => m.user_id);
            return supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds);
          })]);

          // Map assignees to tasks
          const tasksWithAssignees = visibleTasksData.map(task => ({
            ...task,
            assignees: assigneesResult.data?.filter(a => a.task_id === task.id).map(a => {
              const profile = allProfilesResult.data?.find(p => p.user_id === a.user_id);
              return {
                user_id: a.user_id,
                full_name: profile?.full_name || t('board.unknown'),
                avatar_url: profile?.avatar_url || null
              };
            }) || []
          }));
          setTasks(tasksWithAssignees);
        } else {
          setTasks([]);
        }
      }
    } catch (error: any) {
      console.error('Board fetch error:', error);
      toast.error(t('board.errorLoadingBoard'));
    } finally {
      setLoading(false);
    }
  };
  const setupRealtimeSubscriptions = () => {
    if (isDemo || !board?.id) return;
    console.log('🔌 Setting up realtime subscriptions for board:', board.id);

    // Get the current session and set auth for realtime
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session?.access_token) {
        console.log('🔐 Setting realtime auth token');
        supabase.realtime.setAuth(session.access_token);
      }
    });

    // Use a unique channel name with timestamp to avoid conflicts
    const channelName = `board-changes-${board.id}-${Date.now()}`;
    const channel = supabase.channel(channelName).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "columns",
      filter: `board_id=eq.${board.id}`
    }, payload => {
      console.log('🔔 Column change detected:', payload.eventType);
      fetchBoardData();
    }).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "tasks"
    }, payload => {
      console.log('🔔 Task change detected:', payload.eventType);
      // Always refresh - fetchBoardData will only fetch tasks for this board's columns
      fetchBoardData();
    }).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "widgets",
      filter: `board_id=eq.${board.id}`
    }, payload => {
      console.log('Widget change detected:', payload);
      fetchBoardData();
    }).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "task_assignees"
    }, payload => {
      console.log('🔔 Task assignee change detected:', payload.eventType);
      // Always refresh - the query will filter correctly
      fetchBoardData();
    }).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "profiles"
    }, payload => {
      console.log('🔔 Profile change detected:', payload.eventType);
      // Always refresh both - they're cheap queries
      fetchOrgMembers();
      fetchBoardData();
    }).subscribe((status, err) => {
      console.log('🔌 Realtime subscription status:', status);
      if (err) {
        console.error('🔌 Realtime subscription error:', err);
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to realtime updates');
      }
    });
    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  };
  const getLocaleString = () => {
    const langMap: {
      [key: string]: string;
    } = {
      'nl': 'nl-NL',
      'en': 'en-US',
      'es': 'es-ES',
      'de': 'de-DE'
    };
    return langMap[i18n.language] || 'nl-NL';
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(getLocaleString(), {
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(getLocaleString(), {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  };
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return t('board.priorityHigh');
      case "medium":
        return t('board.priorityMedium');
      case "low":
        return t('board.priorityLow');
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
  const getPriorityBadge = (priority: "low" | "medium" | "high" | null) => {
    if (!priority) return null;
    const config = {
      high: {
        label: t('board.priorityHigh'),
        color: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]"
      },
      medium: {
        label: t('board.priorityMedium'),
        color: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
      },
      low: {
        label: t('board.priorityLow'),
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
    setIsTaskEditMode(false); // Start in view mode
  };

  const handleOpenTaskFromNotification = async (taskId: string) => {
    // First check if task is already loaded
    const existingTask = tasks.find(t => t.id === taskId);
    if (existingTask) {
      openEditDialog(existingTask);
      return;
    }

    // Fetch task from database
    const { data: taskData, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (error || !taskData) {
      toast.error("Kon taak niet vinden");
      return;
    }

    // Fetch assignees for task
    const { data: assigneesData } = await supabase
      .from("task_assignees")
      .select(`
        user_id,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq("task_id", taskId);

    const task: Task = {
      id: taskData.id,
      column_id: taskData.column_id,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      position: taskData.position,
      due_date: taskData.due_date,
      assignees: assigneesData?.map((a: any) => ({
        user_id: a.user_id,
        full_name: a.profiles?.full_name || "Unknown",
        avatar_url: a.profiles?.avatar_url,
      })) || [],
    };

    openEditDialog(task);
  };
  const handleAddAssignee = async (userId: string) => {
    if (!editingTask) return;
    if (isDemo) {
      setEditTaskAssignees([...editTaskAssignees, userId]);
      const updatedTasks = tasks.map(task => {
        if (task.id === editingTask.id) {
          const assignee = orgMembers.find(m => m.user_id === userId);
          const newAssignees = assignee ? [...(task.assignees || []), assignee] : task.assignees;
          return {
            ...task,
            assignees: newAssignees
          };
        }
        return task;
      });
      setTasks(updatedTasks);
      toast.success(t('board.assigneeAdded') + ' (demo)');
      return;
    }
    try {
      console.log('Adding assignee:', {
        task_id: editingTask.id,
        user_id: userId
      });
      const {
        error
      } = await supabase.from("task_assignees").insert({
        task_id: editingTask.id,
        user_id: userId
      });
      if (error) {
        console.error('Error inserting assignee:', error);
        throw error;
      }
      console.log('Assignee added successfully');
      setEditTaskAssignees([...editTaskAssignees, userId]);
      await fetchBoardData();
      toast.success(t('board.assigneeAdded'));
    } catch (error) {
      console.error('Failed to add assignee:', error);
      toast.error(t('board.errorAddingAssignee'));
    }
  };
  const handleRemoveAssignee = async (userId: string) => {
    if (!editingTask) return;
    if (isDemo) {
      setEditTaskAssignees(editTaskAssignees.filter(id => id !== userId));
      const updatedTasks = tasks.map(task => {
        if (task.id === editingTask.id) {
          return {
            ...task,
            assignees: (task.assignees || []).filter(a => a.user_id !== userId)
          };
        }
        return task;
      });
      setTasks(updatedTasks);
      toast.success(t('board.assigneeRemoved') + ' (demo)');
      return;
    }
    try {
      const {
        error
      } = await supabase.from("task_assignees").delete().eq("task_id", editingTask.id).eq("user_id", userId);
      if (error) throw error;
      setEditTaskAssignees(editTaskAssignees.filter(id => id !== userId));
      await fetchBoardData();
    } catch (error) {
      toast.error(t('board.errorRemovingAssignee'));
    }
  };
  const handleEditTask = async () => {
    if (!editingTask) return;
    const validation = taskSchema.safeParse({
      title: editTaskTitle,
      description: editTaskDescription
    });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    if (isDemo) {
      const updatedTasks = tasks.map(task => {
        if (task.id === editingTask.id) {
          return {
            ...task,
            title: validation.data.title,
            description: validation.data.description || null,
            due_date: editTaskDueDate ? editTaskDueDate.toISOString() : null,
            priority: editTaskPriority
          };
        }
        return task;
      });
      setTasks(updatedTasks);
      toast.success(t('board.taskUpdated') + ' (demo)');
      setEditingTask(null);
      return;
    }
    try {
      const {
        error
      } = await supabase.from("tasks").update({
        title: validation.data.title,
        description: validation.data.description || null,
        due_date: editTaskDueDate ? editTaskDueDate.toISOString() : null,
        priority: editTaskPriority
      }).eq("id", editingTask.id);
      if (error) throw error;
      toast.success(t('board.taskUpdated'));
      setEditingTask(null);
      await fetchBoardData();
    } catch (error: any) {
      toast.error(t('board.errorUpdatingTask'));
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
  const handleExportTask = async () => {
    if (!editingTask) return;

    // Parse external emails
    const emails = exportEmails.split(',').map(e => e.trim()).filter(e => e);

    // Validate external emails if provided
    if (emails.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter(e => !emailRegex.test(e));
      if (invalidEmails.length > 0) {
        toast.error(t('board.exportInvalidEmails'));
        return;
      }
    }

    // Check total recipients
    const totalRecipients = exportSelectedMembers.length + emails.length;
    if (totalRecipients === 0) {
      toast.error(t('board.exportNoRecipients'));
      return;
    }
    if (totalRecipients > 10) {
      toast.error(t('board.exportTooManyEmails'));
      return;
    }
    setExportingTask(true);
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      const {
        data,
        error
      } = await supabase.functions.invoke('export-task-email', {
        body: {
          taskId: editingTask.id,
          memberUserIds: exportSelectedMembers,
          recipientEmails: emails,
          personalMessage: exportMessage || undefined,
          includeAttachments: exportIncludeAttachments,
          language: i18n.language
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to export task');
      }
      
      // Log export to task history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get recipient names for history
        const recipientNames: string[] = [];
        for (const userId of exportSelectedMembers) {
          const member = orgMembers.find(m => m.user_id === userId);
          if (member) recipientNames.push(member.full_name);
        }
        recipientNames.push(...emails);
        
        await supabase.from('task_history').insert({
          task_id: editingTask.id,
          user_id: user.id,
          action: 'exported',
          changes: {
            recipients: recipientNames,
            include_attachments: exportIncludeAttachments
          }
        });
      }
      
      toast.success(t('board.exportSuccess'));
      setExportDialogOpen(false);
      setExportSelectedMembers([]);
      setExportEmails("");
      setExportMessage("");
      setExportIncludeAttachments(true);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(t('board.exportError') + ': ' + (error.message || 'Unknown error'));
    } finally {
      setExportingTask(false);
    }
  };
  const getColumnTasks = (columnId: string) => {
    const columnTasks = tasks.filter(task => task.column_id === columnId);
    console.log(`📋 Kolom ${columnId}: ${columnTasks.length} taken`);
    return columnTasks;
  };

  // Update active filters count
  useEffect(() => {
    let count = 0;
    if (filterKeyword.trim()) count++;
    if (filterAssignee) count++;
    if (filterPriority) count++;
    if (filterDeadline) count++;
    setActiveFiltersCount(count);
  }, [filterKeyword, filterAssignee, filterPriority, filterDeadline]);
  const handleClearCompleted = async () => {
    const completedColumn = columns.find(col => col.name === t('board.completedColumn'));
    if (!completedColumn) return;
    const completedTasks = tasks.filter(task => task.column_id === completedColumn.id);
    if (completedTasks.length === 0) {
      toast.error(t('board.noCompletedTasks'));
      return;
    }
    try {
      const {
        error
      } = await supabase.from("tasks").delete().eq("column_id", completedColumn.id);
      if (error) throw error;
      toast.success(t('board.completedTasksDeleted', {
        count: completedTasks.length
      }));
      await fetchBoardData();
    } catch (error: any) {
      toast.error(t('board.errorDeletingTasks'));
    }
  };
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(1.0, prev + 0.05));
  };
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(0.5, prev - 0.05));
  };
  const handleZoomReset = () => {
    setZoomLevel(0.75);
  };
  const handleAddTask = async (columnId: string) => {
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
      toast.error(t('board.columnNotFound'));
      return;
    }
    if (isDemo) {
      const maxPosition = tasks.filter(t => t.column_id === column.id).reduce((max, t) => Math.max(max, t.position), -1);
      const demoAssignees = newTaskAssignees.map(userId => {
        const member = orgMembers.find(m => m.user_id === userId);
        return member ? { user_id: userId, full_name: member.full_name, avatar_url: member.avatar_url } : null;
      }).filter(Boolean);
      const newTask: Task = {
        id: `demo-task-${Date.now()}`,
        column_id: column.id,
        title: validation.data.title,
        description: validation.data.description || null,
        priority: newTaskPriority,
        due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null,
        position: maxPosition + 1,
        assignees: demoAssignees as any[]
      };
      setTasks([...tasks, newTask]);
      toast.success(t('board.taskAdded') + ' (demo)');
      setOpenDialog(null);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("medium");
      setNewTaskDueDate(undefined);
      setNewTaskAssignees([]);
      setNewTaskChecklistItems([]);
      return;
    }
    try {
      // For sick_leave/vacation columns: if end_date is set, only create absence_record, no board task
      const isAbsenceColumn = column.column_type === 'sick_leave' || column.column_type === 'vacation';
      const endDate = newTaskEndDate ? format(newTaskEndDate, "yyyy-MM-dd") : null;
      const startDate = format(newTaskStartDate, "yyyy-MM-dd");
      const isPastAbsence = isAbsenceColumn && endDate;

      if (isPastAbsence && organizationId) {
        // Only create absence_record, no task on the board
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const matchedMember = orgMembers.find(m => m.full_name === validation.data.title);
          const isSingleDayVacation = endDate === startDate;
          await supabase.from("absence_records").insert({
            organization_id: organizationId,
            person_name: validation.data.title,
            user_id: matchedMember?.user_id || null,
            absence_type: column.column_type,
            start_date: startDate,
            end_date: endDate,
            notes: validation.data.description || null,
            created_by: session.user.id,
            hours: column.column_type === 'vacation' && isSingleDayVacation ? (parseFloat(newTaskHours) || null) : null,
          } as any);
        }
        toast.success(isAbsenceColumn && column.column_type === 'sick_leave' ? 'Ziekteregistratie toegevoegd' : 'Verlofregistratie toegevoegd');
        setOpenDialog(null);
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskPriority("medium");
        setNewTaskDueDate(undefined);
        setNewTaskAssignees([]);
        setNewTaskChecklistItems([]);
        setNewTaskHours("8");
        setNewTaskEndDate(undefined);
        setNewTaskStartDate(new Date());
        setNewTaskRecurrencePattern(null);
        setNewTaskRecurrenceInterval(1);
        setNewTaskRecurrenceEndDate(undefined);
        fetchManualPersonNames();
        return;
      }

      const maxPosition = tasks.filter(t => t.column_id === column.id).reduce((max, t) => Math.max(max, t.position), -1);
      const { data: newTask, error } = await supabase.from("tasks").insert({
        column_id: column.id,
        title: validation.data.title,
        description: validation.data.description || null,
        priority: newTaskPriority,
        due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null,
        position: maxPosition + 1,
        recurrence_pattern: newTaskRecurrencePattern,
        recurrence_interval: newTaskRecurrencePattern ? newTaskRecurrenceInterval : 1,
        recurrence_end_date: newTaskRecurrenceEndDate ? format(newTaskRecurrenceEndDate, "yyyy-MM-dd") : null,
        is_recurring_template: !!newTaskRecurrencePattern,
      } as any).select().single();
      if (error) throw error;
      
      // Add assignees if any were selected
      if (newTaskAssignees.length > 0 && newTask) {
        const assigneeInserts = newTaskAssignees.map(userId => ({
          task_id: newTask.id,
          user_id: userId
        }));
        await supabase.from("task_assignees").insert(assigneeInserts);
      }
      
      // Add checklist items if any were created
      if (newTaskChecklistItems.length > 0 && newTask) {
        const checklistInserts = newTaskChecklistItems.map((item, index) => ({
          task_id: newTask.id,
          title: item.title,
          is_completed: item.is_completed,
          position: index
        }));
        await supabase.from("task_checklist_items").insert(checklistInserts);
      }

      // Auto-create absence_record for sick_leave/vacation columns
      if (isAbsenceColumn && newTask && organizationId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const matchedMember = orgMembers.find(m => m.full_name === validation.data.title);
          const isSingleDayVacation = !endDate || endDate === startDate;

          await supabase.from("absence_records").insert({
            organization_id: organizationId,
            person_name: validation.data.title,
            user_id: matchedMember?.user_id || null,
            absence_type: column.column_type,
            start_date: startDate,
            end_date: endDate,
            notes: validation.data.description || null,
            created_by: session.user.id,
            hours: column.column_type === 'vacation' && isSingleDayVacation ? (parseFloat(newTaskHours) || null) : null,
          } as any);
        }
      }
      
      toast.success(t('board.taskAdded'));
      setOpenDialog(null);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("medium");
      setNewTaskDueDate(undefined);
      setNewTaskAssignees([]);
      setNewTaskChecklistItems([]);
      setNewTaskHours("8");
      setNewTaskEndDate(undefined);
      setNewTaskStartDate(new Date());
      setNewTaskRecurrencePattern(null);
      setNewTaskRecurrenceInterval(1);
      setNewTaskRecurrenceEndDate(undefined);
      await fetchBoardData();
      fetchManualPersonNames();
    } catch (error: any) {
      toast.error(t('board.errorAddingTask'));
    }
  };
  const handleDeleteTask = async (taskId: string) => {
    if (isDemo) {
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success(t('board.taskDeleted') + ' (demo)');
      return;
    }
    try {
      // Check if task is in a sick/vacation column to also remove absence_record
      const task = tasks.find(t => t.id === taskId);
      const column = task ? columns.find(c => c.id === task.column_id) : null;
      if (task && column && (column.column_type === 'sick_leave' || column.column_type === 'vacation') && organizationId) {
        // Set end_date to today instead of deleting, so history is preserved
        await supabase.from("absence_records")
          .update({ end_date: format(new Date(), "yyyy-MM-dd") })
          .eq("organization_id", organizationId)
          .eq("person_name", task.title)
          .eq("absence_type", column.column_type)
          .is("end_date", null);
      }

      const {
        error
      } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
      toast.success(t('board.taskDeleted'));
      await fetchBoardData();
    } catch (error: any) {
      toast.error(t('board.errorDeletingTask'));
    }
  };
  const handleMarkDone = async (task: Task) => {
    const completedColumn = columns.find(col => col.name === t('board.completedColumn'));
    if (!completedColumn) {
      toast.error(t('board.completedColumnNotFound'));
      return;
    }
    if (isDemo) {
      const maxPosition = tasks.filter(t => t.column_id === completedColumn.id).reduce((max, t) => Math.max(max, t.position), -1);
      const updatedTasks = tasks.map(t => t.id === task.id ? {
        ...t,
        column_id: completedColumn.id,
        position: maxPosition + 1
      } : t);
      setTasks(updatedTasks);
      toast.success(t('board.taskCompleted') + ' (demo)');
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
      toast.success(t('board.taskCompleted'));
      await fetchBoardData();
    } catch (error: any) {
      toast.error(t('board.errorCompletingTask'));
    }
  };
  const handleChangePriority = async (taskId: string, newPriority: "low" | "medium" | "high") => {
    if (isDemo) {
      const updatedTasks = tasks.map(t => t.id === taskId ? {
        ...t,
        priority: newPriority
      } : t);
      setTasks(updatedTasks);
      toast.success(t('board.priorityChanged', {
        priority: getPriorityLabel(newPriority)
      }) + ' (demo)');
      return;
    }
    try {
      const {
        error
      } = await supabase.from("tasks").update({
        priority: newPriority
      }).eq("id", taskId);
      if (error) throw error;
      toast.success(t('board.priorityChanged', {
        priority: getPriorityLabel(newPriority)
      }));
      await fetchBoardData();
    } catch (error: any) {
      toast.error(t('board.errorChangingPriority'));
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
  // Custom pointer-based drag for tasks
  const handleTaskPointerDown = (e: React.PointerEvent, task: Task, columnGlowType?: GlowType) => {
    if (editMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Store initial drag info but don't start dragging yet
    setTaskDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setTaskDragWidth(rect.width / BOARD_SCALE);
    dragStartPositionRef.current = { x: e.clientX, y: e.clientY };
    lastDragPositionRef.current = { x: e.clientX, y: e.clientY };
    pendingDragTaskRef.current = task;
    draggedTaskColumnRef.current = task.column_id;
    draggedTaskGlowRef.current = columnGlowType;
    setIsPendingDrag(true);
    
    target.setPointerCapture(e.pointerId);
  };
  
  const handleTaskPointerMove = (e: React.PointerEvent) => {
    const newPos = { x: e.clientX, y: e.clientY };
    
    // Check if we're in pending drag state and should activate real drag
    if (isPendingDrag && !isDragging && pendingDragTaskRef.current && dragStartPositionRef.current) {
      const dx = newPos.x - dragStartPositionRef.current.x;
      const dy = newPos.y - dragStartPositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance >= DRAG_THRESHOLD) {
        // Activate real drag
        setDraggedTask(pendingDragTaskRef.current);
        setTaskDragPosition(newPos);
        setTaskDragVelocity({ x: 0, y: 0 });
        setIsDragging(true);
      }
      return;
    }
    
    if (!draggedTask || !isDragging) return;
    
    // Calculate velocity for rotation effect
    if (lastDragPositionRef.current) {
      const vx = newPos.x - lastDragPositionRef.current.x;
      setTaskDragVelocity({ x: vx, y: 0 });
    }
    lastDragPositionRef.current = newPos;
    
    setTaskDragPosition(newPos);
    
    // Detect which column we're over
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const columnElement = elements.find(el => el.hasAttribute('data-column-id'));
    if (columnElement) {
      const columnId = columnElement.getAttribute('data-column-id');
      if (columnId) {
        setDraggedOverColumn(columnId);
      }
      
      // Detect position within column based on task elements
      if (columnId) {
        const columnTasks = tasks.filter(t => t.column_id === columnId && t.id !== draggedTask.id)
          .sort((a, b) => a.position - b.position);
        
        // Find all task elements in this column
        const taskElements = columnElement.querySelectorAll('[data-task-id]');
        let insertIndex = columnTasks.length; // Default to end
        
        for (let i = 0; i < taskElements.length; i++) {
          const taskEl = taskElements[i] as HTMLElement;
          const taskId = taskEl.getAttribute('data-task-id');
          if (taskId === draggedTask.id) continue;
          
          const rect = taskEl.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          
          if (e.clientY < midY) {
            // Find the index of this task in columnTasks
            const taskIndex = columnTasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
              insertIndex = taskIndex;
              break;
            }
          }
        }
        
        setDraggedOverTaskIndex(insertIndex);
      }
    } else {
      setDraggedOverTaskIndex(null);
    }
  };
  
  const handleTaskPointerUp = async (e: React.PointerEvent) => {
    const wasPending = isPendingDrag;
    const wasRealDrag = isDragging && draggedTask;
    const pendingTask = pendingDragTaskRef.current;
    
    // Reset pending drag state
    setIsPendingDrag(false);
    pendingDragTaskRef.current = null;
    dragStartPositionRef.current = null;
    
    // If we never activated real drag, treat as a click - open task detail
    if (wasPending && !wasRealDrag && pendingTask) {
      openEditDialog(pendingTask);
      return;
    }
    
    if (!draggedTask) return;

    const targetColumnId = draggedOverColumn;
    const originalColumnId = draggedTaskColumnRef.current;
    const insertIndex = draggedOverTaskIndex;

    // Reset drag visuals/state (we keep draggedTask until after we compute updates)
    setTaskDragPosition(null);
    setIsDragging(false);
    setDraggedOverTaskIndex(null);

    const cleanup = () => {
      setDraggedTask(null);
      setDraggedOverColumn(null);
    };

    if (!targetColumnId || !originalColumnId) {
      cleanup();
      return;
    }

    const targetColumn = columns.find(col => col.id === targetColumnId);
    if (!targetColumn) {
      cleanup();
      return;
    }

    const isSameColumn = targetColumnId === originalColumnId;

    // We store positions as integers in the DB, so we must reindex instead of using fractional positions.
    const tasksByColumn = (columnId: string) =>
      tasks
        .filter(t => t.column_id === columnId)
        .sort((a, b) => a.position - b.position);

    const normalize = (ordered: Task[]) =>
      ordered.map((t, idx) => ({ ...t, position: idx + 1 }));

    // Build next order for target column
    const targetCurrent = tasksByColumn(targetColumnId);
    const targetWithoutDragged = targetCurrent.filter(t => t.id !== draggedTask.id);
    const safeIndex = Math.min(
      Math.max(insertIndex ?? targetWithoutDragged.length, 0),
      targetWithoutDragged.length
    );

    const movedTask: Task = {
      ...draggedTask,
      column_id: targetColumnId,
      due_date: targetColumn.column_type === 'completed' ? null : draggedTask.due_date
    };

    const targetNext = normalize([
      ...targetWithoutDragged.slice(0, safeIndex),
      movedTask,
      ...targetWithoutDragged.slice(safeIndex)
    ]);

    // Build next order for original column when moving across columns
    const originNext = isSameColumn
      ? []
      : normalize(tasksByColumn(originalColumnId).filter(t => t.id !== draggedTask.id));

    // Optimistic UI update: apply changes to local state immediately
    const updates = new Map<string, Task>();
    [...targetNext, ...originNext].forEach(tsk => updates.set(tsk.id, tsk));

    setTasks(prev => prev.map(tsk => updates.get(tsk.id) ?? tsk));

    // Demo mode: no backend sync needed
    if (isDemo) {
      if (!isSameColumn) {
        toast.success(t('board.taskMoved', { column: targetColumn.name }) + ' (demo)');
      }
      cleanup();
      return;
    }

    // Background sync to database (don't await - fire and forget with error handling)
    const syncToDatabase = async () => {
      try {
        const updateOps: Array<{ id: string; data: any }> = [];

        // Reindex target column (includes moved task)
        for (const tsk of targetNext) {
          const data: any = { position: tsk.position };

          // Only the moved task needs a column_id / due_date update.
          if (tsk.id === draggedTask.id) {
            data.column_id = targetColumnId;
            if (targetColumn.column_type === 'completed') data.due_date = null;
          }

          updateOps.push({ id: tsk.id, data });
        }

        // Reindex origin column after removal
        for (const tsk of originNext) {
          updateOps.push({ id: tsk.id, data: { position: tsk.position } });
        }

        await Promise.all(
          updateOps.map(async op => {
            const { error } = await supabase.from('tasks').update(op.data).eq('id', op.id);
            if (error) throw error;
          })
        );

        if (!isSameColumn) {
          toast.success(t('board.taskMoved', { column: targetColumn.name }));
        }
      } catch (error: any) {
        // Rollback: refetch from database on error
        toast.error(t('board.errorMovingTask'));
        await fetchBoardData();
      }
    };

    // Fire background sync
    syncToDatabase();

    cleanup();
  };

  // Legacy drag handlers (keep for compatibility but won't be used)
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.preventDefault();
  };
  const handleDragEnd = () => {};
  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
  };
  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
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

      // Calculate snap guides
      const guides: {
        x?: number;
        y?: number;
      } = {};

      // Unified resize: width and header_width scale together, height adjusts independently
      if (handle === 'nw') {
        // Top-left: shrink from top-left
        const newWidth = Math.max(100, (column.width || 300) - deltaX);
        const newHeight = Math.max(100, (column.height || 600) - deltaY);

        // Check alignment with other columns
        for (const col of columns) {
          if (col.id === column.id) continue;
          if (Math.abs(newWidth - (col.width || 300)) < SNAP_THRESHOLD) {
            guides.x = col.x_position + (col.width || 300);
          }
          if (Math.abs(newHeight - (col.height || 600)) < SNAP_THRESHOLD) {
            guides.y = col.y_position + (col.height || 600);
          }
        }
        updated.width = newWidth;
        updated.header_width = newWidth;
        updated.height = newHeight;
        updated.content_padding_top = Math.max(0, (column.content_padding_top || 0) + deltaY);
      }
      if (handle === 'ne') {
        // Top-right: expand right, shrink top
        const newWidth = Math.max(100, (column.width || 300) + deltaX);
        const newHeight = Math.max(100, (column.height || 600) - deltaY);
        for (const col of columns) {
          if (col.id === column.id) continue;
          if (Math.abs(newWidth - (col.width || 300)) < SNAP_THRESHOLD) {
            guides.x = col.x_position + (col.width || 300);
          }
          if (Math.abs(newHeight - (col.height || 600)) < SNAP_THRESHOLD) {
            guides.y = col.y_position + (col.height || 600);
          }
        }
        updated.width = newWidth;
        updated.header_width = newWidth;
        updated.height = newHeight;
        updated.content_padding_top = Math.max(0, (column.content_padding_top || 0) + deltaY);
      }
      if (handle === 'sw') {
        // Bottom-left: shrink left, expand bottom
        const newWidth = Math.max(100, (column.width || 300) - deltaX);
        const newHeight = Math.max(100, (column.height || 600) + deltaY);
        for (const col of columns) {
          if (col.id === column.id) continue;
          if (Math.abs(newWidth - (col.width || 300)) < SNAP_THRESHOLD) {
            guides.x = col.x_position + (col.width || 300);
          }
          if (Math.abs(newHeight - (col.height || 600)) < SNAP_THRESHOLD) {
            guides.y = col.y_position + (col.height || 600);
          }
        }
        updated.width = newWidth;
        updated.header_width = newWidth;
        updated.height = newHeight;
        updated.content_padding_bottom = Math.max(0, (column.content_padding_bottom || 0) - deltaY);
      }
      if (handle === 'se') {
        // Bottom-right: expand both
        const newWidth = Math.max(100, (column.width || 300) + deltaX);
        const newHeight = Math.max(100, (column.height || 600) + deltaY);
        for (const col of columns) {
          if (col.id === column.id) continue;
          if (Math.abs(newWidth - (col.width || 300)) < SNAP_THRESHOLD) {
            guides.x = col.x_position + (col.width || 300);
          }
          if (Math.abs(newHeight - (col.height || 600)) < SNAP_THRESHOLD) {
            guides.y = col.y_position + (col.height || 600);
          }
        }
        updated.width = newWidth;
        updated.header_width = newWidth;
        updated.height = newHeight;
        updated.content_padding_bottom = Math.max(0, (column.content_padding_bottom || 0) - deltaY);
      }
      if (handle === 'header-bottom') {
        // Header bottom: only adjust header height
        const newHeaderHeight = Math.max(40, (column.header_height || 60) + deltaY);
        updated.header_height = newHeaderHeight;
      }
      setSnapGuides(Object.keys(guides).length > 0 ? guides : null);
      currentColumn = updated;
      setSelectedColumn(updated);
    };
    const handleMouseUp = async () => {
      if (isDemo) {
        const updatedColumns = columns.map(c => c.id === currentColumn.id ? currentColumn : c);
        setColumns(updatedColumns);
        toast.success(t('board.columnUpdated') + ' (demo)');
        setResizing(false);
        setResizeHandle(null);
        setResizeStart(null);
        setSnapGuides(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        return;
      }
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
        toast.success(t('board.columnUpdated'));
        await fetchBoardData();
      } catch (error: any) {
        console.error('Update error:', error);
        toast.error(t('board.updateError') + error.message);
      }
      setResizing(false);
      setResizeHandle(null);
      setResizeStart(null);
      setSnapGuides(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  const startWidgetResize = (e: React.MouseEvent, widget: any, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingWidget(true);
    setWidgetResizeHandle(handle);
    const startX = e.clientX / SCALE_FACTOR;
    const startY = e.clientY / SCALE_FACTOR;
    let currentWidget = {
      ...widget
    };
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX / SCALE_FACTOR - startX;
      const deltaY = moveEvent.clientY / SCALE_FACTOR - startY;
      const updated = {
        ...widget
      };
      if (handle === 'nw') {
        updated.width = Math.max(300, widget.width - deltaX);
        updated.height = Math.max(200, widget.height - deltaY);
      } else if (handle === 'ne') {
        updated.width = Math.max(300, widget.width + deltaX);
        updated.height = Math.max(200, widget.height - deltaY);
      } else if (handle === 'sw') {
        updated.width = Math.max(300, widget.width - deltaX);
        updated.height = Math.max(200, widget.height + deltaY);
      } else if (handle === 'se') {
        updated.width = Math.max(300, widget.width + deltaX);
        updated.height = Math.max(200, widget.height + deltaY);
      }
      currentWidget = updated;
      setWidgets(prev => prev.map(w => w.id === widget.id ? updated : w));
    };
    const handleMouseUp = async () => {
      try {
        await supabase.from('widgets').update({
          width: Math.round(currentWidget.width),
          height: Math.round(currentWidget.height)
        }).eq('id', widget.id);
        toast.success('Widget grootte aangepast');
        await fetchBoardData();
      } catch (error: any) {
        console.error('Resize error:', error);
        toast.error('Fout bij aanpassen grootte: ' + error.message);
      }
      setResizingWidget(false);
      setWidgetResizeHandle(null);
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
          <p className="mt-4 text-gray-600">{t('board.loadingBoard')}</p>
        </div>
      </div>;
  }
  return <div className={cn("h-screen relative", isMobile ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden")}>
      {/* Fixed background layer - doesn't scale with zoom */}
      <div className={cn("absolute inset-0 pointer-events-none", isMobile ? "bg-background" : (backgroundImageUrl ? "" : "bg-gradient-to-br " + selectedBackground))} style={{
      ...(backgroundImageUrl && !isMobile && {
        backgroundImage: `linear-gradient(to bottom right, rgba(0,0,0,0.1), rgba(0,0,0,0.05)), url(${backgroundImageUrl})`,
        backgroundSize: backgroundFitMode === 'cover' ? 'cover' : `${backgroundScale}%`,
        backgroundPosition: `${backgroundPositionX}% ${backgroundPositionY}%`,
        backgroundRepeat: 'no-repeat'
      })
    }} />

      {/* Background Icons Pattern - only show when using gradient background */}
      {!backgroundImageUrl && <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Desktop icons */}
          <div className="hidden md:block">
            <CalendarLucide className="absolute top-[5%] left-[5%] w-10 h-10 text-primary opacity-5" />
            <ClipboardIcon className="absolute top-[5%] left-[30%] w-10 h-10 text-primary opacity-5" />
            <FileText className="absolute top-[5%] left-[55%] w-10 h-10 text-primary opacity-5" />
            <Target className="absolute top-[5%] left-[80%] w-10 h-10 text-primary opacity-5" />
            
            <Clock className="absolute top-[20%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <CheckSquare className="absolute top-[20%] left-[35%] w-10 h-10 text-primary opacity-5" />
            <Archive className="absolute top-[20%] left-[60%] w-10 h-10 text-primary opacity-5" />
            <CheckCircle2 className="absolute top-[20%] left-[85%] w-10 h-10 text-primary opacity-5" />
            
            <Zap className="absolute top-[35%] left-[5%] w-10 h-10 text-primary opacity-5" />
            <Paperclip className="absolute top-[35%] left-[30%] w-10 h-10 text-primary opacity-5" />
            <Layout className="absolute top-[35%] left-[55%] w-10 h-10 text-primary opacity-5" />
            <CalendarLucide className="absolute top-[35%] left-[80%] w-10 h-10 text-primary opacity-5" />
            
            <ClipboardIcon className="absolute top-[50%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <FileText className="absolute top-[50%] left-[35%] w-10 h-10 text-primary opacity-5" />
            <Target className="absolute top-[50%] left-[60%] w-10 h-10 text-primary opacity-5" />
            <Clock className="absolute top-[50%] left-[85%] w-10 h-10 text-primary opacity-5" />
            
            <CheckSquare className="absolute top-[65%] left-[5%] w-10 h-10 text-primary opacity-5" />
            <Archive className="absolute top-[65%] left-[30%] w-10 h-10 text-primary opacity-5" />
            <CheckCircle2 className="absolute top-[65%] left-[55%] w-10 h-10 text-primary opacity-5" />
            <Zap className="absolute top-[65%] left-[80%] w-10 h-10 text-primary opacity-5" />
            
            <Paperclip className="absolute top-[80%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <Layout className="absolute top-[80%] left-[35%] w-10 h-10 text-primary opacity-5" />
            <CalendarLucide className="absolute top-[80%] left-[60%] w-10 h-10 text-primary opacity-5" />
            <ClipboardIcon className="absolute top-[80%] left-[85%] w-10 h-10 text-primary opacity-5" />
          </div>
          
          {/* Mobile icons */}
          <div className="block md:hidden">
            <CalendarLucide className="absolute top-[10%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <CheckSquare className="absolute top-[10%] right-[10%] w-10 h-10 text-primary opacity-5" />
            
            <Target className="absolute top-[30%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <Clock className="absolute top-[30%] right-[10%] w-10 h-10 text-primary opacity-5" />
            
            <Zap className="absolute top-[50%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <FileText className="absolute top-[50%] right-[10%] w-10 h-10 text-primary opacity-5" />
            
            <CheckCircle2 className="absolute top-[70%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <ClipboardIcon className="absolute top-[70%] right-[10%] w-10 h-10 text-primary opacity-5" />
            
            <Archive className="absolute top-[90%] left-[10%] w-10 h-10 text-primary opacity-5" />
            <Paperclip className="absolute top-[90%] right-[10%] w-10 h-10 text-primary opacity-5" />
          </div>
        </div>}

      
      {/* Canvas layer with touch gestures - only for desktop */}
      <div 
        className={cn("origin-top-left", isMobile ? "overflow-y-auto" : "overflow-hidden")} 
        onTouchStart={!isMobile ? handleTouchStart : undefined} 
        onTouchMove={!isMobile ? handleTouchMove : undefined} 
        onTouchEnd={!isMobile ? handleTouchEnd : undefined} 
        style={{
          transform: isMobile ? 'none' : `scale(${zoomLevel})`,
          width: isMobile ? '100%' : `${100 / zoomLevel}vw`,
          height: isMobile ? 'auto' : `${100 / zoomLevel}vh`,
          touchAction: isMobile ? 'auto' : 'none',
          minHeight: isMobile ? 'auto' : `${100 / zoomLevel}vh`
        }}
      >
        <div className={cn("flex flex-col gap-[18px] pt-[22px] px-0", isMobile ? "min-h-screen" : "h-screen")}>
      
      {/* Demo Banner */}
      {isDemo && <div className="fixed top-0 left-0 right-0 z-[100] bg-primary/95 backdrop-blur-sm text-primary-foreground shadow-lg px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-semibold text-left">
              {t('demo.bannerText')}
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button size="sm" className="h-7 px-2 text-xs flex-1 sm:flex-none sm:h-8 sm:px-3" variant="secondary" onClick={() => navigate('/auth')}>
                {t('demo.createOwnBoard')}
              </Button>
              <Button size="sm" className="h-7 px-2 text-xs flex-1 sm:flex-none sm:h-8 sm:px-3 bg-white/10 hover:bg-white/20 text-white border border-white/20" onClick={() => navigate('/pricing')}>
                {t('demo.viewPricing')}
              </Button>
            </div>
          </div>
        </div>}
      
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
        @keyframes slide-in-from-left {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slide-in-from-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slide-out-to-left {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
        @keyframes slide-out-to-right {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        .slide-in-left {
          animation: slide-in-from-left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .slide-in-right {
          animation: slide-in-from-right 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .slide-out-left {
          animation: slide-out-to-left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .slide-out-right {
          animation: slide-out-to-right 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Header */}
      <header className={cn("flex items-center gap-2 rounded-[28px] relative", isDemo && (isMobile ? "mt-20" : "mt-16"), isMobile ? "flex-col bg-white/95 dark:bg-card/95 border border-gray-200 dark:border-gray-700 shadow-md px-2.5 pt-3 pb-2.5 mx-2" : "justify-between backdrop-blur-[60px] bg-white/20 dark:bg-card/20 border-2 border-white/40 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_16px_rgba(255,255,255,0.1),inset_0_2px_2px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_2px_2px_rgba(255,255,255,0.2)] overflow-visible before:absolute before:inset-0 before:rounded-[28px] before:bg-gradient-to-br before:from-white/30 before:via-white/10 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[27px] after:bg-gradient-to-br after:from-transparent after:to-white/5 after:pointer-events-none px-5 py-[18px] mx-[22px]")}>
        <div className={cn("flex items-center relative z-10 min-w-0", isMobile ? "w-full gap-2 justify-center" : "gap-4")}>
          {isMobile && (
            <button 
              onClick={() => navigate(isDemo ? "/" : "/dashboard")} 
              className="text-foreground font-bold cursor-pointer transition-all duration-300 flex items-center justify-center backdrop-blur-[60px] bg-white/30 dark:bg-card/30 border border-white/50 dark:border-white/30 shadow-[0_2px_8px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.8)] active:scale-95 hover:bg-white/40 dark:hover:bg-card/40 p-1.5 rounded-lg shrink-0 relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/40 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[7px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className={cn("min-w-0 flex-1", isMobile && "text-center")}>
            <h1 className={cn("font-extrabold tracking-[0.2px] leading-[1.1] bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent drop-shadow-sm", isMobile ? "text-base" : "text-[clamp(26px,3.5vw,48px)]")}>
              {organization?.name || "NRG TOTAAL"} – To-Do Board
            </h1>
            <p className={cn("text-muted-foreground font-semibold", isMobile ? "text-xs mt-0.5" : "text-[clamp(12px,1.4vw,16px)]")}>
              {t(isMobile ? 'board.liveOverviewMobile' : 'board.liveOverview')}
            </p>
          </div>
          {isMobile && (
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => navigate("/agenda")} 
                className="text-foreground font-bold cursor-pointer transition-all duration-300 flex items-center justify-center backdrop-blur-[60px] bg-white/30 dark:bg-card/30 border border-white/50 dark:border-white/30 shadow-[0_2px_8px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.8)] active:scale-95 hover:bg-white/40 dark:hover:bg-card/40 p-1.5 rounded-lg relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/40 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[7px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none"
                title={t('agenda.title')}
              >
                <CalendarLucide className="w-5 h-5" />
              </button>
              <ActiveUsers organizationId={organizationId!} isDemo={isDemo} isMobile={isMobile} />
            </div>
          )}
          {!isMobile && <div className="[font-variant-numeric:tabular-nums] font-bold rounded-2xl text-center shrink-0 relative backdrop-blur-[15px] bg-gradient-to-br from-primary/10 to-accent/10 border border-white/20 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.08)] px-3.5 py-1.5 text-[clamp(20px,3vw,40px)]">
              <div className="text-primary whitespace-nowrap relative z-10">{formatTime(currentTime)}</div>
              <div className="text-muted-foreground font-semibold whitespace-nowrap relative z-10 text-[clamp(10px,1.2vw,14px)]">{formatDate(currentTime)}</div>
            </div>}
        </div>
        <div className={cn("flex relative z-10", isMobile ? "w-full justify-between gap-1" : "gap-2.5")}>
          {!isMobile && (
            <button onClick={() => navigate(isDemo ? "/" : "/dashboard")} className="text-foreground font-bold cursor-pointer transition-all duration-300 flex items-center gap-2 relative backdrop-blur-[60px] bg-white/20 dark:bg-card/20 border-2 border-white/40 dark:border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,0.7)] hover:-translate-y-1 hover:bg-white/30 dark:hover:bg-card/30 before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[15px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none px-3.5 py-2.5 rounded-2xl text-[clamp(12px,1.4vw,16px)]">
              <ArrowLeft className="w-4 h-4" />
              {isDemo ? t('demo.backToHome') : t('dashboard.title')}
            </button>
          )}
          {!isMobile && <div className="flex items-center rounded-2xl backdrop-blur-[60px] bg-white/20 dark:bg-card/20 border-2 border-white/40 dark:border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,0.5)] px-3 py-2 gap-2">
              <button onClick={handleZoomOut} disabled={zoomLevel <= 0.5} className="text-foreground p-1 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed font-bold hover:bg-white/30 dark:hover:bg-card/30 text-lg" title="Zoom uit (Ctrl/Cmd + -)">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-foreground font-bold text-center text-sm min-w-[3.5rem]">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button onClick={handleZoomIn} disabled={zoomLevel >= 1.0} className="text-foreground p-1 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed font-bold hover:bg-white/30 dark:hover:bg-card/30 text-lg" title="Zoom in (Ctrl/Cmd + +)">
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>}
          {!isMobile && <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn("backdrop-blur-[60px] text-foreground border-2 px-3.5 py-2.5 rounded-2xl font-bold cursor-pointer transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,0.7)] hover:-translate-y-1 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[15px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none flex items-center gap-2", activeFiltersCount > 0 ? "bg-primary/30 dark:bg-primary/30 border-primary/60 dark:border-primary/60" : "bg-white/20 dark:bg-card/20 border-white/40 dark:border-white/20 hover:bg-white/30 dark:hover:bg-card/30")}>
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFiltersCount > 0 && <Badge variant="destructive" className="ml-1 rounded-full w-5 h-5 flex items-center justify-center p-0 text-xs">
                      {activeFiltersCount}
                    </Badge>}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-background/95 backdrop-blur-sm z-50">
                <DropdownMenuLabel>Filter taken</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Filter op Trefwoord */}
                <div className="px-2 py-2">
                  <Label className="text-xs text-muted-foreground mb-2">Zoek op trefwoord</Label>
                  <Input
                    placeholder="Zoek in titel of omschrijving..."
                    value={filterKeyword}
                    onChange={(e) => setFilterKeyword(e.target.value)}
                    className="bg-background h-9 text-sm"
                  />
                </div>
                
                <DropdownMenuSeparator />
                
                {/* Filter op Persoon */}
                <div className="px-2 py-2">
                  <Label className="text-xs text-muted-foreground mb-2">Toegewezen aan</Label>
                  <Select value={filterAssignee || "all"} onValueChange={v => setFilterAssignee(v === "all" ? null : v)}>
                    <SelectTrigger className="bg-background">
                      <span className="text-sm">{filterAssignee === "unassigned" ? "Niet toegewezen" : filterAssignee ? orgMembers.find(m => m.user_id === filterAssignee)?.full_name : "Alle personen"}</span>
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-sm z-[100]">
                      <SelectItem value="all">Alle personen</SelectItem>
                      <SelectItem value="unassigned">Niet toegewezen</SelectItem>
                      {orgMembers.map(member => <SelectItem key={member.user_id} value={member.user_id}>
                          {member.full_name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <DropdownMenuSeparator />
                
                {/* Filter op Prioriteit */}
                <div className="px-2 py-2">
                  <Label className="text-xs text-muted-foreground mb-2">Prioriteit</Label>
                  <Select value={filterPriority || "all"} onValueChange={v => setFilterPriority(v === "all" ? null : v as any)}>
                    <SelectTrigger className="bg-background">
                      <span className="text-sm">
                        {filterPriority === "low" ? "🟢 Laag" : filterPriority === "medium" ? "🟡 Gemiddeld" : filterPriority === "high" ? "🔴 Hoog" : "Alle prioriteiten"}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-sm z-[100]">
                      <SelectItem value="all">Alle prioriteiten</SelectItem>
                      <SelectItem value="low">🟢 Laag</SelectItem>
                      <SelectItem value="medium">🟡 Gemiddeld</SelectItem>
                      <SelectItem value="high">🔴 Hoog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <DropdownMenuSeparator />
                
                {/* Filter op Deadline */}
                <div className="px-2 py-2">
                  <Label className="text-xs text-muted-foreground mb-2">Deadline</Label>
                  <Select value={filterDeadline || "all"} onValueChange={v => setFilterDeadline(v === "all" ? null : v as any)}>
                    <SelectTrigger className="bg-background">
                      <span className="text-sm">
                        {filterDeadline === "overdue" ? "⚠️ Verlopen" : filterDeadline === "today" ? "📅 Vandaag" : filterDeadline === "this-week" ? "📆 Deze week" : filterDeadline === "no-deadline" ? "➖ Geen deadline" : "Alle deadlines"}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-sm z-[100]">
                      <SelectItem value="all">Alle deadlines</SelectItem>
                      <SelectItem value="overdue">⚠️ Verlopen</SelectItem>
                      <SelectItem value="today">📅 Vandaag</SelectItem>
                      <SelectItem value="this-week">📆 Deze week</SelectItem>
                      <SelectItem value="no-deadline">➖ Geen deadline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <DropdownMenuSeparator />
                
                {/* Reset knop */}
                <div className="px-2 py-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => {
                    setFilterKeyword("");
                    setFilterAssignee(null);
                    setFilterPriority(null);
                    setFilterDeadline(null);
                  }} disabled={activeFiltersCount === 0}>
                    <X className="h-4 w-4 mr-2" />
                    Reset filters
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>}
          {!isMobile && <button onClick={handleFullscreen} className={cn("text-foreground px-3.5 py-2.5 rounded-2xl font-bold cursor-pointer transition-all duration-300 text-[clamp(12px,1.4vw,16px)] relative", isMobile ? "bg-white dark:bg-card border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md active:scale-95" : "backdrop-blur-[60px] bg-white/20 dark:bg-card/20 border-2 border-white/40 dark:border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,0.7)] hover:-translate-y-1 hover:bg-white/30 dark:hover:bg-card/30 before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[15px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none")}>
            ⛶ {t('board.fullscreen')}
          </button>}
          {!isMobile && <button onClick={() => setEditMode(!editMode)} className={cn("backdrop-blur-[60px] text-foreground border-2 p-2.5 rounded-2xl font-bold cursor-pointer transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,0.7)] hover:-translate-y-1 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[15px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none", editMode ? "bg-primary/30 dark:bg-primary/30 border-primary/60 dark:border-primary/60 hover:bg-primary/40 dark:hover:bg-primary/40" : "bg-white/20 dark:bg-card/20 border-white/40 dark:border-white/20 hover:bg-white/30 dark:hover:bg-card/30")} title={editMode ? t('board.editModeOff') : t('board.editModeOn')}>
              <Pencil size={20} />
            </button>}
          
          {!isMobile && <button onClick={() => navigate("/agenda")} className="backdrop-blur-[60px] text-foreground border-2 p-2.5 rounded-2xl font-bold cursor-pointer transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,0.7)] hover:-translate-y-1 bg-white/20 dark:bg-card/20 border-white/40 dark:border-white/20 hover:bg-white/30 dark:hover:bg-card/30 relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[15px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none" title={t('agenda.title')}>
              <CalendarLucide size={20} />
            </button>}
          
          {!isMobile && board?.id && <NotificationsDropdown boardId={board.id} isDemo={isDemo} onOpenTask={handleOpenTaskFromNotification} />}
          
          {!isMobile && <ActiveUsers organizationId={organizationId!} isDemo={isDemo} isMobile={isMobile} />}
        </div>
      </header>

      {/* Canvas Board / Mobile Layout */}
      {isMobile ?
        // Mobile: Single column carousel layout
        <main 
          ref={mobileMainRef}
          className="flex-1 overflow-y-auto overflow-x-hidden pt-1 pb-6 px-4 min-h-screen bg-background"
          onTouchStart={handleMobileSwipeStart}
          onTouchMove={handleMobileSwipeMove}
          onTouchEnd={handleMobileSwipeEnd}
        >
          <div className="flex flex-col gap-2 h-full">
            {columns.length > 0 && (() => {
              const column = columns[currentColumnIndex];
              if (!column) return null;
              
              return <section 
                key={column.id} 
                className={cn(
                  "flex flex-col w-full h-full",
                  !isTransitioning && slideDirection === null && "slide-in-right",
                  isTransitioning && slideDirection === 'left' && "slide-out-left",
                  isTransitioning && slideDirection === 'right' && "slide-out-right"
                )}
              >
                  <div className={cn("flex items-center justify-between px-2.5 py-0.5 rounded-[20px] backdrop-blur-[60px] border-2 mb-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.08),inset_0_2px_2px_rgba(255,255,255,0.5)] relative overflow-visible group before:absolute before:inset-0 before:rounded-[20px] before:bg-gradient-to-br before:from-white/30 before:via-white/10 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[19px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none transition-all", getGlowStyles(column.glow_type).header, "border-white/40 dark:border-white/20")}>
                    <div className="flex items-center justify-between w-full gap-1.5">
                      {/* Left arrow */}
                      <button 
                        onClick={() => {
                          if (currentColumnIndex > 0) {
                            setIsTransitioning(true);
                            setSlideDirection('right');
                            setTimeout(() => {
                              setCurrentColumnIndex(prev => Math.max(0, prev - 1));
                              setTimeout(() => {
                                setIsTransitioning(false);
                                setSlideDirection(null);
                              }, 30);
                            }, 60);
                          }
                        }}
                        disabled={currentColumnIndex === 0}
                        className={cn(
                          "backdrop-blur-[60px] bg-white/20 dark:bg-card/20 p-2 rounded-lg transition-all",
                          currentColumnIndex === 0 
                            ? "opacity-30 cursor-not-allowed" 
                            : "hover:bg-white/30 dark:hover:bg-card/30"
                        )}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>
                      
                      {/* Sort dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 p-2 rounded-lg hover:bg-white/30 dark:hover:bg-card/30 transition-all relative z-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"/>
                              <path d="M7 12h10"/>
                              <path d="M10 18h4"/>
                            </svg>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-background border-border z-[100]" align="start">
                          <DropdownMenuLabel className="text-sm">Sorteer op</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setMobileSortBy("position")} className={cn("text-sm py-2", mobileSortBy === "position" ? "bg-accent" : "")}>
                            Positie
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setMobileSortBy("deadline")} className={cn("text-sm py-2", mobileSortBy === "deadline" ? "bg-accent" : "")}>
                            Deadline
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setMobileSortBy("priority")} className={cn("text-sm py-2", mobileSortBy === "priority" ? "bg-accent" : "")}>
                            Prioriteit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setMobileSortBy("newest")} className={cn("text-sm py-2", mobileSortBy === "newest" ? "bg-accent" : "")}>
                            Nieuwste eerst
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setMobileSortBy("oldest")} className={cn("text-sm py-2", mobileSortBy === "oldest" ? "bg-accent" : "")}>
                            Oudste eerst
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {/* Column name - centered with dropdown navigation */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 px-3 py-2 rounded-lg text-xl font-extrabold text-foreground relative z-10 drop-shadow-sm flex-1 text-center hover:bg-white/30 dark:hover:bg-card/30 transition-all cursor-pointer">
                            {column.name}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-background border-border z-[100]" align="center">
                          <DropdownMenuLabel className="text-sm">Ga naar kolom</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {columns.map((col, idx) => (
                            <DropdownMenuItem 
                              key={col.id} 
                              onClick={() => setCurrentColumnIndex(idx)} 
                              className={cn("text-sm py-2", currentColumnIndex === idx ? "bg-accent" : "")}
                            >
                              {col.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {/* Add task button OR Clear completed button */}
                      {column.column_type === 'completed' ? (
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => setShowArchiveDialog(true)}
                            className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 text-foreground px-3 py-2 rounded-lg font-bold text-xl hover:bg-white/30 dark:hover:bg-card/30 transition-all relative z-10"
                            title="Takenarchief"
                          >
                            <Archive className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => setClearCompletedColumnId(column.id)}
                            className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 text-foreground px-3 py-2 rounded-lg font-bold text-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all relative z-10"
                            title={t('board.clearCompletedTasks')}
                          >
                            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-500" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          {(column.column_type === 'sick_leave' || column.column_type === 'vacation') && organizationId && (
                            <AbsenceManagementDialog
                              organizationId={organizationId}
                              absenceType={column.column_type as "sick_leave" | "vacation"}
                              orgMembers={orgMembers}
                            >
                              <button className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 text-foreground px-3 py-2 rounded-lg font-bold hover:bg-white/30 dark:hover:bg-card/30 transition-all relative z-10">
                                <BarChart3 className="h-5 w-5" />
                              </button>
                            </AbsenceManagementDialog>
                          )}
                          <Dialog open={openDialog === column.id} onOpenChange={open => setOpenDialog(open ? column.id : null)}>
                          <DialogTrigger asChild>
                            <button className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 text-foreground px-3 py-2 rounded-lg font-bold text-xl hover:bg-white/30 dark:hover:bg-card/30 transition-all relative z-10">
                              +
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[96vw] sm:max-w-2xl max-h-[85vh] p-0 flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
                            <DialogHeader className="px-4 pt-6 sm:px-6 pb-3 shrink-0">
                              <DialogTitle>{column.column_type === 'sick_leave' ? 'Ziek melden' : column.column_type === 'vacation' ? 'Verlof melden' : `${t('board.addNewTask')} - ${column.name}`}</DialogTitle>
                            </DialogHeader>
                            <div className="overflow-y-auto flex-1 px-4 sm:px-6 pb-4 sm:pb-6">
                              <div className="space-y-3 sm:space-y-4 py-2">
                              <div>
                                <Label htmlFor={`title-${column.id}`}>{column.column_type === 'sick_leave' || column.column_type === 'vacation' ? t('board.name') : t('board.title')} *</Label>
                                {column.column_type === 'sick_leave' || column.column_type === 'vacation' ? (
                                  (() => {
                                    const memberNames = orgMembers.map(m => m.full_name);
                                    const allNames = [...new Set([...memberNames, ...manualPersonNames])].sort();
                                    return <PersonSearchSelect value={newTaskTitle} onValueChange={setNewTaskTitle} names={allNames} />;
                                  })()
                                ) : (
                                  <Input id={`title-${column.id}`} value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder={t('board.titlePlaceholder')} maxLength={200} />
                                )}
                              </div>
                              <div>
                                <Label htmlFor={`description-${column.id}`}>{column.column_type === 'sick_leave' || column.column_type === 'vacation' ? t('board.reason') : t('common.description')}</Label>
                                <Textarea id={`description-${column.id}`} value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} placeholder={column.column_type === 'sick_leave' || column.column_type === 'vacation' ? t('board.reasonPlaceholder') : t('board.descriptionPlaceholder')} />
                              </div>
                              {(column.column_type === 'sick_leave' || column.column_type === 'vacation') && <>
                                <div>
                                  <Label>Van</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(newTaskStartDate, "PPP", { locale: getDateLocale() })}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar mode="single" selected={newTaskStartDate} onSelect={(d) => d && setNewTaskStartDate(d)} initialFocus className="pointer-events-auto" />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <div>
                                  <Label>Tot en met</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newTaskEndDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {newTaskEndDate ? format(newTaskEndDate, "PPP", { locale: getDateLocale() }) : "Selecteer einddatum (optioneel)"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar mode="single" selected={newTaskEndDate} onSelect={setNewTaskEndDate} initialFocus className="pointer-events-auto" />
                                      {newTaskEndDate && <div className="p-3 border-t">
                                        <Button variant="outline" className="w-full" onClick={() => setNewTaskEndDate(undefined)}>Einddatum verwijderen</Button>
                                      </div>}
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                {column.column_type === 'vacation' && <div>
                                  <Label>Aantal uren</Label>
                                  <Input type="number" min={0} max={24} step={0.5} value={newTaskHours} onChange={e => setNewTaskHours(e.target.value)} placeholder="8" />
                                  <p className="text-xs text-muted-foreground mt-1">Alleen voor enkele dag, bij meerdere dagen wordt het werkrooster gebruikt</p>
                                </div>}
                              </>}
                              {!(column.column_type === 'sick_leave' || column.column_type === 'vacation') && <div>
                                <Label>{t('board.deadline')}</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newTaskDueDate && "text-muted-foreground")}>
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {newTaskDueDate ? format(newTaskDueDate, "PPP", {
                                      locale: getDateLocale()
                                    }) : t('board.selectDate')}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={newTaskDueDate} onSelect={setNewTaskDueDate} initialFocus className="pointer-events-auto" />
                                    {newTaskDueDate && <div className="p-3 border-t">
                                        <Button variant="outline" className="w-full" onClick={() => setNewTaskDueDate(undefined)}>
                                          {t('board.removeDate')}
                                        </Button>
                                      </div>}
                                  </PopoverContent>
                                </Popover>
                              </div>}
                              {!(column.column_type === 'sick_leave' || column.column_type === 'vacation') && <div>
                                <Label>{t('board.priority')}</Label>
                                <div className="flex gap-2">
                                  <Button type="button" variant={newTaskPriority === null ? "default" : "outline"} onClick={() => setNewTaskPriority(null)} className="flex-1">
                                    {t('board.priorityNone')}
                                  </Button>
                                  <Button type="button" variant={newTaskPriority === "low" ? "default" : "outline"} onClick={() => setNewTaskPriority("low")} className="flex-1">
                                    {t('board.priorityLow')}
                                  </Button>
                                  <Button type="button" variant={newTaskPriority === "medium" ? "default" : "outline"} onClick={() => setNewTaskPriority("medium")} className="flex-1">
                                    {t('board.priorityMedium')}
                                  </Button>
                                  <Button type="button" variant={newTaskPriority === "high" ? "default" : "outline"} onClick={() => setNewTaskPriority("high")} className="flex-1">
                                    {t('board.priorityHigh')}
                                  </Button>
                                </div>
                              </div>}
                              
                              {/* Team member assignment - hide for sick/vacation */}
                              {!(column.column_type === 'sick_leave' || column.column_type === 'vacation') && <div>
                                <Label>{t('board.assignedTo')}</Label>
                                <div className="space-y-3">
                                  {newTaskAssignees.length > 0 && <div className="flex flex-wrap gap-2">
                                    {newTaskAssignees.map(userId => {
                                      const member = orgMembers.find(m => m.user_id === userId);
                                      if (!member) return null;
                                      return <div key={userId} className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                                        <Avatar className="h-9 w-9">
                                          <AvatarImage src={member.avatar_url || undefined} />
                                          <AvatarFallback className="text-sm font-bold bg-primary/30 text-primary">
                                            {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{member.full_name}</span>
                                        <button onClick={() => setNewTaskAssignees(newTaskAssignees.filter(id => id !== userId))} className="ml-1 text-muted-foreground hover:text-destructive">
                                          ×
                                        </button>
                                      </div>;
                                    })}
                                  </div>}
                                  <TeamMemberSelect 
                                    members={orgMembers} 
                                    selectedMembers={newTaskAssignees} 
                                    onSelect={(userId) => {
                                      if (!newTaskAssignees.includes(userId)) {
                                        setNewTaskAssignees([...newTaskAssignees, userId]);
                                      }
                                    }} 
                                    placeholder={t('board.addTeamMember')} 
                                  />
                                </div>
                              </div>}
                              
                              {/* Recurrence - hide for sick/vacation */}
                              {!(column.column_type === 'sick_leave' || column.column_type === 'vacation') && <div className="border-t pt-3">
                                <RecurrenceSelect
                                  pattern={newTaskRecurrencePattern}
                                  interval={newTaskRecurrenceInterval}
                                  endDate={newTaskRecurrenceEndDate}
                                  onPatternChange={setNewTaskRecurrencePattern}
                                  onIntervalChange={setNewTaskRecurrenceInterval}
                                  onEndDateChange={setNewTaskRecurrenceEndDate}
                                />
                              </div>}
                              
                              {/* Checklist - hide for sick/vacation */}
                              {!(column.column_type === 'sick_leave' || column.column_type === 'vacation') && <div className="border-t pt-3">
                                <TaskChecklistCreate 
                                  items={newTaskChecklistItems} 
                                  onChange={setNewTaskChecklistItems} 
                                />
                              </div>}
                              
                              <button onClick={() => handleAddTask(column.id)} className="w-full backdrop-blur-md bg-primary/90 text-primary-foreground border-0 px-3.5 py-2.5 rounded-xl font-bold hover:bg-primary transition-all hover:shadow-lg">
                                {t('common.add')}
                              </button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        </div>
                      )}
                      
                      {/* Right arrow */}
                      <button 
                        onClick={() => {
                          if (currentColumnIndex < columns.length - 1) {
                            setIsTransitioning(true);
                            setSlideDirection('left');
                            setTimeout(() => {
                              setCurrentColumnIndex(prev => Math.min(columns.length - 1, prev + 1));
                              setTimeout(() => {
                                setIsTransitioning(false);
                                setSlideDirection(null);
                              }, 30);
                            }, 60);
                          }
                        }}
                        disabled={currentColumnIndex === columns.length - 1}
                        className={cn(
                          "backdrop-blur-[60px] bg-white/20 dark:bg-card/20 p-2 rounded-lg transition-all",
                          currentColumnIndex === columns.length - 1 
                            ? "opacity-30 cursor-not-allowed" 
                            : "hover:bg-white/30 dark:hover:bg-card/30"
                        )}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                    </div>
                   
                   {/* Tasks */}
                  <div className="space-y-2 flex-1">{sortTasks(filterTasks(getColumnTasks(column.id))).map(task => {
                    const isSimpleColumn = column.column_type === 'sick_leave' || column.column_type === 'vacation';
                    const isOverdue = task.due_date ? new Date(task.due_date) < new Date(new Date().setHours(0, 0, 0, 0)) : false;
                    
                    const handleMoveTask = async (e: React.MouseEvent, targetColumnId: string) => {
                      e.stopPropagation();
                      try {
                        await supabase
                          .from('tasks')
                          .update({ column_id: targetColumnId })
                          .eq('id', task.id);
                        toast.success('Taak verplaatst');
                        await fetchBoardData();
                      } catch (error: any) {
                        toast.error('Fout bij verplaatsen: ' + error.message);
                      }
                    };
                    
                    if (isSimpleColumn) {
                      return <div key={task.id} className="relative">
                        <SimpleTaskCard taskId={task.id} title={task.title} description={task.description} dueDate={task.due_date} onClick={() => openEditDialog(task)} glowShadow={getGlowStyles(column.glow_type).cardShadow} assignees={task.assignees} glowGradient={getGlowStyles(column.glow_type).cardGradient} columns={columns} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="absolute top-1.5 right-1.5 z-20 backdrop-blur-[60px] bg-white/40 dark:bg-card/40 border border-white/50 dark:border-white/30 p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-card/60 transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M7 7h10M7 12h10M7 17h10"/>
                              </svg>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-background border-border z-[100]" align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id);
                              }} 
                              className="text-xs py-1.5 text-green-600 dark:text-green-400 font-semibold"
                            >
                              {column.column_type === 'sick_leave' ? '✅ Is weer beter' : '✅ Verlof verlopen'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-sm">Verplaats naar</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {columns.filter(col => col.id !== column.id).map((col) => (
                              <DropdownMenuItem 
                                key={col.id} 
                                onClick={(e) => handleMoveTask(e, col.id)} 
                                className="text-xs py-1.5"
                              >
                                {col.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>;
                    }
                    return <div key={task.id} className="relative">
                      <article onClick={() => openEditDialog(task)} className={cn("relative backdrop-blur-[60px] bg-white/25 dark:bg-card/25 border rounded-[16px] p-3 cursor-pointer before:absolute before:inset-0 before:rounded-[16px] before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 after:absolute after:inset-[1px] after:rounded-[15px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none active:scale-[0.98] transition-transform duration-100", "border-white/40 dark:border-white/20", getGlowStyles(column.glow_type).cardGradient, getGlowStyles(column.glow_type).cardShadow, isOverdue && "animate-overdue-glow")}>
                          <div className="flex flex-col gap-2">
                            {/* Badges eerst - deadline en priority */}
                            <div className="flex items-center gap-1 flex-wrap relative z-10">
                              <AttachmentCount taskId={task.id} />
                              {task.due_date && <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold border ${getDeadlineBadgeColor(task.due_date)}`}>
                                  📅 {format(new Date(task.due_date), "d MMM", {
                              locale: getDateLocale()
                            })}
                                </span>}
                              {task.priority && getPriorityBadge(task.priority) && <span className={cn("inline-block px-2 py-1 rounded-full text-[10px] font-bold border", getPriorityBadge(task.priority)!.color)}>
                                  {getPriorityBadge(task.priority)!.label}
                                </span>}
                            </div>
                            
                            {/* Titel */}
                            <h4 className="font-extrabold text-base leading-tight text-foreground relative z-10">
                              {task.title}
                            </h4>
                          </div>
                        </article>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="absolute top-1.5 right-1.5 z-20 backdrop-blur-[60px] bg-white/40 dark:bg-card/40 border border-white/50 dark:border-white/30 p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-card/60 transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M7 7h10M7 12h10M7 17h10"/>
                              </svg>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-background border-border z-[100]" align="end">
                            <DropdownMenuLabel className="text-sm">Verplaats naar</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {columns.filter(col => col.id !== column.id).map((col) => (
                              <DropdownMenuItem 
                                key={col.id} 
                                onClick={(e) => handleMoveTask(e, col.id)} 
                                className="text-xs py-1.5"
                              >
                                {col.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>;
                  })}
                  </div>
                  
                  {/* Page indicator - sticky aan de onderkant */}
                  <div className="sticky bottom-0 left-0 right-0 flex justify-center gap-2 mt-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent pointer-events-none z-10">
                    <div className="pointer-events-auto flex gap-2">
                      {columns.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentColumnIndex(index)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            index === currentColumnIndex 
                              ? "bg-primary w-6" 
                              : "bg-primary/30"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </section>;
            })()}
          </div>
        </main> :
        // Desktop: Canvas-based layout with absolute positioning
        <main className="relative flex-1 min-h-0 overflow-auto" style={{
          minWidth: '3000px',
          minHeight: '2000px'
        }} onClick={e => {
          if (editMode && selectedColumn && e.target === e.currentTarget) {
            setSelectedColumn(null);
          }
        }} onDragOver={editMode ? e => {
          e.preventDefault();
          const canvas = e.currentTarget.getBoundingClientRect();
          if (draggedColumn) {
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
          } else if (draggedWidget) {
            const rawX = Math.max(0, (e.clientX - canvas.left) / SCALE_FACTOR - widgetDragOffset.x);
            const rawY = Math.max(0, (e.clientY - canvas.top) / SCALE_FACTOR - widgetDragOffset.y);
            const {
              snappedX,
              snappedY,
              guides
            } = calculateSnap(rawX, rawY);
            setWidgetDragPreview({
              x: snappedX,
              y: snappedY
            });
            setSnapGuides(guides);
          }
        } : undefined} onDrop={editMode ? async e => {
          e.preventDefault();
          if (draggedColumn && dragPreview) {
            try {
              await supabase.from('columns').update({
                x_position: dragPreview.x,
                y_position: dragPreview.y
              }).eq('id', draggedColumn.id);
              toast.success(t('board.columnMoved'));
              await fetchBoardData();
            } catch (error: any) {
              toast.error(t('board.moveError') + error.message);
            }
            setDraggedColumn(null);
            setDragPreview(null);
            setSnapGuides(null);
          } else if (draggedWidget && widgetDragPreview) {
            try {
              await supabase.from('widgets').update({
                x_position: widgetDragPreview.x,
                y_position: widgetDragPreview.y
              }).eq('id', draggedWidget.id);
              toast.success('Widget verplaatst');
              await fetchBoardData();
            } catch (error: any) {
              toast.error('Fout bij verplaatsen: ' + error.message);
            }
            setDraggedWidget(null);
            setWidgetDragPreview(null);
            setSnapGuides(null);
          }
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

        {/* Preview overlay during drag - Column */}
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
          
        {/* Preview overlay during drag - Widget */}
        {widgetDragPreview && draggedWidget && <>
            <div className="absolute border-4 border-dashed border-purple-500/50 bg-purple-500/10 rounded-lg pointer-events-none z-40" style={{
              left: `${widgetDragPreview.x}px`,
              top: `${widgetDragPreview.y}px`,
              width: `${draggedWidget.width}px`,
              height: `${draggedWidget.height}px`
            }} />
            {/* Position tooltip */}
            <div className="absolute bg-purple-600 text-white border px-3 py-1.5 rounded-md text-xs font-medium pointer-events-none z-50 shadow-lg" style={{
              left: `${widgetDragPreview.x + 10}px`,
              top: `${widgetDragPreview.y - 35}px`
            }}>
              x: {widgetDragPreview.x}px, y: {widgetDragPreview.y}px
            </div>
          </>}

        {/* Widgets */}
        {widgets.map(widget => <WidgetContainer key={widget.id} widget={widget} boardName={organization?.name || "Board"} onDelete={handleDeleteWidget} onDragStart={handleWidgetDragStart} onDragEnd={handleWidgetDragEnd} onResizeMouseDown={startWidgetResize} resizeHandle={widgetResizeHandle} isEditMode={editMode} onSizeChange={(widgetId, width, height, x, y) => {
            // Check if this is a chat widget collapse/expand (don't save to DB, only update local state)
            const isChatCollapseExpand = width === 56 && height === 56 || width === 400 && height === 500;
            if (isChatCollapseExpand) {
              // Only update local state, don't save to database
              setWidgets(widgets.map(w => w.id === widgetId ? {
                ...w,
                width,
                height,
                x_position: x,
                y_position: y
              } : w));
            } else {
              // Normal widget resize, save to database
              handleUpdateWidget(widgetId, {
                width,
                height,
                x_position: x,
                y_position: y
              });
            }
          }} isDragging={draggedWidget?.id === widget.id} />)}

        {columns.map(column => {
            const isSelected = selectedColumn?.id === column.id;
            const displayColumn = isSelected && resizing ? selectedColumn : column;
            return <section 
              key={column.id} 
              data-column-id={column.id}
              className={cn("absolute flex flex-col transition-all", editMode && !isSelected && "cursor-move hover:ring-2 hover:ring-primary hover:shadow-2xl", draggedColumn?.id === column.id && "opacity-50", isSelected && "ring-4 ring-primary shadow-2xl")} 
              style={{
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
            
            <div className={cn("flex items-center justify-between px-3.5 py-3 rounded-[32px] backdrop-blur-[60px] border-2 mb-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.08),inset_0_2px_2px_rgba(255,255,255,0.5)] relative overflow-visible group before:absolute before:inset-0 before:rounded-[32px] before:bg-gradient-to-br before:from-white/30 before:via-white/10 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[31px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none transition-all", getGlowStyles(column.glow_type).header, draggedColumn?.id === column.id && "opacity-40 scale-95", isSelected && editMode && "ring-2 ring-purple-500")} style={{
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
              {column.column_type === 'completed' ? (
                editMode ? (
                  <button className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 border-2 border-white/40 dark:border-white/20 px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15),inset_0_2px_2px_rgba(255,255,255,0.7)] relative z-10 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[9px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none" onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteColumnId(column.id);
                    }}>
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-500" />
                    </button>
                ) : (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setShowArchiveDialog(true)}
                      className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 text-foreground border-2 border-white/40 dark:border-white/20 px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-white/30 dark:hover:bg-card/30 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15),inset_0_2px_2px_rgba(255,255,255,0.7)] relative z-10 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[9px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none"
                      title="Takenarchief"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setClearCompletedColumnId(column.id)}
                      className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 text-foreground border-2 border-white/40 dark:border-white/20 px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15),inset_0_2px_2px_rgba(255,255,255,0.7)] relative z-10 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[9px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none"
                      title={t('board.clearCompletedTasks')}
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-500" />
                    </button>
                  </div>
                )
              ) : (
                <div className="flex gap-1">
                  {(column.column_type === 'sick_leave' || column.column_type === 'vacation') && organizationId && !editMode && (
                    <AbsenceManagementDialog
                      organizationId={organizationId}
                      absenceType={column.column_type as "sick_leave" | "vacation"}
                      orgMembers={orgMembers}
                    >
                      <button className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 text-foreground border-2 border-white/40 dark:border-white/20 px-2.5 py-1.5 rounded-xl font-bold text-sm hover:bg-white/30 dark:hover:bg-card/30 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15),inset_0_2px_2px_rgba(255,255,255,0.7)] relative z-10 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[9px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none">
                        <BarChart3 className="h-4 w-4" />
                      </button>
                    </AbsenceManagementDialog>
                  )}
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
                    <DialogContent className="max-w-[96vw] sm:max-w-2xl max-h-[85vh] p-0 flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
                      <DialogHeader className="px-4 pt-6 sm:px-6 pb-3 shrink-0">
                        <DialogTitle>{column.column_type === 'sick_leave' ? 'Ziek melden' : column.column_type === 'vacation' ? 'Verlof melden' : `${t('board.addNewTask')} - ${column.name}`}</DialogTitle>
                      </DialogHeader>
                      <div className="overflow-y-auto flex-1 px-4 sm:px-6 pb-4 sm:pb-6">
                        <div className="space-y-3 sm:space-y-4 py-2">
                        <div>
                          <Label htmlFor={`title-${column.id}`}>{column.column_type === 'sick_leave' || column.column_type === 'vacation' ? t('board.name') : t('board.title')} *</Label>
                          {column.column_type === 'sick_leave' || column.column_type === 'vacation' ? (
                            (() => {
                              const memberNames = orgMembers.map(m => m.full_name);
                              const allNames = [...new Set([...memberNames, ...manualPersonNames])].sort();
                              return <PersonSearchSelect value={newTaskTitle} onValueChange={setNewTaskTitle} names={allNames} />;
                            })()
                          ) : (
                            <Input id={`title-${column.id}`} value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder={t('board.titlePlaceholder')} maxLength={200} />
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`description-${column.id}`}>{column.column_type === 'sick_leave' || column.column_type === 'vacation' ? t('board.reason') : t('common.description')}</Label>
                          <Textarea id={`description-${column.id}`} value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} placeholder={column.column_type === 'sick_leave' || column.column_type === 'vacation' ? t('board.reasonPlaceholder') : t('board.descriptionPlaceholder')} />
                        </div>
                        {(column.column_type === 'sick_leave' || column.column_type === 'vacation') && <>
                          <div>
                            <Label>Van</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {format(newTaskStartDate, "PPP", { locale: getDateLocale() })}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={newTaskStartDate} onSelect={(d) => d && setNewTaskStartDate(d)} initialFocus className="pointer-events-auto" />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div>
                            <Label>Tot en met</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newTaskEndDate && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {newTaskEndDate ? format(newTaskEndDate, "PPP", { locale: getDateLocale() }) : "Selecteer einddatum (optioneel)"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={newTaskEndDate} onSelect={setNewTaskEndDate} initialFocus className="pointer-events-auto" />
                                {newTaskEndDate && <div className="p-3 border-t">
                                  <Button variant="outline" className="w-full" onClick={() => setNewTaskEndDate(undefined)}>Einddatum verwijderen</Button>
                                </div>}
                              </PopoverContent>
                            </Popover>
                          </div>
                          {column.column_type === 'vacation' && <div>
                            <Label>Aantal uren</Label>
                            <Input type="number" min={0} max={24} step={0.5} value={newTaskHours} onChange={e => setNewTaskHours(e.target.value)} placeholder="8" />
                            <p className="text-xs text-muted-foreground mt-1">Alleen voor enkele dag, bij meerdere dagen wordt het werkrooster gebruikt</p>
                          </div>}
                        </>}
                      {!(column.column_type === 'sick_leave' || column.column_type === 'vacation') && <div>
                        <Label>{t('board.deadline')}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newTaskDueDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newTaskDueDate ? format(newTaskDueDate, "PPP", {
                                  locale: getDateLocale()
                                }) : t('board.selectDate')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={newTaskDueDate} onSelect={setNewTaskDueDate} initialFocus className="pointer-events-auto" />
                            {newTaskDueDate && <div className="p-3 border-t">
                                <Button variant="outline" className="w-full" onClick={() => setNewTaskDueDate(undefined)}>
                                  {t('board.removeDate')}
                                </Button>
                              </div>}
                          </PopoverContent>
                        </Popover>
                      </div>}
                      {!(column.column_type === 'sick_leave' || column.column_type === 'vacation') && <div>
                        <Label>{t('board.priority')}</Label>
                        <div className="flex gap-2">
                          <Button type="button" variant={newTaskPriority === null ? "default" : "outline"} onClick={() => setNewTaskPriority(null)} className="flex-1">
                            {t('board.priorityNone')}
                          </Button>
                          <Button type="button" variant={newTaskPriority === "low" ? "default" : "outline"} onClick={() => setNewTaskPriority("low")} className="flex-1">
                            {t('board.priorityLow')}
                          </Button>
                          <Button type="button" variant={newTaskPriority === "medium" ? "default" : "outline"} onClick={() => setNewTaskPriority("medium")} className="flex-1">
                            {t('board.priorityMedium')}
                          </Button>
                          <Button type="button" variant={newTaskPriority === "high" ? "default" : "outline"} onClick={() => setNewTaskPriority("high")} className="flex-1">
                            {t('board.priorityHigh')}
                          </Button>
                        </div>
                      </div>}
                      
                      {/* Team member assignment - hide for sick/vacation */}
                      {!(column.column_type === 'sick_leave' || column.column_type === 'vacation') && <div>
                        <Label>{t('board.assignedTo')}</Label>
                        <div className="space-y-3">
                          {newTaskAssignees.length > 0 && <div className="flex flex-wrap gap-2">
                            {newTaskAssignees.map(userId => {
                              const member = orgMembers.find(m => m.user_id === userId);
                              if (!member) return null;
                              return <div key={userId} className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={member.avatar_url || undefined} />
                                  <AvatarFallback className="text-sm font-bold bg-primary/30 text-primary">
                                    {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{member.full_name}</span>
                                <button onClick={() => setNewTaskAssignees(newTaskAssignees.filter(id => id !== userId))} className="ml-1 text-muted-foreground hover:text-destructive">
                                  ×
                                </button>
                              </div>;
                            })}
                          </div>}
                          <TeamMemberSelect 
                            members={orgMembers} 
                            selectedMembers={newTaskAssignees} 
                            onSelect={(userId) => {
                              if (!newTaskAssignees.includes(userId)) {
                                setNewTaskAssignees([...newTaskAssignees, userId]);
                              }
                            }} 
                            placeholder={t('board.addTeamMember')} 
                          />
                        </div>
                      </div>}
                      
                      {/* Recurrence - hide for sick/vacation */}
                      {!(column.column_type === 'sick_leave' || column.column_type === 'vacation') && <div className="border-t pt-3">
                        <RecurrenceSelect
                          pattern={newTaskRecurrencePattern}
                          interval={newTaskRecurrenceInterval}
                          endDate={newTaskRecurrenceEndDate}
                          onPatternChange={setNewTaskRecurrencePattern}
                          onIntervalChange={setNewTaskRecurrenceInterval}
                          onEndDateChange={setNewTaskRecurrenceEndDate}
                        />
                      </div>}
                      
                      {/* Checklist - hide for sick/vacation */}
                      {!(column.column_type === 'sick_leave' || column.column_type === 'vacation') && <div className="border-t pt-3">
                        <TaskChecklistCreate 
                          items={newTaskChecklistItems} 
                          onChange={setNewTaskChecklistItems} 
                        />
                      </div>}
                      
                      <button onClick={() => handleAddTask(column.id)} className="w-full backdrop-blur-md bg-primary/90 text-primary-foreground border-0 px-3.5 py-2.5 rounded-xl font-bold hover:bg-primary transition-all hover:shadow-lg">
                        {t('common.add')}
                      </button>
                      </div>
                    </div>
                  </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
            <div 
              ref={(el) => {
                if (el) {
                  const content = el.querySelector('[data-task-content]') as HTMLElement;
                  const fadeIndicator = el.querySelector('[data-fade-indicator]') as HTMLElement;
                  if (content && fadeIndicator) {
                    const containerHeight = el.clientHeight;
                    const contentHeight = content.scrollHeight;
                    const needsScroll = contentHeight > containerHeight;
                    el.style.overflowY = needsScroll ? 'auto' : 'hidden';
                    fadeIndicator.style.opacity = needsScroll ? '1' : '0';
                    
                    // Update fade on scroll
                    el.onscroll = () => {
                      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
                      fadeIndicator.style.opacity = isAtBottom ? '0' : '1';
                    };
                  }
                }
              }}
              onDragOver={e => handleDragOver(e, column.id)} 
              onDrop={e => handleDrop(e, column.id)}
              onDragLeave={() => setDraggedOverColumn(null)}
              className={cn(
                "flex-1 min-h-0 relative group/scroll [scrollbar-width:none] hover:[scrollbar-width:thin] overflow-x-hidden transition-all duration-200",
                draggedOverColumn === column.id && draggedTask?.column_id !== column.id && "drop-zone-active"
              )}
              style={{
                paddingRight: `${(displayColumn.content_padding_right || 0) + 16}px`,
                paddingBottom: `${displayColumn.content_padding_bottom || 0}px`,
                paddingLeft: `${(displayColumn.content_padding_left || 0) + 16}px`,
                overflowY: 'hidden'
              }} 
              onClick={e => {
                if (editMode) {
                  e.stopPropagation();
                  setSelectedColumn(column);
                }
              }}>
              {/* Fade gradient indicator for overflow - subtle */}
              <div 
                data-fade-indicator
                className="absolute bottom-0 pointer-events-none z-10 transition-opacity duration-300"
                style={{
                  left: '20px',
                  right: '20px',
                  height: '40px',
                  background: 'linear-gradient(to top, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                  opacity: 0,
                  borderRadius: '0 0 16px 16px'
                }}
              />
              {/* Task rendering - extra padding for shadows */}
              <div data-task-content className="grid gap-3 content-start [&>*]:transition-transform [&>*]:duration-200 [&>*]:ease-out" style={{
                paddingTop: '14px',
                paddingBottom: '16px',
                paddingLeft: '40px',
                paddingRight: '40px',
                marginLeft: '-28px',
                marginRight: '-28px'
              }}>
                {(() => {
                  const columnTasksFiltered = filterTasks(getColumnTasks(column.id));
                  const columnTasksForDrop = columnTasksFiltered.filter(t => t.id !== draggedTask?.id);
                  
                  return columnTasksFiltered.map((task, taskIndex) => {
                    const isSimpleColumn = column.column_type === 'sick_leave' || column.column_type === 'vacation';
                    const isOverdue = task.due_date ? new Date(task.due_date) < new Date(new Date().setHours(0, 0, 0, 0)) : false;
                    
                    // Calculate if we should show drop indicator before this task
                    const showDropIndicatorBefore = draggedTask && 
                      draggedOverColumn === column.id && 
                      draggedOverTaskIndex !== null &&
                      task.id !== draggedTask.id &&
                      (() => {
                        const indexInFiltered = columnTasksForDrop.findIndex(t => t.id === task.id);
                        return indexInFiltered === draggedOverTaskIndex;
                      })();
                    
                    // Show drop indicator at end of list
                    const isLastTask = taskIndex === columnTasksFiltered.length - 1;
                    const showDropIndicatorAfter = isLastTask && 
                      draggedTask && 
                      draggedOverColumn === column.id && 
                      draggedOverTaskIndex !== null &&
                      draggedOverTaskIndex >= columnTasksForDrop.length &&
                      task.id !== draggedTask.id;
                    
                    if (isSimpleColumn) {
                      return <SimpleTaskCard key={task.id} taskId={task.id} title={task.title} description={task.description} dueDate={task.due_date} onClick={() => !isDragging && openEditDialog(task)} glowShadow={getGlowStyles(column.glow_type).cardShadow} assignees={task.assignees} glowGradient={getGlowStyles(column.glow_type).cardGradient} columns={columns} />;
                    }
                    return (
                      <div 
                        key={task.id}
                        className={cn(
                          "transition-all duration-200 ease-out",
                          draggedTask?.id === task.id && "opacity-40 scale-95"
                        )}
                        style={{
                          // Trigger layout animation when order changes
                          transform: draggedTask?.id === task.id ? 'scale(0.95)' : 'scale(1)'
                        }}
                      >
                        {showDropIndicatorBefore && (
                          <div className="h-1 bg-primary rounded-full mb-3 animate-pulse" />
                        )}
                        <article
                          data-task-id={task.id}
                          onPointerDown={e => handleTaskPointerDown(e, task, column.glow_type)}
                          onPointerMove={handleTaskPointerMove}
                          onPointerUp={handleTaskPointerUp}
                          onPointerCancel={handleTaskPointerUp}
                          className={cn(
                            "relative backdrop-blur-[60px] bg-white/25 dark:bg-card/25 border-2 rounded-[28px] p-3 cursor-grab will-change-transform transform-gpu select-none touch-none",
                            "before:absolute before:inset-0 before:rounded-[28px] before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity",
                            "after:absolute after:inset-[1px] after:rounded-[27px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none",
                            !isDragging && "hover:-translate-y-2 transition-all duration-200",
                            "border-white/40 dark:border-white/20",
                            getGlowStyles(column.glow_type).cardGradient,
                            getGlowStyles(column.glow_type).cardShadow,
                            isOverdue && !draggedTask && "animate-overdue-glow"
                          )}
                        >
                          <div className="absolute top-2.5 left-2.5 text-muted-foreground/50 text-sm select-none pointer-events-none">☰</div>
                          <div className="flex gap-2 items-start">
                            <div className="flex-1 min-w-0 pl-4">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1 relative z-10">
                                <AttachmentCount taskId={task.id} />
                                {task.due_date && <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${getDeadlineBadgeColor(task.due_date)}`}>
                                    📅 {format(new Date(task.due_date), "d MMM", {
                                      locale: getDateLocale()
                                    })}
                                  </span>}
                                {task.priority && getPriorityBadge(task.priority) && <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-bold border", getPriorityBadge(task.priority)!.color)}>
                                    {getPriorityBadge(task.priority)!.label}
                                  </span>}
                              </div>
                              <h4 className="font-extrabold text-[clamp(13px,1.5vw,16px)] mb-1 text-foreground relative z-10">
                                {task.title}
                              </h4>
                              {task.description && <p className="text-muted-foreground text-[clamp(11px,1.2vw,13px)] relative z-10 line-clamp-2">
                                  {task.description}
                                </p>}
                            </div>
                            {task.assignees && task.assignees.length > 0 && <div className="flex items-center gap-0.5 relative z-10 flex-shrink-0">
                                {task.assignees.slice(0, 3).map((assignee, idx) => <Avatar key={assignee.user_id} className="h-9 w-9 border-2 border-white" style={{
                                  marginLeft: idx > 0 ? '-6px' : '0'
                                }}>
                                    <AvatarImage src={assignee.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs bg-primary/10">
                                      {assignee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>)}
                                {task.assignees.length > 3 && <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold" style={{
                                  marginLeft: '-6px'
                                }}>
                                    +{task.assignees.length - 3}
                                  </div>}
                            </div>}
                          </div>
                        </article>
                        {showDropIndicatorAfter && (
                          <div className="h-1 bg-primary rounded-full mt-3 animate-pulse" />
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </section>;
          })}
      </main>}

      {/* Task View/Edit Dialog */}
      <Dialog open={editingTask !== null} onOpenChange={open => {
        if (!open) {
          setEditingTask(null);
          setIsTaskEditMode(false);
        }
      }}>
        <DialogContent className="max-w-[96vw] sm:max-w-3xl max-h-[85vh] p-0 flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader className="px-4 pt-6 sm:px-6 pb-3 shrink-0 border-b">
            <DialogTitle>{(() => {
              const taskCol = columns.find(c => c.id === editingTask?.column_id);
              const isSick = taskCol?.column_type === 'sick_leave';
              const isVacation = taskCol?.column_type === 'vacation';
              if (isTaskEditMode) {
                return isSick ? 'Ziekmelding bewerken' : isVacation ? 'Verlof bewerken' : t('board.editTask');
              }
              return isSick ? 'Ziekmelding' : isVacation ? 'Verlof' : t('board.taskDetails');
            })()}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-3 sm:space-y-4 py-4">
            {(() => {
                const taskColumn = columns.find(c => c.id === editingTask?.column_id);
                const isSimpleColumn = taskColumn && (taskColumn.column_type === 'sick_leave' || taskColumn.column_type === 'vacation');
                
                // VIEW MODE
                if (!isTaskEditMode) {
                  return <>
                    {/* Task Title */}
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{editingTask?.title}</h2>
                      {taskColumn && !isSimpleColumn && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('board.inColumn')}: <span className="font-medium text-foreground">{taskColumn.name}</span>
                        </p>
                      )}
                    </div>
                    
                    {/* Badges row - hide for sick/vacation */}
                    {!isSimpleColumn && <div className="flex flex-wrap gap-2">
                      {editTaskDueDate && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getDeadlineBadgeColor(editTaskDueDate.toISOString())}`}>
                          <CalendarIcon className="h-4 w-4" />
                          {format(editTaskDueDate, "PPP", { locale: getDateLocale() })}
                        </span>
                      )}
                      {editTaskPriority && getPriorityBadge(editTaskPriority) && (
                        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border", getPriorityBadge(editTaskPriority)!.color)}>
                          {getPriorityBadge(editTaskPriority)!.label}
                        </span>
                      )}
                    </div>}
                    
                    {/* Description */}
                    {editTaskDescription && (
                      <div className="bg-muted/50 rounded-xl p-4">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
                          {isSimpleColumn ? t('board.reason') : t('common.description')}
                        </Label>
                        <p className="text-foreground whitespace-pre-wrap">{editTaskDescription}</p>
                      </div>
                    )}
                    
                    {/* Assignees - hide for sick/vacation */}
                    {!isSimpleColumn && editTaskAssignees.length > 0 && (
                      <div>
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-3 block">{t('board.assignedTo')}</Label>
                        <div className="flex flex-wrap gap-2">
                          {editTaskAssignees.map(userId => {
                            const member = orgMembers.find(m => m.user_id === userId);
                            if (!member) return null;
                            return (
                              <div key={userId} className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.avatar_url || undefined} />
                                  <AvatarFallback className="text-sm font-bold bg-primary/30 text-primary">
                                    {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{member.full_name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Checklist - hide for sick/vacation */}
                    {editingTask && !isSimpleColumn && (
                      <div className="border-t pt-4">
                        <TaskChecklist taskId={editingTask.id} readOnly />
                      </div>
                    )}
                    
                    {/* Attachments */}
                    {editingTask && !isSimpleColumn && <TaskAttachments taskId={editingTask.id} readOnly />}
                    
                    {/* Time Tracker - view mode */}
                    {editingTask && !isSimpleColumn && (
                      <div className="border-t pt-4">
                        <TimeTracker taskId={editingTask.id} isEditMode={false} />
                      </div>
                    )}
                    
                    {/* Dependencies - view mode */}
                    {editingTask && !isSimpleColumn && (
                      <div className="border-t pt-4">
                        <TaskDependencies taskId={editingTask.id} allTasks={tasks} isEditMode={false} />
                      </div>
                    )}
                    
                    {/* Reminders - hide for sick/vacation */}
                    {editingTask && !isSimpleColumn && (
                      <div className="border-t pt-4">
                        <TaskReminders taskId={editingTask.id} dueDate={editTaskDueDate?.toISOString() || null} />
                      </div>
                    )}
                    
                    {/* History - hide for sick/vacation */}
                    {editingTask && !isSimpleColumn && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Geschiedenis</Label>
                          <TaskHistoryDialog taskId={editingTask.id} columns={columns} />
                        </div>
                      </div>
                    )}
                    
                    {/* Absence history for sick/vacation */}
                    {editingTask && isSimpleColumn && organizationId && (
                      <AbsenceHistorySection 
                        personName={editingTask.title} 
                        organizationId={organizationId} 
                        absenceType={taskColumn.column_type as "sick_leave" | "vacation"} 
                      />
                    )}
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 pt-4 border-t">
                      {isSimpleColumn && (
                        <Button onClick={handleDeleteFromDialog} variant="default" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                          ✅ {taskColumn?.column_type === 'sick_leave' ? 'Beter melden' : 'Verlof beëindigen'}
                        </Button>
                      )}
                      <Button onClick={() => setIsTaskEditMode(true)} variant={isSimpleColumn ? "outline" : "default"} className={isSimpleColumn ? "" : "flex-1"}>
                        <Pencil className="h-4 w-4 mr-2" />
                        {t('common.edit')}
                      </Button>
                      {!isSimpleColumn && <Button onClick={() => setExportDialogOpen(true)} variant="outline">
                        <Mail className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">{t('board.exportTask')}</span>
                      </Button>}
                    </div>
                  </>;
                }
                
                // EDIT MODE
                return <>
                  <div>
                    <Label htmlFor="edit-title">{isSimpleColumn ? t('board.name') : t('board.title')} *</Label>
                    <Input id="edit-title" value={editTaskTitle} onChange={e => setEditTaskTitle(e.target.value)} placeholder={isSimpleColumn ? t('board.namePlaceholder') : t('board.titlePlaceholder')} maxLength={200} />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">{isSimpleColumn ? t('board.reason') : t('common.description')}</Label>
                    <Textarea id="edit-description" value={editTaskDescription} onChange={e => setEditTaskDescription(e.target.value)} placeholder={isSimpleColumn ? t('board.reasonPlaceholder') : t('board.descriptionPlaceholder')} rows={4} />
                  </div>
                  {!isSimpleColumn && <div>
                      <Label>{t('board.priority')}</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant={editTaskPriority === null ? "default" : "outline"} onClick={() => setEditTaskPriority(null)} className="flex-1">
                          {t('board.priorityNone')}
                        </Button>
                        <Button type="button" variant={editTaskPriority === "low" ? "default" : "outline"} onClick={() => setEditTaskPriority("low")} className="flex-1">
                          {t('board.priorityLow')}
                        </Button>
                        <Button type="button" variant={editTaskPriority === "medium" ? "default" : "outline"} onClick={() => setEditTaskPriority("medium")} className="flex-1">
                          {t('board.priorityMedium')}
                        </Button>
                        <Button type="button" variant={editTaskPriority === "high" ? "default" : "outline"} onClick={() => setEditTaskPriority("high")} className="flex-1">
                          {t('board.priorityHigh')}
                        </Button>
                      </div>
                    </div>}
                  {!isSimpleColumn && <div>
                    <Label>{t('board.deadline')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editTaskDueDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editTaskDueDate ? format(editTaskDueDate, "PPP", {
                            locale: getDateLocale()
                          }) : t('board.selectDate')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={editTaskDueDate} onSelect={setEditTaskDueDate} initialFocus locale={getDateLocale()} className="pointer-events-auto" />
                        {editTaskDueDate && <div className="p-3 border-t">
                            <Button variant="ghost" className="w-full" onClick={() => setEditTaskDueDate(undefined)}>
                              {t('board.clearDate')}
                            </Button>
                          </div>}
                      </PopoverContent>
                    </Popover>
                  </div>}
                  
                  {!isSimpleColumn && <div>
                    <Label>{t('board.assignedTo')}</Label>
                    <div className="space-y-3">
                      {editTaskAssignees.length > 0 && <div className="flex flex-wrap gap-2">
                          {editTaskAssignees.map(userId => {
                          const member = orgMembers.find(m => m.user_id === userId);
                          if (!member) return null;
                          return <div key={userId} className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={member.avatar_url || undefined} />
                                  <AvatarFallback className="text-sm font-bold bg-primary/30 text-primary">
                                    {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{member.full_name}</span>
                                <button onClick={() => handleRemoveAssignee(userId)} className="ml-1 text-muted-foreground hover:text-destructive">
                                  ×
                                </button>
                              </div>;
                        })}
                        </div>}
                      <TeamMemberSelect members={orgMembers} selectedMembers={editTaskAssignees} onSelect={handleAddAssignee} placeholder={t('board.addTeamMember')} />
                    </div>
                  </div>}
                  
                  {/* Checklist - hide for sick/vacation */}
                  {editingTask && !isSimpleColumn && (
                    <div className="border-t pt-4">
                      <TaskChecklist taskId={editingTask.id} />
                    </div>
                  )}
                  
                  {editingTask && !isSimpleColumn && <TaskAttachments taskId={editingTask.id} />}
                  
                  {/* Time Tracker - edit mode */}
                  {editingTask && !isSimpleColumn && (
                    <div className="border-t pt-4">
                      <TimeTracker taskId={editingTask.id} isEditMode={true} />
                    </div>
                  )}
                  
                  {/* Dependencies - edit mode */}
                  {editingTask && !isSimpleColumn && (
                    <div className="border-t pt-4">
                      <TaskDependencies taskId={editingTask.id} allTasks={tasks} isEditMode={true} />
                    </div>
                  )}
                  
                  {editingTask && !isSimpleColumn && <div className="border-t pt-4">
                      <TaskReminders taskId={editingTask.id} dueDate={editTaskDueDate?.toISOString() || null} />
                    </div>}
                  
                  {editingTask && !isSimpleColumn && <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label>Geschiedenis</Label>
                        <TaskHistoryDialog taskId={editingTask.id} columns={columns} />
                      </div>
                    </div>}
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleDeleteFromDialog} variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('common.delete')}
                    </Button>
                    <Button onClick={() => setIsTaskEditMode(false)} variant="outline">
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleEditTask} className="flex-1">
                      {t('common.save')}
                    </Button>
                  </div>
                </>;
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Task Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-[96vw] sm:max-w-lg max-h-[85vh] flex flex-col p-4 sm:p-6" onOpenAutoFocus={(e) => e.preventDefault()} onInteractOutside={e => {
            // Prevent closing when clicking on Select dropdown
            const target = e.target as HTMLElement;
            if (target.closest('[role="listbox"]') || target.closest('[data-radix-select-content]')) {
              e.preventDefault();
            }
          }}>
          <DialogHeader className="shrink-0 pb-3">
            <DialogTitle>{t('board.exportTaskTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 py-2">
            {/* Team Members Selection */}
            <div>
              <Label>{t('board.exportSelectMembers')}</Label>
              <div className="space-y-3">
                {exportSelectedMembers.length > 0 && <div className="flex flex-wrap gap-2">
                    {exportSelectedMembers.map(userId => {
                      const member = orgMembersWithEmails.find(m => m.user_id === userId);
                      if (!member) return null;
                      return <div key={userId} className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="text-sm font-bold bg-primary/30 text-primary">
                              {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{member.full_name}</span>
                          <button onClick={() => setExportSelectedMembers(exportSelectedMembers.filter(id => id !== userId))} className="ml-1 text-muted-foreground hover:text-destructive">
                            ×
                          </button>
                        </div>;
                    })}
                  </div>}
                <TeamMemberSelect members={orgMembersWithEmails} selectedMembers={exportSelectedMembers} onSelect={userId => {
                    setExportSelectedMembers([...exportSelectedMembers, userId]);
                  }} placeholder={t('board.addTeamMember')} />
              </div>
            </div>

            {/* External Email Addresses */}
            <div>
              <Label htmlFor="export-emails">{t('board.exportExternalEmails')}</Label>
              <Input id="export-emails" value={exportEmails} onChange={e => setExportEmails(e.target.value)} placeholder={t('board.exportEmailsPlaceholder')} />
              <p className="text-xs text-muted-foreground mt-1">
                {t('board.exportEmailsHint')}
              </p>
            </div>
            
            <div>
              <Label htmlFor="export-message">{t('board.exportMessage')}</Label>
              <Textarea id="export-message" value={exportMessage} onChange={e => setExportMessage(e.target.value)} placeholder={t('board.exportMessagePlaceholder')} rows={3} />
            </div>
            
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="export-attachments" checked={exportIncludeAttachments} onChange={e => setExportIncludeAttachments(e.target.checked)} className="rounded" />
              <Label htmlFor="export-attachments" className="cursor-pointer">
                {t('board.exportIncludeAttachments')}
              </Label>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('board.exportInfo')}
              </p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button onClick={() => setExportDialogOpen(false)} variant="outline" className="flex-1">
                {t('common.cancel')}
              </Button>
              <Button onClick={handleExportTask} disabled={exportingTask} className="flex-1">
                {exportingTask ? t('board.exporting') : t('board.sendEmail')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Column Management Dialog */}
      <ColumnManagement open={columnManagementOpen} onOpenChange={setColumnManagementOpen} columns={columns} boardId={board?.id || ''} onColumnsChange={fetchBoardData} />

      {/* Edit mode toolbar - rendered before sidebar so sidebar is on top */}
      {editMode && !isMobile && <div className="fixed top-[90px] left-[22px] right-[22px] z-20 flex items-center justify-between px-4 py-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-lg my-[70px]">
          <span className="text-sm font-semibold text-primary">
            🔧 {t('board.editModeActive')}
          </span>
          <div className="flex items-center gap-2">
            {(userPlan === 'team' || userPlan === 'business') && <div className="flex items-center gap-2 border-r border-primary/20 pr-2">
                <Select value={!backgroundImageUrl && selectedBackground === 'from-background via-primary/5 to-accent/5' ? 'default' : selectedBackground} onValueChange={value => {
                if (value === 'default') {
                  handleSetDefaultBackground();
                } else {
                  handleBackgroundChange(value);
                }
              }} disabled={!canCustomizeBackground}>
                  <SelectTrigger className="w-[200px]">
                    <span>🎨 {t('board.backgroundsLabel')}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">{t('board.backgroundDefault')}</SelectItem>
                    <SelectItem value="from-blue-50 to-blue-100">{t('board.backgroundBlue')}</SelectItem>
                    <SelectItem value="from-purple-50 to-pink-100">{t('board.backgroundPurplePink')}</SelectItem>
                    <SelectItem value="from-green-50 to-emerald-100">{t('board.backgroundGreen')}</SelectItem>
                    <SelectItem value="from-orange-50 to-yellow-100">{t('board.backgroundOrangeYellow')}</SelectItem>
                    <SelectItem value="from-gray-50 to-gray-100">{t('board.backgroundGray')}</SelectItem>
                    <SelectItem value="from-rose-50 to-pink-100">{t('board.backgroundRose')}</SelectItem>
                    <SelectItem value="from-cyan-50 to-blue-100">{t('board.backgroundCyan')}</SelectItem>
                    <SelectItem value="from-indigo-50 to-purple-100">{t('board.backgroundIndigo')}</SelectItem>
                  </SelectContent>
                </Select>
                
                {backgroundImageUrl ? <Button size="sm" variant="destructive" onClick={handleRemoveBackgroundImage} disabled={!canCustomizeBackground} className="flex items-center gap-1">
                    <X className="h-4 w-4" />
                    {t('board.removeImage')}
                  </Button> : <Button size="sm" variant="outline" disabled={uploadingBackground || !canCustomizeBackground} className="relative flex items-center gap-1">
                    <input type="file" accept="image/*" onChange={handleBackgroundImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploadingBackground || !canCustomizeBackground} />
                    <Image className="h-4 w-4" />
                    {uploadingBackground ? t('board.uploading') : t('board.addImage')}
                  </Button>}
              </div>}
            {(userPlan === 'free' || userPlan === 'pro') && <div className="text-xs text-muted-foreground border-r border-primary/20 pr-2">
                🎨 {t('board.backgroundUpgradeRequired')}
              </div>}
            
            <Button onClick={handleAddColumn} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('board.addColumn')}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Widget toevoegen
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Widgets</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => handleAddWidget('notes')}>
                  <StickyNote className="mr-2 h-4 w-4" />
                  📝 Notities
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleAddWidget('timer')}>
                  <Clock className="mr-2 h-4 w-4" />
                  ⏱️ Timer
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleAddWidget('calendar')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  📅 Kalender
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleAddWidget('calculator')}>
                  <Calculator className="mr-2 h-4 w-4" />
                  🧮 Rekenmachine
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleAddWidget('achievements')}>
                  <Trophy className="mr-2 h-4 w-4" />
                  🏆 Achievement Badges
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleAddWidget('quick-links')}>
                  <Link className="mr-2 h-4 w-4" />
                  🔗 Snelkoppelingen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>}

      {/* Column Edit Sidebar */}
      {editingColumn && <ColumnEditSidebar column={editingColumn} onClose={() => setEditingColumn(null)} onSave={fetchBoardData} />}

      {/* Background Crop Editor */}
      {cropEditorOpen && (pendingImagePreview || backgroundImageUrl) && <BackgroundCropEditor imageUrl={pendingImagePreview || backgroundImageUrl!} initialPositionX={backgroundPositionX} initialPositionY={backgroundPositionY} initialScale={backgroundScale} initialFitMode={backgroundFitMode} onClose={() => {
          setCropEditorOpen(false);
          // Clean up preview URL if exists
          if (pendingImagePreview) {
            URL.revokeObjectURL(pendingImagePreview);
            setPendingImagePreview(null);
            setPendingImageFile(null);
          }
        }} onApply={handleApplyBackgroundCrop} />}

      {/* Delete Column Confirmation */}
      <AlertDialog open={!!deleteColumnId} onOpenChange={open => !open && setDeleteColumnId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('board.deleteColumn')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('board.deleteColumnConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteColumn} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Completed Tasks Confirmation */}
      <AlertDialog open={!!clearCompletedColumnId} onOpenChange={open => !open && setClearCompletedColumnId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('board.clearCompletedTasks')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('board.clearCompletedTasksConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearCompletedTasks} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        </div>
      </div>
      
      <NotificationPermissionBanner />
      
      {/* Logo links onderaan */}
      <img src={logo} alt="LinqBoard Logo" className="fixed -bottom-8 left-2 h-32 w-auto z-50 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate(isDemo ? "/" : "/dashboard")} />
      
      {/* Fixed AI Chat Widget rechtsonder (alleen voor ingelogde gebruikers) */}
      {!isDemo && board && <FixedChatWidget boardId={board.id} boardName={board.name} organizationId={organizationId || undefined} orgMembers={orgMembers} />}
      
      {/* Floating Drag Preview - Exact replica of task card */}
      {draggedTask && taskDragPosition && (() => {
        const glowStyles = getGlowStyles(draggedTaskGlowRef.current);
        // Clamp rotation between -8 and 8 degrees based on horizontal velocity
        const rotation = Math.max(-8, Math.min(8, taskDragVelocity.x * 0.5));
        
        return (
          <div 
            className="fixed pointer-events-none z-[1000] will-change-transform transform-gpu"
            style={{
              left: taskDragPosition.x - taskDragOffset.x,
              top: taskDragPosition.y - taskDragOffset.y,
              width: `${taskDragWidth}px`,
              transform: `scale(${BOARD_SCALE}) rotate(${rotation}deg)`,
              transformOrigin: `${taskDragOffset.x / BOARD_SCALE}px ${taskDragOffset.y / BOARD_SCALE}px`,
              transition: 'transform 0.1s ease-out',
            }}
          >
            <article className={cn(
              "relative backdrop-blur-[60px] bg-white/25 dark:bg-card/25 border-2 rounded-[28px] p-3",
              "border-white/40 dark:border-white/20",
              "shadow-[0_25px_60px_rgba(0,0,0,0.35)]",
              "before:absolute before:inset-0 before:rounded-[28px] before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none",
              "after:absolute after:inset-[1px] after:rounded-[27px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none",
              glowStyles.cardGradient,
              glowStyles.cardShadow
            )}>
              <div className="absolute top-2.5 left-2.5 text-muted-foreground/50 text-sm select-none pointer-events-none">☰</div>
              <div className="flex gap-2 items-start">
                <div className="flex-1 min-w-0 pl-4">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1 relative z-10">
                    {draggedTask.due_date && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${getDeadlineBadgeColor(draggedTask.due_date)}`}>
                        📅 {format(new Date(draggedTask.due_date), "d MMM", { locale: getDateLocale() })}
                      </span>
                    )}
                    {draggedTask.priority && getPriorityBadge(draggedTask.priority) && (
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-bold border", getPriorityBadge(draggedTask.priority)!.color)}>
                        {getPriorityBadge(draggedTask.priority)!.label}
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-[clamp(13px,1.5vw,16px)] mb-1 text-foreground relative z-10">
                    {draggedTask.title}
                  </h4>
                  {draggedTask.description && (
                    <p className="text-muted-foreground text-[clamp(11px,1.2vw,13px)] line-clamp-2 relative z-10">
                      {draggedTask.description}
                    </p>
                  )}
                </div>
                {draggedTask.assignees && draggedTask.assignees.length > 0 && (
                  <div className="flex items-center gap-0.5 relative z-10 flex-shrink-0">
                    {draggedTask.assignees.slice(0, 3).map((assignee, idx) => (
                      <Avatar key={assignee.user_id} className="h-9 w-9 border-2 border-white" style={{ marginLeft: idx > 0 ? '-6px' : '0' }}>
                        <AvatarImage src={assignee.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10">
                          {assignee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {draggedTask.assignees.length > 3 && (
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold" style={{ marginLeft: '-6px' }}>
                        +{draggedTask.assignees.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </article>
          </div>
        );
      })()}

      {board && <TaskArchiveDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog} boardId={board.id} columns={columns} />}
    </div>;
};
export default Board;