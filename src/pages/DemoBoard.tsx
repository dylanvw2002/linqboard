import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarIcon, ArrowLeft, Eye, Maximize, Minimize, ZoomIn, ZoomOut } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-transparent.png";
import defaultBackground from "@/assets/default-board-background.png";
import { SimpleTaskCard } from "@/components/SimpleTaskCard";
import { getGlowStyles, GlowType } from "@/lib/glowStyles";
import { ColumnType } from "@/lib/columnTypes";

interface Column {
  id: string;
  name: string;
  position: number;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
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
  attachment_count?: number;
}

// Demo data - 5 team members
const demoMembers: Assignee[] = [
  { user_id: '1', full_name: 'Sophie van den Berg', avatar_url: undefined },
  { user_id: '2', full_name: 'Lars Jansen', avatar_url: undefined },
  { user_id: '3', full_name: 'Emma de Vries', avatar_url: undefined },
  { user_id: '4', full_name: 'Thomas Bakker', avatar_url: undefined },
  { user_id: '5', full_name: 'Lisa Vermeulen', avatar_url: undefined },
];

// Demo columns - 6 columns
const initialDemoColumns: Column[] = [
  {
    id: 'col-1',
    name: 'Te Doen',
    position: 0,
    x_position: 40,
    y_position: 50,
    width: 320,
    height: 600,
    glow_type: 'blue',
    column_type: 'regular'
  },
  {
    id: 'col-2',
    name: 'In Uitvoering',
    position: 1,
    x_position: 400,
    y_position: 50,
    width: 320,
    height: 600,
    glow_type: 'yellow',
    column_type: 'regular'
  },
  {
    id: 'col-3',
    name: 'Review',
    position: 2,
    x_position: 760,
    y_position: 50,
    width: 320,
    height: 600,
    glow_type: 'purple',
    column_type: 'regular'
  },
  {
    id: 'col-4',
    name: 'Ziek',
    position: 3,
    x_position: 1120,
    y_position: 50,
    width: 320,
    height: 600,
    glow_type: 'red',
    column_type: 'sick_leave'
  },
  {
    id: 'col-5',
    name: 'Verlof',
    position: 4,
    x_position: 1480,
    y_position: 50,
    width: 320,
    height: 600,
    glow_type: 'blue',
    column_type: 'vacation'
  },
  {
    id: 'col-6',
    name: 'Afgerond',
    position: 5,
    x_position: 1840,
    y_position: 50,
    width: 320,
    height: 600,
    glow_type: 'green',
    column_type: 'regular'
  },
];

