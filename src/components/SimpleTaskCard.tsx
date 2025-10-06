import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Calendar } from "lucide-react";

interface SimpleTaskCardProps {
  title: string;
  description: string | null;
  dueDate: string | null;
  onClick: () => void;
  glowShadow?: string;
}

export const SimpleTaskCard = ({
  title,
  description,
  dueDate,
  onClick,
  glowShadow = "shadow-[0_8px_24px_rgba(2,6,23,0.08)] hover:shadow-[0_12px_36px_rgba(2,6,23,0.15)]"
}: SimpleTaskCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-[18px] p-3 ${glowShadow} transition-all duration-200 border border-border/50 cursor-pointer hover:scale-[1.02]`}
    >
      <h4 className="font-semibold text-sm text-foreground mb-1 leading-snug">
        {title}
      </h4>
      
      {description && (
        <p className="text-xs text-muted-foreground mb-2">
          {description}
        </p>
      )}
      
      {dueDate && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            Terug: {format(new Date(dueDate), "d MMM", { locale: nl })}
          </span>
        </div>
      )}
    </div>
  );
};
