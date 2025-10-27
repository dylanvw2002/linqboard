import { useState, useEffect } from "react";
import { Trophy, Zap, Target, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface AchievementBadgesWidgetProps {
  widgetId: string;
  boardId: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  progress: number;
  goal: number;
  unlocked: boolean;
}

export const AchievementBadgesWidget = ({ boardId }: AchievementBadgesWidgetProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    calculateAchievements();
  }, [boardId]);

  const calculateAchievements = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get columns for this board
    const { data: columns } = await supabase
      .from("columns")
      .select("id")
      .eq("board_id", boardId);

    if (!columns) return;

    // Get task history for completed tasks
    const { data: history } = await supabase
      .from("task_history")
      .select("task_id, created_at, action")
      .eq("user_id", user.id)
      .eq("action", "created");

    const tasksCreated = history?.length || 0;

    // Get assigned tasks
    const { data: assignedTasks } = await supabase
      .from("task_assignees")
      .select("task_id")
      .eq("user_id", user.id);

    const tasksAssigned = assignedTasks?.length || 0;

    const achievementsList: Achievement[] = [
      {
        id: "speed-demon",
        name: "Speed Demon",
        description: "Maak 10 taken aan",
        icon: Zap,
        progress: tasksCreated,
        goal: 10,
        unlocked: tasksCreated >= 10,
      },
      {
        id: "taskmaster",
        name: "Taskmaster",
        description: "Werk aan 20 taken",
        icon: Target,
        progress: tasksAssigned,
        goal: 20,
        unlocked: tasksAssigned >= 20,
      },
      {
        id: "milestone",
        name: "Milestone Master",
        description: "Bereik 50 taken milestone",
        icon: Star,
        progress: tasksCreated,
        goal: 50,
        unlocked: tasksCreated >= 50,
      },
    ];

    setAchievements(achievementsList);
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-sm">🏆 Achievements</h3>
      </div>

      <div className="flex-1 overflow-auto space-y-3">
        {achievements.map(achievement => {
          const Icon = achievement.icon;
          const progressPercent = Math.min((achievement.progress / achievement.goal) * 100, 100);

          return (
            <div
              key={achievement.id}
              className={`p-3 rounded-lg border ${
                achievement.unlocked
                  ? "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-300"
                  : "bg-muted"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  achievement.unlocked ? "bg-yellow-500" : "bg-muted-foreground/20"
                }`}>
                  <Icon className={`h-4 w-4 ${
                    achievement.unlocked ? "text-white" : "text-muted-foreground"
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{achievement.name}</h4>
                    {achievement.unlocked && (
                      <Badge variant="secondary" className="text-xs">
                        Ontgrendeld!
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {achievement.description}
                  </p>
                  <div className="mt-2 space-y-1">
                    <Progress value={progressPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {achievement.progress} / {achievement.goal}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
