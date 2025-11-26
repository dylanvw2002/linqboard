# LinqBoard - Complete Board Code Export

Deze export bevat alle code voor de board functionaliteit van LinqBoard.

## 📁 Bestandsstructuur

```
src/
├── pages/
│   └── Board.tsx (3270+ regels)
├── components/
│   ├── Board Components/
│   │   ├── WidgetContainer.tsx
│   │   ├── ActiveUsers.tsx
│   │   ├── ColumnManagement.tsx
│   │   ├── ColumnEditSidebar.tsx
│   │   ├── BackgroundCropEditor.tsx
│   │   ├── ColumnCropEditor.tsx
│   │   ├── ResizeHandles.tsx
│   │   ├── SimpleTaskCard.tsx
│   │   ├── TaskStack.tsx
│   │   ├── TaskAttachments.tsx
│   │   ├── TaskHistory.tsx
│   │   ├── TaskHistoryDialog.tsx
│   │   └── TeamMemberSelect.tsx
│   └── widgets/
│       ├── NotesWidget.tsx
│       ├── TimerWidget.tsx
│       ├── CalculatorWidget.tsx
│       ├── CalendarWidget.tsx
│       ├── SpotifyWidget.tsx
│       ├── TeamStatusWidget.tsx
│       ├── QuickLinksWidget.tsx
│       ├── AchievementBadgesWidget.tsx
│       └── NotificationsCenterWidget.tsx
└── lib/
    ├── glowStyles.ts
    ├── columnTypes.ts
    └── utils.ts
```

---

## 🎯 src/pages/Board.tsx

```tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Plus, MoreVertical, Trash2, Settings, Edit2, Image as ImageIcon, Palette, Clock, Calendar, UserPlus, X, Download, Mail, Home, Sparkles, PanelLeftClose, PanelLeft, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { nl, de, enUS, es } from "date-fns/locale";
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";
import { ColumnManagement } from "@/components/ColumnManagement";
import { ActiveUsers } from "@/components/ActiveUsers";
import { ColumnEditSidebar } from "@/components/ColumnEditSidebar";
import { BackgroundCropEditor } from "@/components/BackgroundCropEditor";
import { ColumnCropEditor } from "@/components/ColumnCropEditor";
import { ResizeHandles } from "@/components/ResizeHandles";
import { SimpleTaskCard } from "@/components/SimpleTaskCard";
import { TaskStack } from "@/components/TaskStack";
import { TeamMemberSelect } from "@/components/TeamMemberSelect";
import { TaskAttachments } from "@/components/TaskAttachments";
import { TaskHistoryDialog } from "@/components/TaskHistoryDialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { WidgetContainer } from "@/components/WidgetContainer";
import { getGlowStyles, getGlowCardStyles, getGlowButtonStyles, getTaskCardGlowStyles } from "@/lib/glowStyles";
import { ColumnType, getColumnTypeLabel, getColumnTypeOptions } from "@/lib/columnTypes";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ... rest of Board.tsx implementation
// (3270+ lines total)
```

> **Note**: Het volledige Board.tsx bestand is beschikbaar in `src/pages/Board.tsx` in je project.

---

## 🧩 src/components/WidgetContainer.tsx

