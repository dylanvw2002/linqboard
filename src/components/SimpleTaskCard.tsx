import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleTaskCardProps {
  title: string;
  description: string | null;
  dueDate: string | null;
  glowStyles?: string;
  onClick: () => void;
}

export const SimpleTaskCard = ({
  title,
  description,
  dueDate,
  glowStyles,
  onClick
}: SimpleTaskCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border-2 shadow-sm cursor-pointer transition-all",
        glowStyles
      )}
    >
      <h4 className="font-semibold text-base mb-2">{title}</h4>
      
      {description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {description}
        </p>
      )}
      
      {dueDate && (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Terug: {format(new Date(dueDate), "d MMM yyyy", { locale: nl })}
          </span>
        </div>
      )}
    </div>
  );
};
