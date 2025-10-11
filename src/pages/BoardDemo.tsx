import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Users, 
  Paperclip, 
  MessageSquare, 
  Clock,
  Maximize2,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  description: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  assignees?: { name: string; avatar?: string }[];
  labels?: string[];
  attachments?: number;
  comments?: number;
}

const BoardDemo = () => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "low":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-3 w-3" />;
      case "medium":
        return <TrendingUp className="h-3 w-3" />;
      case "low":
        return <Info className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Demo data showcasing features
  const todayTasks: Task[] = [
    {
      id: "1",
      title: "Klantpresentatie Q1 resultaten",
      description: "Voorbereiding slides en financiële cijfers",
      priority: "high",
      dueDate: "Vandaag 14:00",
      assignees: [
        { name: "Sarah van Dam", avatar: "" },
        { name: "Michael de Jong", avatar: "" },
      ],
      labels: ["Presentatie", "Urgent"],
      attachments: 3,
      comments: 7,
    },
    {
      id: "2",
      title: "Code review nieuwe features",
      description: "Review van authentication module en dashboard updates",
      priority: "medium",
      dueDate: "Vandaag 16:30",
      assignees: [{ name: "Lisa Chen", avatar: "" }],
      labels: ["Development"],
      comments: 4,
    },
  ];

  const weekTasks: Task[] = [
    {
      id: "3",
      title: "Marketing campagne lancering",
      description: "Social media content plannen en ads setup",
      priority: "high",
      dueDate: "Woensdag",
      assignees: [
        { name: "Emma Bakker", avatar: "" },
        { name: "Tom Jansen", avatar: "" },
      ],
      labels: ["Marketing", "Content"],
      attachments: 5,
      comments: 12,
    },
    {
      id: "4",
      title: "Database optimalisatie",
      description: "Performance verbetering queries en indexering",
      priority: "medium",
      dueDate: "Donderdag",
      assignees: [{ name: "David Kim", avatar: "" }],
      labels: ["Backend"],
      comments: 2,
    },
    {
      id: "5",
      title: "UI/UX verbeteringen dashboard",
      description: "Nieuwe design implementeren voor analytics sectie",
      priority: "low",
      dueDate: "Vrijdag",
      assignees: [{ name: "Sophie Martin", avatar: "" }],
      labels: ["Design", "Frontend"],
      attachments: 2,
    },
  ];

  const completedTasks: Task[] = [
    {
      id: "6",
      title: "API integratie payment provider",
      description: "Mollie payment flow volledig geïntegreerd en getest",
      assignees: [{ name: "Alex Rodriguez", avatar: "" }],
      labels: ["Development", "API"],
    },
    {
      id: "7",
      title: "Teammeeting Q1 review",
      description: "Retrospective en planning Q2 afgerond",
      assignees: [{ name: "Sarah van Dam", avatar: "" }],
      labels: ["Meeting"],
    },
  ];

  const TaskCard = ({ task, showGlow = false }: { task: Task; showGlow?: boolean }) => (
    <div 
      className={`
        bg-card rounded-2xl p-4 border border-border
        transition-all duration-300 ease-out
        hover:shadow-card-hover hover:scale-[1.02] hover:-translate-y-1
        ${showGlow ? 'shadow-glow' : 'shadow-card'}
      `}
    >
      <h3 className="font-semibold text-foreground mb-2 leading-tight">
        {task.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {task.description}
      </p>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.labels.map((label, idx) => (
            <Badge 
              key={idx} 
              variant="secondary" 
              className="text-xs px-2 py-0.5"
            >
              {label}
            </Badge>
          ))}
        </div>
      )}

      {/* Priority & Due Date */}
      <div className="flex items-center gap-2 mb-3">
        {task.priority && (
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-0.5 gap-1 ${getPriorityColor(task.priority)}`}
          >
            {getPriorityIcon(task.priority)}
            {task.priority === "high" ? "Hoog" : task.priority === "medium" ? "Gemiddeld" : "Laag"}
          </Badge>
        )}
        {task.dueDate && (
          <Badge variant="outline" className="text-xs px-2 py-0.5 gap-1">
            <Calendar className="h-3 w-3" />
            {task.dueDate}
          </Badge>
        )}
      </div>

      {/* Assignees & Metadata */}
      <div className="flex items-center justify-between">
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex -space-x-2">
            {task.assignees.map((assignee, idx) => (
              <Avatar key={idx} className="h-7 w-7 border-2 border-card">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {assignee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 text-muted-foreground">
          {task.attachments && (
            <div className="flex items-center gap-1 text-xs">
              <Paperclip className="h-3.5 w-3.5" />
              <span>{task.attachments}</span>
            </div>
          )}
          {task.comments && (
            <div className="flex items-center gap-1 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{task.comments}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const Column = ({ 
    title, 
    icon, 
    tasks, 
    color, 
    badge 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    tasks: Task[]; 
    color: string;
    badge?: string;
  }) => (
    <div className="flex flex-col min-h-[500px]">
      <div 
        className={`rounded-t-2xl px-5 py-4 border border-border shadow-md`}
        style={{
          background: `linear-gradient(135deg, hsl(var(${color})) 0%, hsl(var(${color}-glow)) 100%)`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-white">{icon}</div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {badge && (
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                {badge}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 bg-muted/30 rounded-b-2xl border-x border-b border-border p-4 space-y-3 overflow-y-auto backdrop-blur-sm">
        {tasks.map((task, idx) => (
          <TaskCard key={task.id} task={task} showGlow={idx === 0} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-board-bg)' }}>
      {/* Promotional Header */}
      <header className="backdrop-blur-md bg-card/80 border-b border-border shadow-lg sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3 group">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transition-transform group-hover:scale-105"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  L
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Linqboard Demo
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Krachtige taakbeheer voor moderne teams
                  </p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Live Clock */}
              <div className="text-right hidden md:block">
                <div className="text-2xl font-bold tabular-nums bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-muted-foreground capitalize flex items-center gap-1 justify-end">
                  <Clock className="h-3 w-3" />
                  {formatDate(currentTime)}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 hidden sm:flex"
                >
                  <Maximize2 className="h-4 w-4" />
                  Volledig scherm
                </Button>
                <Link to="/auth">
                  <Button 
                    size="sm" 
                    className="gap-2 shadow-lg"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Start Gratis
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Board */}
      <main className="max-w-[1800px] mx-auto px-8 py-8">
        {/* Feature Highlights */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card/60 backdrop-blur-sm rounded-xl p-4 border border-border shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Real-time Samenwerking</h3>
                <p className="text-xs text-muted-foreground">Werk samen met je team in real-time</p>
              </div>
            </div>
          </div>
          <div className="bg-card/60 backdrop-blur-sm rounded-xl p-4 border border-border shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Volledig Aanpasbaar</h3>
                <p className="text-xs text-muted-foreground">Pas je boards aan naar jouw workflow</p>
              </div>
            </div>
          </div>
          <div className="bg-card/60 backdrop-blur-sm rounded-xl p-4 border border-border shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Taken Beheren</h3>
                <p className="text-xs text-muted-foreground">Priorities, deadlines, en meer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Board Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Column
            title="Vandaag"
            icon={<Sparkles className="h-5 w-5" />}
            tasks={todayTasks}
            color="--column-today"
            badge={`${todayTasks.length}`}
          />
          <Column
            title="Deze Week"
            icon={<Calendar className="h-5 w-5" />}
            tasks={weekTasks}
            color="--column-week"
            badge={`${weekTasks.length}`}
          />
          <Column
            title="In Progress"
            icon={<TrendingUp className="h-5 w-5" />}
            tasks={[
              {
                id: "8",
                title: "SEO optimalisatie website",
                description: "Metadata en structured data implementeren",
                priority: "medium",
                assignees: [{ name: "Nina Patel", avatar: "" }],
                labels: ["SEO", "Content"],
              },
            ]}
            color="--column-sick"
          />
          <Column
            title="Afgerond"
            icon={<CheckCircle2 className="h-5 w-5" />}
            tasks={completedTasks}
            color="--column-done"
            badge={`${completedTasks.length}`}
          />
        </div>
      </main>

      {/* Promotional Footer */}
      <footer className="max-w-[1800px] mx-auto px-8 py-6 mt-8">
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border shadow-lg p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Klaar om je productiviteit te verhogen?
            </h3>
            <p className="text-muted-foreground mb-4">
              Join duizenden teams die Linqboard gebruiken voor hun project management
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="gap-2 shadow-lg"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  <Sparkles className="h-5 w-5" />
                  Start Gratis - Geen creditcard vereist
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg">
                  Bekijk Prijzen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BoardDemo;
