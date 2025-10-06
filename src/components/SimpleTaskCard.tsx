import { format, Locale } from "date-fns";
import { nl, enUS, es, de } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation();
  
  return (
    <div
      onClick={onClick}
      className={cn("relative backdrop-blur-[60px] bg-white/25 dark:bg-card/25 border-2 border-white/40 dark:border-white/20 rounded-[24px] p-3.5 cursor-pointer hover:-translate-y-2 transition-all duration-300 before:absolute before:inset-0 before:rounded-[24px] before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity after:absolute after:inset-[1px] after:rounded-[23px] after:bg-gradient-to-br after:from-transparent after:to-white/10 after:pointer-events-none", glowGradient, glowShadow)}
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
            {format(new Date(dueDate), "d MMM", { locale: getDateLocale(i18n.language) })}
          </span>
        </div>
      )}

      {assignees && assignees.length > 0 && (
        <div className="flex items-center gap-1 mt-3 relative z-[60]">
          {assignees.slice(0, 3).map((assignee, idx) => {
            return (
              <Tooltip key={assignee.user_id} delayDuration={200}>
                <TooltipTrigger asChild>
                  <Avatar className="h-10 w-10 border-[3px] border-white dark:border-gray-700 cursor-pointer hover:scale-110 hover:z-10 transition-all shadow-lg" style={{ marginLeft: idx > 0 ? '-14px' : '0' }}>
                    <AvatarImage src={assignee.avatar_url || undefined} />
                    <AvatarFallback className="text-base font-black bg-gradient-to-br from-primary to-primary/70 text-white">
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
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/70 border-[3px] border-white dark:border-gray-700 flex items-center justify-center text-base font-black text-white cursor-pointer hover:scale-110 transition-all shadow-lg" style={{ marginLeft: '-14px' }}>
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
