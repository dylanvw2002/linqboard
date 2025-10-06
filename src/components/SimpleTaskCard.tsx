import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Assignee {
  user_id: string;
  full_name: string;
}

interface SimpleTaskCardProps {
  title: string;
  description: string | null;
  dueDate: string | null;
  onClick: () => void;
  glowShadow?: string;
  assignees?: Assignee[];
  glowGradient?: string;
}

export const SimpleTaskCard = ({
  title,
  description,
  dueDate,
  onClick,
  glowShadow = "shadow-[0_8px_24px_rgba(2,6,23,0.08)] hover:shadow-[0_12px_36px_rgba(2,6,23,0.15)]",
  assignees = [],
  glowGradient = ""
}: SimpleTaskCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn("relative backdrop-blur-[60px] border-2 border-white/40 dark:border-white/20 rounded-[24px] p-3.5 cursor-pointer hover:-translate-y-2 transition-all duration-300 before:absolute before:inset-0 before:rounded-[24px] before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[23px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none", glowGradient || "bg-white/25 dark:bg-card/25", glowShadow)}
    >
      <h4 className="font-semibold text-sm text-foreground mb-1 leading-snug relative z-10">
        {title}
      </h4>
      
      {description && (
        <p className="text-xs text-muted-foreground mb-2 relative z-10">
          {description}
        </p>
      )}
      
      {dueDate && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground relative z-10">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            Terug: {format(new Date(dueDate), "d MMM", { locale: nl })}
          </span>
        </div>
      )}

      {assignees && assignees.length > 0 && (
        <div className="flex items-center gap-1 mt-2 relative z-10">
          {assignees.slice(0, 3).map((assignee, idx) => (
            <Avatar key={assignee.user_id} className="h-5 w-5 border border-white" style={{ marginLeft: idx > 0 ? '-6px' : '0' }}>
              <AvatarFallback className="text-[9px] bg-primary/10">
                {assignee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {assignees.length > 3 && (
            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold" style={{ marginLeft: '-6px' }}>
              +{assignees.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
