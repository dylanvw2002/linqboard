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
      className={`relative backdrop-blur-[60px] bg-white/25 dark:bg-card/25 border-2 border-white/40 dark:border-white/20 rounded-[24px] p-3.5 cursor-pointer hover:-translate-y-2 transition-all duration-300 before:absolute before:inset-0 before:rounded-[24px] before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[23px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none ${glowShadow}`}
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
    </div>
  );
};