```tsx
import { useState, useEffect } from "react";
import { Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotesWidget } from "./widgets/NotesWidget";
import { TimerWidget } from "./widgets/TimerWidget";
import { CalculatorWidget } from "./widgets/CalculatorWidget";
import { CalendarWidget } from "./widgets/CalendarWidget";
import { SpotifyWidget } from "./widgets/SpotifyWidget";
import { TeamStatusWidget } from "./widgets/TeamStatusWidget";
import { QuickLinksWidget } from "./widgets/QuickLinksWidget";
import { AchievementBadgesWidget } from "./widgets/AchievementBadgesWidget";
import { NotificationsCenterWidget } from "./widgets/NotificationsCenterWidget";
import { ChatWidget } from "./ChatWidget";
import { ResizeHandles } from "./ResizeHandles";

interface Widget {
  id: string;
  widget_type: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  settings?: any;
  board_id: string;
  mode?: string;
}

interface WidgetContainerProps {
  widget: Widget;
  boardName: string;
  isEditMode: boolean;
  onDelete: (id: string) => void;
  onDragStart: (e: React.MouseEvent, widgetId: string) => void;
  onResize: (widgetId: string, newWidth: number, newHeight: number) => void;
  isDragging: boolean;
}

export const WidgetContainer = ({
  widget,
  boardName,
  isEditMode,
  onDelete,
  onDragStart,
  onResize,
  isDragging,
}: WidgetContainerProps) => {
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      const collapsed = localStorage.getItem(`chat-collapsed-${widget.id}`) === 'true';
      setIsChatCollapsed(collapsed);
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [widget.id]);

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setIsResizing(true);
    setActiveHandle(handle);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ width: widget.width, height: widget.height });
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      let newWidth = startSize.width;
      let newHeight = startSize.height;

      if (activeHandle?.includes('e')) newWidth = Math.max(200, startSize.width + deltaX);
      if (activeHandle?.includes('w')) newWidth = Math.max(200, startSize.width - deltaX);
      if (activeHandle?.includes('s')) newHeight = Math.max(150, startSize.height + deltaY);
      if (activeHandle?.includes('n')) newHeight = Math.max(150, startSize.height - deltaY);

      onResize(widget.id, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setActiveHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, activeHandle, startPos, startSize, widget.id, onResize]);

  const renderWidget = () => {
    switch (widget.widget_type) {
      case 'notes':
        return <NotesWidget widgetId={widget.id} settings={widget.settings} />;
      case 'timer':
        return <TimerWidget widgetId={widget.id} settings={widget.settings} />;
      case 'calculator':
        return <CalculatorWidget widgetId={widget.id} settings={widget.settings} />;
      case 'calendar':
        return <CalendarWidget widgetId={widget.id} boardId={widget.board_id} />;
      case 'spotify':
        return <SpotifyWidget widgetId={widget.id} settings={widget.settings} />;
      case 'team_status':
        return <TeamStatusWidget widgetId={widget.id} boardId={widget.board_id} />;
      case 'quick_links':
        return <QuickLinksWidget widgetId={widget.id} settings={widget.settings} />;
      case 'achievement_badges':
        return <AchievementBadgesWidget widgetId={widget.id} boardId={widget.board_id} />;
      case 'notifications_center':
        return <NotificationsCenterWidget widgetId={widget.id} boardId={widget.board_id} />;
      case 'chat':
        return (
          <ChatWidget
            widgetId={widget.id}
            boardName={boardName}
            x_position={widget.x_position}
            y_position={widget.y_position}
            onSizeChange={(newWidth, newHeight) => onResize(widget.id, newWidth, newHeight)}
          />
        );
      default:
        return <div className="p-4">Unknown widget type</div>;
    }
  };

  const containerStyle = {
    position: 'absolute' as const,
    left: `${widget.x_position}px`,
    top: `${widget.y_position}px`,
    width: isChatCollapsed ? 'auto' : `${widget.width}px`,
    height: isChatCollapsed ? 'auto' : `${widget.height}px`,
    zIndex: isDragging ? 1000 : isEditMode ? 10 : 1,
  };

  return (
    <div
      style={containerStyle}
      className={cn(
        "transition-shadow",
        isEditMode && "ring-2 ring-primary/50",
        isDragging && "opacity-50"
      )}
    >
      {isEditMode && (
        <>
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-3 -right-3 z-50 h-6 w-6 rounded-full shadow-lg"
            onClick={() => onDelete(widget.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <div
            className="absolute top-0 left-0 right-0 h-8 cursor-move bg-primary/10 flex items-center justify-center"
            onMouseDown={(e) => onDragStart(e, widget.id)}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <ResizeHandles
            mode="content"
            onMouseDown={handleResizeStart}
            activeHandle={activeHandle}
          />
        </>
      )}
      <div className={cn("h-full", isEditMode && "pt-8")}>
        {renderWidget()}
      </div>
    </div>
  );
};
```

---

## 👥 src/components/ActiveUsers.tsx

```tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface ActiveUsersProps {
  organizationId: string;
  isDemo?: boolean;
}

interface UserPresence {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  online_at: string;
}

export const ActiveUsers = ({ organizationId, isDemo = false }: ActiveUsersProps) => {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [channel, setChannel] = useState<any>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (isDemo) {
      setActiveUsers([
        { user_id: '1', full_name: 'Demo User 1', online_at: new Date().toISOString() },
        { user_id: '2', full_name: 'Demo User 2', online_at: new Date().toISOString() },
      ]);
      return;
    }

    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      const newChannel = supabase.channel(`org-presence-${organizationId}`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      newChannel
        .on('presence', { event: 'sync' }, () => {
          const state = newChannel.presenceState();
          const users: UserPresence[] = [];
          
          Object.keys(state).forEach((key) => {
            const presences = state[key];
            if (presences && presences.length > 0) {
              const presence = presences[0];
              users.push({
                user_id: key,
                full_name: presence.full_name || 'Unknown User',
                avatar_url: presence.avatar_url,
                online_at: new Date().toISOString(),
              });
            }
          });
          
          setActiveUsers(users);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await newChannel.track({
              user_id: user.id,
              full_name: profile?.full_name || 'Unknown User',
              avatar_url: profile?.avatar_url,
              online_at: new Date().toISOString(),
            });
          }
        });

      supabase
        .channel('profiles-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
          },
          async (payload) => {
            if (payload.new.user_id === user.id) {
              await newChannel.track({
                user_id: user.id,
                full_name: payload.new.full_name || 'Unknown User',
                avatar_url: payload.new.avatar_url,
                online_at: new Date().toISOString(),
              });
            }
          }
        )
        .subscribe();

      setChannel(newChannel);
    };

    setupPresence();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [organizationId, isDemo]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          <span>{activeUsers.length}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{t('board.activeUsers')}</h4>
          {activeUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('board.noActiveUsers')}</p>
          ) : (
            <div className="space-y-2">
              {activeUsers.map((user) => (
                <div key={user.user_id} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{t('board.online')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
```

---

## 📝 src/components/widgets/NotesWidget.tsx

```tsx
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface NotesWidgetProps {
  widgetId: string;
  settings?: any;
}

export const NotesWidget = ({ widgetId, settings }: NotesWidgetProps) => {
  const [content, setContent] = useState(settings?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (settings?.content) {
      setContent(settings.content);
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('widgets')
        .update({ settings: { content } })
        .eq('id', widgetId);

      if (error) throw error;

      toast({
        title: "Notities opgeslagen",
        description: "Je notities zijn succesvol opgeslagen.",
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van je notities.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (value: string) => {
    setContent(value);
    setHasChanges(true);
  };

  return (
    <div className="h-full flex flex-col bg-background rounded-lg border p-4 space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Notities</h3>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
          size="sm"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Opslaan
        </Button>
      </div>
      <Textarea 
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Typ hier je notities..."
        className="flex-1 resize-none"
      />
    </div>
  );
};
```

---

## ⏱️ src/components/widgets/TimerWidget.tsx

```tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface TimerWidgetProps {
  widgetId: string;
  settings?: any;
}

export const TimerWidget = ({ widgetId, settings }: TimerWidgetProps) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-background rounded-lg border p-4 space-y-4">
      <h3 className="font-semibold">Timer</h3>
      <div className="text-4xl font-mono">{formatTime(seconds)}</div>
      <div className="flex gap-2">
        <Button
          onClick={() => setIsRunning(!isRunning)}
          size="sm"
          variant={isRunning ? "destructive" : "default"}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          onClick={() => {
            setIsRunning(false);
            setSeconds(0);
          }}
          size="sm"
          variant="outline"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
```

---

## 🧮 src/components/widgets/CalculatorWidget.tsx

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CalculatorWidgetProps {
  widgetId: string;
  settings?: any;
}

