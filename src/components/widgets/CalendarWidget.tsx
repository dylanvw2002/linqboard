import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";

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

export const CalendarWidget = ({ boardId }: CalendarWidgetProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksWithDeadlines, setTasksWithDeadlines] = useState<Date[]>([]);

  useEffect(() => {
    fetchTasks();
  }, [boardId]);

  const fetchTasks = async () => {
    const { data: columns } = await supabase
      .from("columns")
      .select("id")
      .eq("board_id", boardId);

    if (!columns) return;

    const { data } = await supabase
      .from("tasks")
      .select("id, title, due_date, priority")
      .in("column_id", columns.map(c => c.id))
      .not("due_date", "is", null);

    if (data) {
      setTasks(data as Task[]);
      setTasksWithDeadlines(data.map(t => new Date(t.due_date)));
    }
  };

  const selectedDateTasks = tasks.filter(task => 
    selectedDate && isSameDay(new Date(task.due_date), selectedDate)
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm">📅 Kalender</h3>
      </div>

      <div className="flex-1 overflow-auto">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          locale={nl}
          className="rounded-md border"
          modifiers={{
            hasDeadline: tasksWithDeadlines,
          }}
          modifiersStyles={{
            hasDeadline: {
              fontWeight: "bold",
              textDecoration: "underline",
            },
          }}
        />

        {selectedDate && selectedDateTasks.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">
              {format(selectedDate, "d MMMM", { locale: nl })}
            </h4>
            {selectedDateTasks.map(task => (
              <div key={task.id} className="flex items-center gap-2 text-xs p-2 bg-muted rounded">
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                <span className="flex-1 truncate">{task.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