// Demo tasks - 30 tasks
const initialDemoTasks: Task[] = [
  // Te Doen - 7 tasks (1 OVERDUE)
  {
    id: 'task-1',
    column_id: 'col-1',
    title: 'Urgente klantrapportage Q2',
    description: 'Kwartaalrapport voor belangrijkste klant moet worden opgeleverd',
    priority: 'high',
    position: 0,
    due_date: '2025-04-05T17:00:00Z', // OVERDUE - 5 dagen geleden!
    assignees: [demoMembers[0]],
    attachment_count: 2
  },
  {
    id: 'task-2',
    column_id: 'col-1',
    title: 'Website redesign starten',
    description: 'Nieuwe homepage designs reviewen en goedkeuren',
    priority: 'high',
    position: 1,
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Morgen
    assignees: [demoMembers[0], demoMembers[2]]
  },
  {
    id: 'task-3',
    column_id: 'col-1',
    title: 'Marketing campagne Q2 voorbereiden',
    description: 'Strategie en content kalender uitwerken',
    priority: 'medium',
    position: 2,
    assignees: [demoMembers[0]]
  },
  {
    id: 'task-4',
    column_id: 'col-1',
    title: 'API documentatie updaten',
    description: 'Nieuwe endpoints documenteren voor developers',
    priority: 'low',
    position: 3,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: [demoMembers[1]],
    attachment_count: 1
  },
  {
    id: 'task-5',
    column_id: 'col-1',
    title: 'SEO audit uitvoeren',
    description: 'Technische SEO analyse en action plan',
    priority: 'medium',
    position: 4,
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: [demoMembers[0]]
  },
  {
    id: 'task-6',
    column_id: 'col-1',
    title: 'Newsletter template ontwerpen',
    description: 'Responsive email template voor maandelijkse nieuwsbrief',
    priority: 'low',
    position: 5,
    assignees: [demoMembers[2]]
  },
  {
    id: 'task-7',
    column_id: 'col-1',
    title: 'Product roadmap Q3 plannen',
    description: 'Feature prioritering en planning voor Q3',
    priority: 'high',
    position: 6,
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: [demoMembers[3]]
  },

  // In Uitvoering - 6 tasks
  {
    id: 'task-8',
    column_id: 'col-2',
    title: 'Mobile app development',
    description: 'React Native app bouwen voor iOS en Android',
    priority: 'high',
    position: 0,
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: [demoMembers[1]],
    attachment_count: 5
  },
  {
    id: 'task-9',
    column_id: 'col-2',
    title: 'Email automation workflow',
    description: 'Mailchimp integratie en automated sequences',
    priority: 'medium',
    position: 1,
    assignees: [demoMembers[0], demoMembers[3]]
  },
  {
    id: 'task-10',
    column_id: 'col-2',
    title: 'Customer dashboard redesign',
    description: 'UX verbeteringen en nieuwe metrics visualisatie',
    priority: 'high',
    position: 2,
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: [demoMembers[2]],
    attachment_count: 3
  },
  {
    id: 'task-11',
    column_id: 'col-2',
    title: 'Performance monitoring implementeren',
    description: 'Sentry en DataDog setup voor error tracking',
    priority: 'medium',
    position: 3,
    assignees: [demoMembers[1]]
  },
  {
    id: 'task-12',
    column_id: 'col-2',
    title: 'Sales presentatie voorbereiden',
    description: 'Q2 pitch deck en demo video produceren',
    priority: 'high',
    position: 4,
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: [demoMembers[4]],
    attachment_count: 3
  },
  {
    id: 'task-13',
    column_id: 'col-2',
    title: 'UI component library uitbreiden',
    description: 'Nieuwe components toevoegen aan design system',
    priority: 'low',
    position: 5,
    assignees: [demoMembers[2], demoMembers[1]]
  },

  // Review - 4 tasks
  {
    id: 'task-14',
    column_id: 'col-3',
    title: 'Q1 Marketing rapport',
    description: 'Analyse campagne resultaten en ROI berekening',
    priority: 'medium',
    position: 0,
    assignees: [demoMembers[0]],
    attachment_count: 12
  },
  {
    id: 'task-15',
    column_id: 'col-3',
    title: 'Beta testing feedback verwerken',
    description: 'User feedback categoriseren en prioriteren',
    priority: 'high',
    position: 1,
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: [demoMembers[3], demoMembers[2]]
  },
  {
    id: 'task-16',
    column_id: 'col-3',
    title: 'Security audit rapport analyseren',
    description: 'Penetration test resultaten reviewen en fixes plannen',
    priority: 'high',
    position: 2,
    assignees: [demoMembers[1]],
    attachment_count: 5
  },
  {
    id: 'task-17',
    column_id: 'col-3',
    title: 'Customer satisfaction survey resultaten',
    description: 'NPS scores en feedback analyseren',
    priority: 'low',
    position: 3,
    assignees: [demoMembers[4]]
  },

  // Ziek - 3 tasks
  {
    id: 'task-18',
    column_id: 'col-4',
    title: 'Sophie van den Berg',
    description: 'Griep - Verwacht terug 12 april',
    priority: null,
    position: 0,
    due_date: '2025-04-12T09:00:00Z',
    assignees: [demoMembers[0]]
  },
  {
    id: 'task-19',
    column_id: 'col-4',
    title: 'Lars Jansen',
    description: 'Doktersafspraak + herstel',
    priority: null,
    position: 1,
    due_date: '2025-04-10T18:00:00Z',
    assignees: [demoMembers[1]]
  },
  {
    id: 'task-20',
    column_id: 'col-4',
    title: 'Thomas Bakker',
    description: 'Ziek thuis - 2-3 dagen',
    priority: null,
    position: 2,
    due_date: '2025-04-11T09:00:00Z',
    assignees: [demoMembers[3]]
  },

  // Verlof - 4 tasks
  {
    id: 'task-21',
    column_id: 'col-5',
    title: 'Emma de Vries',
    description: 'Vakantie Frankrijk (goedgekeurd)',
    priority: null,
    position: 0,
    due_date: '2025-04-26T23:59:59Z',
    assignees: [demoMembers[2]]
  },
  {
    id: 'task-22',
    column_id: 'col-5',
    title: 'Lisa Vermeulen',
    description: 'Verlofdag',
    priority: null,
    position: 1,
    due_date: '2025-04-12T23:59:59Z',
    assignees: [demoMembers[4]]
  },
  {
    id: 'task-23',
    column_id: 'col-5',
    title: 'Sophie van den Berg',
    description: 'Meivakantie (aangevraagd)',
    priority: null,
    position: 2,
    due_date: '2025-05-10T23:59:59Z',
    assignees: [demoMembers[0]]
  },
  {
    id: 'task-24',
    column_id: 'col-5',
    title: 'Lars Jansen',
    description: 'Vrije dagen (goedgekeurd)',
    priority: null,
    position: 3,
    due_date: '2025-04-19T23:59:59Z',
    assignees: [demoMembers[1]]
  },

  // Afgerond - 6 tasks
  {
    id: 'task-25',
    column_id: 'col-6',
    title: 'Logo redesign afgerond',
    description: 'Nieuwe brand identity gelanceerd',
    priority: 'medium',
    position: 0,
    assignees: [demoMembers[2]]
  },
  {
    id: 'task-26',
    column_id: 'col-6',
    title: 'Payment gateway integratie live',
    description: 'Stripe en iDeal betalingen actief',
    priority: 'high',
    position: 1,
    assignees: [demoMembers[1]]
  },
  {
    id: 'task-27',
    column_id: 'col-6',
    title: 'Dashboard v2.0 gelanceerd',
    description: 'Nieuwe features live voor alle users',
    priority: 'high',
    position: 2,
    assignees: [demoMembers[3], demoMembers[1]]
  },
  {
    id: 'task-28',
    column_id: 'col-6',
    title: 'Q4 Sales targets behaald',
    description: '115% van target gerealiseerd',
    priority: 'high',
    position: 3,
    assignees: [demoMembers[4]]
  },
  {
    id: 'task-29',
    column_id: 'col-6',
    title: 'Team onboarding programma compleet',
    description: 'Alle nieuwe medewerkers succesvol onboarded',
    priority: 'low',
    position: 4,
    assignees: [demoMembers[0]]
  },
  {
    id: 'task-30',
    column_id: 'col-6',
    title: 'Website performance optimalisatie',
    description: 'Page load time reduced by 60%',
    priority: 'medium',
    position: 5,
    assignees: [demoMembers[1], demoMembers[2]]
  },
];

