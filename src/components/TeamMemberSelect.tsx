import { useState } from "react";
import { Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TeamMember {
  user_id: string;
  full_name: string;
  avatar_url?: string;
}

interface TeamMemberSelectProps {
  members: TeamMember[];
  selectedMembers: string[];
  onSelect: (userId: string) => void;
  placeholder: string;
}

export function TeamMemberSelect({
  members,
  selectedMembers,
  onSelect,
  placeholder,
}: TeamMemberSelectProps) {
  const [open, setOpen] = useState(false);

  const availableMembers = members.filter(
    (m) => !selectedMembers.includes(m.user_id)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start text-muted-foreground font-normal"
        >
          {placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 z-[99999] bg-white dark:bg-card border-2 border-primary/20"
        align="start"
        side="bottom"
        sideOffset={5}
        style={{ pointerEvents: "auto" }}
      >
        <div className="max-h-[300px] overflow-y-auto p-1">
          {availableMembers.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Geen beschikbare teamleden
            </div>
          ) : (
            availableMembers.map((member) => (
              <button
                key={member.user_id}
                onClick={() => {
                  onSelect(member.user_id);
                  setOpen(false);
                }}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                  "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                  "text-left"
                )}
                style={{ pointerEvents: "auto" }}
              >
                <Check className="mr-2 h-4 w-4 opacity-0" />
                <span>{member.full_name}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
