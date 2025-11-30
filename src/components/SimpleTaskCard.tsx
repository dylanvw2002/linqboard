import { format, Locale } from "date-fns";
import { nl, enUS, es, de } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

const getDateLocale = (language: string) => {
  const locales: Record<string, Locale> = { nl, en: enUS, es, de };
  return locales[language] || nl;
};

interface Assignee {
  user_id: string;
  full_name: string;
  avatar_url?: string;
}

interface SimpleTaskCardProps {
  title: string;
  description: string | null;
  dueDate: string | null;
  onClick: () => void;
  glowShadow?: string;
  assignees?: Assignee[];
  glowGradient?: string;
  taskId?: string;
  columns?: Array<{ id: string; name: string }>;
}

export const SimpleTaskCard = ({
  title,
  description,
  dueDate,
  onClick,
  glowShadow = "shadow-[0_8px_24px_rgba(2,6,23,0.08)] hover:shadow-[0_12px_36px_rgba(2,6,23,0.15)]",
  assignees = [],
  glowGradient = "",
  taskId,
  columns = []
}: SimpleTaskCardProps) => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  
  // Check if deadline has passed - compare with start of today
  const isOverdue = dueDate ? new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) : false;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative backdrop-blur-sm bg-white/25 dark:bg-card/25 border-2 border-white/40 dark:border-white/20 rounded-[28px] cursor-pointer transition-transform duration-150 will-change-transform hover:-translate-y-2 transform-gpu before:absolute before:inset-0 before:rounded-[28px] before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-150 after:absolute after:inset-[1px] after:rounded-[27px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none contain-layout contain-paint",
        isMobile ? "p-8" : "p-3",
        glowGradient,
        glowShadow,
        isOverdue && "animate-overdue-glow"
      )}
    >
      <h4 className={cn(
        "font-extrabold text-foreground mb-1 leading-snug relative z-10",
        isMobile ? "text-4xl mb-3" : "text-[clamp(13px,1.5vw,16px)]"
      )}>
        {title}
      </h4>
      
      {description && (
        <p className={cn(
          "text-muted-foreground relative z-10 mb-1",
          isMobile ? "text-2xl mb-3" : "text-[clamp(11px,1.2vw,13px)] line-clamp-2"
        )}>
          {description}
        </p>
      )}
      
      {dueDate && (
        <div className={cn(
          "flex items-center gap-1.5 text-muted-foreground relative z-10 mb-2",
          isMobile ? "text-xl gap-2" : "text-xs"
        )}>
          <Calendar className={isMobile ? "h-6 w-6" : "h-3.5 w-3.5"} />
          <span>
            {format(new Date(dueDate), "d MMM", { locale: getDateLocale(i18n.language) })}
          </span>
        </div>
      )}

      {assignees && assignees.length > 0 && (
        <div className={cn(
          "flex items-center mt-2 relative z-[60]",
          isMobile ? "gap-1 mt-4" : "gap-0.5"
        )}>
          {assignees.slice(0, 3).map((assignee, idx) => {
            return (
              <Tooltip key={assignee.user_id} delayDuration={200}>
                <TooltipTrigger asChild>
                  <Avatar 
                    className={cn(
                      "border-white dark:border-gray-700 cursor-pointer hover:scale-110 hover:z-10 transition-transform duration-100 will-change-transform transform-gpu",
                      isMobile ? "h-14 w-14 border-[3px] shadow-lg" : "h-9 w-9 border-2"
                    )} 
                    style={{ marginLeft: idx > 0 ? (isMobile ? '-16px' : '-6px') : '0' }}
                  >
                    <AvatarImage src={assignee.avatar_url || undefined} />
                    <AvatarFallback className={cn(
                      "font-bold",
                      isMobile ? "text-xl bg-gradient-to-br from-primary to-primary/70 text-white" : "text-xs bg-primary/10"
                    )}>
                      {assignee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="top" className="z-[70] bg-foreground text-background">
                  <p className="font-bold text-sm">{assignee.full_name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          {assignees.length > 3 && (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "rounded-full border-white dark:border-gray-700 flex items-center justify-center font-bold cursor-pointer hover:scale-110 transition-transform duration-100 will-change-transform transform-gpu",
                    isMobile 
                      ? "h-14 w-14 border-[3px] bg-gradient-to-br from-primary to-primary/70 text-white text-xl shadow-lg" 
                      : "h-9 w-9 border-2 bg-muted text-xs"
                  )} 
                  style={{ marginLeft: isMobile ? '-16px' : '-6px' }}
                >
                  +{assignees.length - 3}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="z-[70] bg-foreground text-background">
                <div className="flex flex-col gap-1.5">
                  {assignees.slice(3).map(assignee => (
                    <p key={assignee.user_id} className="font-bold text-sm">{assignee.full_name}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
};