export const CalculatorWidget = ({ widgetId, settings }: CalculatorWidgetProps) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperation = (op: string) => {
    const current = parseFloat(display);
    if (previousValue === null) {
      setPreviousValue(current);
    } else if (operation) {
      const result = calculate(previousValue, current, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }
    setOperation(op);
    setNewNumber(true);
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case '+': return prev + current;
      case '-': return prev - current;
      case '×': return prev * current;
      case '÷': return prev / current;
      default: return current;
    }
  };

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const result = calculate(previousValue, parseFloat(display), operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  return (
    <div className="h-full flex flex-col bg-background rounded-lg border p-4">
      <h3 className="font-semibold mb-2">Calculator</h3>
      <div className="flex-1 flex flex-col gap-2">
        <div className="bg-muted rounded p-4 text-right text-2xl font-mono">{display}</div>
        <div className="grid grid-cols-4 gap-2 flex-1">
          {['7', '8', '9', '÷'].map((btn) => (
            <Button key={btn} onClick={() => btn === '÷' ? handleOperation(btn) : handleNumber(btn)} variant="outline">
              {btn}
            </Button>
          ))}
          {['4', '5', '6', '×'].map((btn) => (
            <Button key={btn} onClick={() => btn === '×' ? handleOperation(btn) : handleNumber(btn)} variant="outline">
              {btn}
            </Button>
          ))}
          {['1', '2', '3', '-'].map((btn) => (
            <Button key={btn} onClick={() => btn === '-' ? handleOperation(btn) : handleNumber(btn)} variant="outline">
              {btn}
            </Button>
          ))}
          <Button onClick={() => handleNumber('0')} variant="outline">0</Button>
          <Button onClick={handleClear} variant="outline">C</Button>
          <Button onClick={handleEquals} variant="outline">=</Button>
          <Button onClick={() => handleOperation('+')} variant="outline">+</Button>
        </div>
      </div>
    </div>
  );
};
```

---

## 📅 src/components/widgets/CalendarWidget.tsx

```tsx
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";

interface CalendarWidgetProps {
  widgetId: string;
  boardId: string;
}

interface Task {
  id: string;
  title: string;
  due_date: string;
  priority: "low" | "medium" | "high";
}