const DemoBoard = () => {
  const navigate = useNavigate();
  const [columns, setColumns] = useState<Column[]>(initialDemoColumns);
  const [tasks, setTasks] = useState<Task[]>(initialDemoTasks);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskDueDate, setEditTaskDueDate] = useState<Date | undefined>(undefined);
  const [editTaskPriority, setEditTaskPriority] = useState<"low" | "medium" | "high" | null>("medium");
  const [editTaskAssignees, setEditTaskAssignees] = useState<string[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(0.75);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const SCALE_FACTOR = zoomLevel;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomLevel]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.0));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getColumnTasks = (columnId: string) => {
    return tasks
      .filter(task => task.column_id === columnId)
      .sort((a, b) => a.position - b.position);
  };

  const getDeadlineBadgeColor = (dueDate: string): string => {
    const now = new Date();
    const deadline = new Date(dueDate);
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    if (deadline < now) {
      return "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800";
    } else if (deadline < twoDaysFromNow) {
      return "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800";
    } else {
      return "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return { label: 'Hoog', color: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800' };
      case 'medium':
        return { label: 'Gemiddeld', color: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800' };
      case 'low':
        return { label: 'Laag', color: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800' };
      default:
        return null;
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || "");
    setEditTaskDueDate(task.due_date ? new Date(task.due_date) : undefined);
    setEditTaskPriority(task.priority);
    setEditTaskAssignees(task.assignees?.map(a => a.user_id) || []);
  };

  const handleSaveTask = () => {
    if (!editingTask) return;
    
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === editingTask.id
          ? {
              ...task,
              title: editTaskTitle,
              description: editTaskDescription,
              priority: editTaskPriority,
              due_date: editTaskDueDate?.toISOString() || null,
              assignees: editTaskAssignees.map(userId => 
                demoMembers.find(m => m.user_id === userId)!
              )
            }
          : task
      )
    );
    
    setEditingTask(null);
    toast.success('✨ Taak bijgewerkt (demo mode - reset bij refresh)');
  };

  const handleDeleteTask = () => {
    if (!editingTask) return;
    
    setTasks(prevTasks => prevTasks.filter(t => t.id !== editingTask.id));
    setEditingTask(null);
    toast.success('✨ Taak verwijderd (demo mode)');
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

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedTask) return;

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === draggedTask.id
          ? { ...task, column_id: targetColumnId }
          : task
      )
    );

    setDraggedTask(null);
    setDraggedOverColumn(null);
    setIsDragging(false);
    
    toast.info('✨ Taak verplaatst (demo mode - niet opgeslagen)', {
      duration: 2000,
    });
  };

  const toggleAssignee = (userId: string) => {
    setEditTaskAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const backgroundStyle = {
    backgroundImage: `url(${defaultBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  return (
    <div className="min-h-screen relative" style={backgroundStyle}>
      {/* Demo Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary/90 backdrop-blur-sm text-white py-3 px-4 shadow-lg">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-medium">
              🎨 Demo Modus - LinqBoard Teamprojecten
            </span>
            <span className="hidden sm:inline text-xs text-white/70">
              | Probeer alle features! Changes worden niet opgeslagen.
            </span>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => navigate('/auth?mode=create')}
              className="text-xs sm:text-sm"
            >
              Maak je eigen LinqBoard
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => navigate('/pricing')}
              className="text-xs sm:text-sm border-white/20 hover:bg-white/10"
            >
              Bekijk prijzen
            </Button>
          </div>
        </div>
      </div>

      {/* Top Controls Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Terug naar home
            </Button>
            <img src={logo} alt="LinqBoard" className="h-8 w-auto" />
          </div>

          <div className="flex items-center gap-4">
            {/* Live Clock */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{formatTime(currentTime)}</span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium min-w-[3rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 1.0}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Board Canvas */}
      <main
        className="overflow-auto pt-32 pb-8"
        style={{
          height: 'calc(100vh - 2rem)',
        }}
      >
        <div
          className="relative"
          style={{
            width: `${2200 * SCALE_FACTOR}px`,
            height: `${700 * SCALE_FACTOR}px`,
            transform: `scale(${SCALE_FACTOR})`,
            transformOrigin: 'top left',
          }}
        >
          {columns.map(column => {
            return (
              <section
                key={column.id}
                className="absolute flex flex-col"
                style={{
                  left: `${column.x_position}px`,
                  top: `${column.y_position}px`,
                  width: `${column.width}px`,
                  height: `${column.height}px`
                }}
              >
                {/* Column Header */}
                <div
                  className={cn(
                    "flex items-center justify-between px-3.5 py-3 rounded-[24px] backdrop-blur-[60px] border-2 mb-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.08),inset_0_2px_2px_rgba(255,255,255,0.5)] relative overflow-visible group before:absolute before:inset-0 before:rounded-[24px] before:bg-gradient-to-br before:from-white/30 before:via-white/10 before:to-transparent before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[23px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none transition-all",
                    getGlowStyles(column.glow_type).header
                  )}
                  style={{
                    height: '60px',
                    minHeight: '60px'
                  }}
                >
                  <div className="text-[clamp(16px,2vw,22px)] font-extrabold text-foreground relative z-10 drop-shadow-sm">
                    {column.name}
                  </div>
                  <div className="backdrop-blur-[60px] bg-white/20 dark:bg-card/20 border-2 border-white/40 dark:border-white/20 px-3 py-1.5 rounded-xl font-bold text-sm relative z-10">
                    {getColumnTasks(column.id).length}
                  </div>
                </div>

                {/* Column Content */}
                <div
                  onDragOver={e => handleDragOver(e, column.id)}
                  onDrop={e => handleDrop(e, column.id)}
                  className={cn(
                    "flex-1 min-h-0 relative overflow-visible space-y-2.5 p-2",
                    draggedOverColumn === column.id && "bg-primary/5 rounded-lg"
                  )}
                >
                  {getColumnTasks(column.id).map(task => {
                    const isSimpleColumn = column.column_type === 'sick_leave' || column.column_type === 'vacation';
                    const isOverdue = task.due_date ? new Date(task.due_date) < new Date(new Date().setHours(0, 0, 0, 0)) : false;
                    
                    if (isSimpleColumn) {
                      return (
                        <SimpleTaskCard
                          key={task.id}
                          title={task.title}
                          description={task.description}
                          dueDate={task.due_date}
                          onClick={() => !isDragging && openEditDialog(task)}
                          glowShadow={getGlowStyles(column.glow_type).cardShadow}
                          assignees={task.assignees}
                          glowGradient={getGlowStyles(column.glow_type).cardGradient}
                        />
                      );
                    }

                    return (
                      <article
                        key={task.id}
                        draggable
                        onDragStart={e => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        onClick={() => !isDragging && openEditDialog(task)}
                        className={cn(
                          "relative backdrop-blur-[60px] bg-white/25 dark:bg-card/25 border-2 rounded-[22px] p-3 animate-[pop_0.2s_ease-out] cursor-move hover:-translate-y-2 transition-all duration-300 before:absolute before:inset-0 before:rounded-[22px] before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[21px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none",
                          "border-white/40 dark:border-white/20",
                          getGlowStyles(column.glow_type).cardGradient,
                          getGlowStyles(column.glow_type).cardShadow,
                          draggedTask?.id === task.id && "opacity-50 scale-95",
                          isOverdue && "animate-overdue-glow"
                        )}
                      >
                        <div className="absolute top-2.5 left-2.5 text-muted-foreground/50 text-sm select-none pointer-events-none">
                          ☰
                        </div>
                        <div className="flex gap-2 items-start">
                          <div className="flex-1 min-w-0 pl-4">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1 relative z-10">
                              {task.attachment_count && task.attachment_count > 0 && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold border bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800">
                                  📎 {task.attachment_count}
                                </span>
                              )}
                              {task.due_date && (
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${getDeadlineBadgeColor(task.due_date)}`}>
                                  📅 {format(new Date(task.due_date), "d MMM", { locale: nl })}
                                </span>
                              )}
                              {task.priority && getPriorityBadge(task.priority) && (
                                <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-bold border", getPriorityBadge(task.priority)!.color)}>
                                  {getPriorityBadge(task.priority)!.label}
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold text-[clamp(13px,1.5vw,16px)] mb-1 text-foreground relative z-10">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-muted-foreground text-[clamp(11px,1.2vw,13px)] relative z-10 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                          {task.assignees && task.assignees.length > 0 && (
                            <div className="flex items-center gap-0.5 relative z-10 flex-shrink-0">
                              {task.assignees.slice(0, 3).map((assignee, idx) => (
                                <Avatar
                                  key={assignee.user_id}
                                  className="h-9 w-9 border-2 border-white"
                                  style={{ marginLeft: idx > 0 ? '-6px' : '0' }}
                                >
                                  <AvatarFallback className="text-xs bg-primary/10">
                                    {assignee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {task.assignees.length > 3 && (
                                <div
                                  className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold"
                                  style={{ marginLeft: '-6px' }}
                                >
                                  +{task.assignees.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* Edit Task Dialog */}
      <Dialog open={editingTask !== null} onOpenChange={open => !open && setEditingTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Taak bewerken (Demo)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
              const taskColumn = columns.find(c => c.id === editingTask?.column_id);
              const isSimpleColumn = taskColumn && (taskColumn.column_type === 'sick_leave' || taskColumn.column_type === 'vacation');
              
              return (
                <>
                  <div>
                    <Label htmlFor="edit-title">
                      {isSimpleColumn ? 'Naam' : 'Titel'} *
                    </Label>
                    <Input
                      id="edit-title"
                      value={editTaskTitle}
                      onChange={e => setEditTaskTitle(e.target.value)}
                      placeholder={isSimpleColumn ? "Naam..." : "Titel..."}
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">
                      {isSimpleColumn ? 'Reden' : 'Beschrijving'}
                    </Label>
                    <Textarea
                      id="edit-description"
                      value={editTaskDescription}
                      onChange={e => setEditTaskDescription(e.target.value)}
                      placeholder={isSimpleColumn ? "Reden..." : "Beschrijving..."}
                      maxLength={1000}
                    />
                  </div>
                  <div>
                    <Label>
                      {isSimpleColumn ? 'Verwachte terugkeer' : 'Deadline'}
                    </Label>
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
                          {editTaskDueDate ? format(editTaskDueDate, "PPP", { locale: nl }) : "Selecteer datum"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editTaskDueDate}
                          onSelect={setEditTaskDueDate}
                          initialFocus
                        />
                        {editTaskDueDate && (
                          <div className="p-3 border-t">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => setEditTaskDueDate(undefined)}
                            >
                              Verwijder datum
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                  {!isSimpleColumn && (
                    <div>
                      <Label>Prioriteit</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={editTaskPriority === null ? "default" : "outline"}
                          onClick={() => setEditTaskPriority(null)}
                          className="flex-1"
                        >
                          Geen
                        </Button>
                        <Button
                          type="button"
                          variant={editTaskPriority === "low" ? "default" : "outline"}
                          onClick={() => setEditTaskPriority("low")}
                          className="flex-1"
                        >
                          Laag
                        </Button>
                        <Button
                          type="button"
                          variant={editTaskPriority === "medium" ? "default" : "outline"}
                          onClick={() => setEditTaskPriority("medium")}
                          className="flex-1"
                        >
                          Gemiddeld
                        </Button>
                        <Button
                          type="button"
                          variant={editTaskPriority === "high" ? "default" : "outline"}
                          onClick={() => setEditTaskPriority("high")}
                          className="flex-1"
                        >
                          Hoog
                        </Button>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>Toegewezen aan</Label>
                    <div className="space-y-2 mt-2">
                      {demoMembers.map(member => (
                        <div
                          key={member.user_id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleAssignee(member.user_id)}
                        >
                          <input
                            type="checkbox"
                            checked={editTaskAssignees.includes(member.user_id)}
                            onChange={() => toggleAssignee(member.user_id)}
                            className="h-4 w-4"
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.full_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveTask} className="flex-1">
                      Opslaan (Demo)
                    </Button>
                    <Button onClick={handleDeleteTask} variant="destructive">
                      Verwijderen
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemoBoard;