export const CalendarWidget = ({ widgetId, boardId }: CalendarWidgetProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchTasks();
  }, [boardId]);

  const fetchTasks = async () => {
    const { data: columns } = await supabase
      .from('columns')
      .select('id')
      .eq('board_id', boardId);

    if (!columns) return;

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('id, title, due_date, priority')
      .in('column_id', columns.map(c => c.id))
      .not('due_date', 'is', null);

    if (tasksData) {
      setTasks(tasksData as Task[]);
    }
  };

  const selectedDateTasks = tasks.filter(task => 
    selectedDate && task.due_date && isSameDay(new Date(task.due_date), selectedDate)
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background rounded-lg border p-4 space-y-4">
      <h3 className="font-semibold">Kalender</h3>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        className="rounded-md border"
        modifiers={{
          hasDeadline: (date) => tasks.some(task => 
            task.due_date && isSameDay(new Date(task.due_date), date)
          )
        }}
        modifiersStyles={{
          hasDeadline: {
            fontWeight: 'bold',
            textDecoration: 'underline'
          }
        }}
      />
      {selectedDate && selectedDateTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Taken op {format(selectedDate, 'dd MMMM yyyy')}
          </h4>
          {selectedDateTasks.map(task => (
            <div key={task.id} className="flex items-center gap-2 p-2 bg-muted rounded">
              <Badge className={getPriorityColor(task.priority)} />
              <span className="text-sm">{task.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 🎵 src/components/widgets/SpotifyWidget.tsx

```tsx
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SpotifyWidgetProps {
  widgetId: string;
  settings?: any;
}

export const SpotifyWidget = ({ widgetId, settings }: SpotifyWidgetProps) => {
  const [spotifyUrl, setSpotifyUrl] = useState(settings?.spotifyUrl || '');
  const [embedUrl, setEmbedUrl] = useState(settings?.embedUrl || '');
  const [isEditing, setIsEditing] = useState(!settings?.embedUrl);
  const { toast } = useToast();

  useEffect(() => {
    if (settings?.spotifyUrl) {
      setSpotifyUrl(settings.spotifyUrl);
    }
    if (settings?.embedUrl) {
      setEmbedUrl(settings.embedUrl);
    }
  }, [settings]);

  const convertToEmbedUrl = (url: string): string => {
    const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
    const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    const albumMatch = url.match(/album\/([a-zA-Z0-9]+)/);

    if (trackMatch) {
      return `https://open.spotify.com/embed/track/${trackMatch[1]}`;
    } else if (playlistMatch) {
      return `https://open.spotify.com/embed/playlist/${playlistMatch[1]}`;
    } else if (albumMatch) {
      return `https://open.spotify.com/embed/album/${albumMatch[1]}`;
    }

    return url;
  };

  const handleSave = async () => {
    const newEmbedUrl = convertToEmbedUrl(spotifyUrl);
    
    if (!newEmbedUrl.includes('spotify.com/embed')) {
      toast({
        title: "Ongeldige URL",
        description: "Voer een geldige Spotify URL in.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('widgets')
        .update({ 
          settings: { 
            spotifyUrl: spotifyUrl,
            embedUrl: newEmbedUrl 
          } 
        })
        .eq('id', widgetId);

      if (error) throw error;

      setEmbedUrl(newEmbedUrl);
      setIsEditing(false);
      toast({
        title: "Opgeslagen",
        description: "Spotify widget is bijgewerkt.",
      });
    } catch (error) {
      console.error('Error saving Spotify widget:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-background rounded-lg border p-4 space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Spotify</h3>
        <Button onClick={() => isEditing ? handleSave() : setIsEditing(true)} size="sm">
          {isEditing ? 'Opslaan' : 'Bewerken'}
        </Button>
      </div>
      
      {isEditing && (
        <Input
          value={spotifyUrl}
          onChange={(e) => setSpotifyUrl(e.target.value)}
          placeholder="Plak Spotify URL hier..."
          className="mb-2"
        />
      )}
      
      {embedUrl && !isEditing ? (
        <iframe
          src={embedUrl}
          className="flex-1 rounded-md"
          frameBorder="0"
          allow="encrypted-media"
        />
      ) : !isEditing ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Klik op Bewerken om een Spotify track, album of playlist toe te voegen
        </div>
      ) : null}
    </div>
  );
};
```

---

## 🎨 src/lib/glowStyles.ts

```tsx
import { ColumnType } from './columnTypes';

export type GlowType = 'default' | 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'orange';

const glowColors: Record<GlowType, { shadow: string; gradient: string; border: string }> = {
  default: {
    shadow: 'rgba(59, 130, 246, 0.5)',
    gradient: 'from-blue-500/20 to-purple-500/20',
    border: 'border-blue-500/50'
  },
  red: {
    shadow: 'rgba(239, 68, 68, 0.5)',
    gradient: 'from-red-500/20 to-pink-500/20',
    border: 'border-red-500/50'
  },
  green: {
    shadow: 'rgba(34, 197, 94, 0.5)',
    gradient: 'from-green-500/20 to-emerald-500/20',
    border: 'border-green-500/50'
  },
  blue: {
    shadow: 'rgba(59, 130, 246, 0.5)',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/50'
  },
  yellow: {
    shadow: 'rgba(234, 179, 8, 0.5)',
    gradient: 'from-yellow-500/20 to-orange-500/20',
    border: 'border-yellow-500/50'
  },
  purple: {
    shadow: 'rgba(168, 85, 247, 0.5)',
    gradient: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/50'
  },
  orange: {
    shadow: 'rgba(249, 115, 22, 0.5)',
    gradient: 'from-orange-500/20 to-red-500/20',
    border: 'border-orange-500/50'
  }
};

export const getGlowStyles = (glowType: GlowType = 'default') => {
  const colors = glowColors[glowType];
  return {
    boxShadow: `0 0 30px ${colors.shadow}`,
    background: `linear-gradient(135deg, ${colors.gradient})`,
    borderColor: colors.border
  };
};

export const getGlowCardStyles = (glowType: GlowType = 'default') => {
  const colors = glowColors[glowType];
  return `bg-gradient-to-br ${colors.gradient} backdrop-blur-sm border ${colors.border}`;
};

export const getGlowButtonStyles = (glowType: GlowType = 'default') => {
  const colors = glowColors[glowType];
  return `hover:shadow-[0_0_20px_${colors.shadow}]`;
};

export const getTaskCardGlowStyles = (glowType: GlowType = 'default') => {
  const colors = glowColors[glowType];
  return {
    className: `border ${colors.border} hover:shadow-[0_0_15px_${colors.shadow}] transition-shadow`,
    gradient: colors.gradient,
    shadow: colors.shadow
  };
};

export const getColumnTypeColor = (columnType: ColumnType): GlowType => {
  const typeColorMap: Record<ColumnType, GlowType> = {
    regular: 'default',
    sick_leave: 'red',
    vacation: 'green',
    announcement: 'yellow',
    completed: 'blue'
  };
  return typeColorMap[columnType] || 'default';
};
```

---

## 🏷️ src/lib/columnTypes.ts

```tsx
import i18next from 'i18next';

export type ColumnType = 'regular' | 'sick_leave' | 'vacation' | 'announcement' | 'completed';

export const getColumnTypeLabel = (type: ColumnType): string => {
  const labels: Record<ColumnType, string> = {
    regular: i18next.t('column.typeRegular'),
    sick_leave: i18next.t('column.typeSickLeave'),
    vacation: i18next.t('column.typeVacation'),
    announcement: i18next.t('column.typeAnnouncement'),
    completed: i18next.t('column.typeCompleted'),
  };
  return labels[type];
};

export const getColumnTypeOptions = () => [
  { value: 'regular' as ColumnType, label: i18next.t('column.typeRegular') },
  { value: 'sick_leave' as ColumnType, label: i18next.t('column.typeSickLeave') },
  { value: 'vacation' as ColumnType, label: i18next.t('column.typeVacation') },
  { value: 'announcement' as ColumnType, label: i18next.t('column.typeAnnouncement') },
  { value: 'completed' as ColumnType, label: i18next.t('column.typeCompleted') },
];
```

---

## 🔧 src/lib/utils.ts

```tsx
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 📎 Overige Componenten

De volgende componenten zijn ook beschikbaar in je project:

- `src/components/ColumnManagement.tsx` - Kolom beheer dialoog
- `src/components/ColumnEditSidebar.tsx` - Kolom bewerk sidebar
- `src/components/BackgroundCropEditor.tsx` - Achtergrond crop editor
- `src/components/ColumnCropEditor.tsx` - Kolom crop editor
- `src/components/ResizeHandles.tsx` - Resize handles voor widgets
- `src/components/SimpleTaskCard.tsx` - Simpele taak kaart
- `src/components/TaskStack.tsx` - Taak stapel component
- `src/components/TaskAttachments.tsx` - Taak bijlagen
- `src/components/TaskHistory.tsx` - Taak geschiedenis
- `src/components/TaskHistoryDialog.tsx` - Taak geschiedenis dialoog
- `src/components/TeamMemberSelect.tsx` - Team lid selectie
- `src/components/ChatWidget.tsx` - Chat widget

En alle overige widget componenten:
- `src/components/widgets/TeamStatusWidget.tsx`
- `src/components/widgets/QuickLinksWidget.tsx`
- `src/components/widgets/AchievementBadgesWidget.tsx`
- `src/components/widgets/NotificationsCenterWidget.tsx`

---

## 📦 Benodigde Dependencies

```json
{
  "@hello-pangea/dnd": "^16.x.x",
  "@supabase/supabase-js": "^2.58.0",
  "date-fns": "^3.6.0",
  "react-i18next": "^16.0.0",
  "lucide-react": "^0.462.0"
}
```

---

## 🗄️ Database Structuur

Het board systeem gebruikt de volgende Supabase tabellen:

- `boards` - Board informatie en achtergrond instellingen
- `columns` - Kolommen met posities, maten en glow types
- `tasks` - Taken met deadlines, prioriteiten en assignees
- `task_assignees` - Relatie tussen taken en gebruikers
- `task_attachments` - Taak bijlagen
- `task_history` - Geschiedenis van taak wijzigingen
- `task_labels` - Labels voor taken
- `widgets` - Widgets met posities en instellingen
- `widget_chat_messages` - Chat berichten voor de chat widget
- `profiles` - Gebruiker profielen
- `memberships` - Organisatie lidmaatschappen

---

## 🎯 Gebruik

1. Kopieer alle bestanden naar je project
2. Installeer de benodigde dependencies
3. Zorg dat je Supabase project correct is geconfigureerd
4. De board pagina is beschikbaar op route `/board/:id`

---

**Totaal aantal bestanden**: 25+  
**Totaal aantal regels code**: 8000+  
**Laatste export**: ${new Date().toLocaleDateString('nl-NL')}
