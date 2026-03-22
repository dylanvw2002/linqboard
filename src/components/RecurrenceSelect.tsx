import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Repeat } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RecurrenceSelectProps {
  pattern: string | null;
  interval: number;
  endDate: Date | undefined;
  onPatternChange: (pattern: string | null) => void;
  onIntervalChange: (interval: number) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

const PATTERN_LABELS: Record<string, string> = {
  daily: "Dagelijks",
  weekly: "Wekelijks",
  monthly: "Maandelijks",
};

export function RecurrenceSelect({
  pattern,
  interval,
  endDate,
  onPatternChange,
  onIntervalChange,
  onEndDateChange,
}: RecurrenceSelectProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Repeat className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Herhaling</Label>
      </div>
      <Select value={pattern || "none"} onValueChange={(v) => onPatternChange(v === "none" ? null : v)}>
        <SelectTrigger>
          <SelectValue placeholder="Geen herhaling" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Geen herhaling</SelectItem>
          <SelectItem value="daily">Dagelijks</SelectItem>
          <SelectItem value="weekly">Wekelijks</SelectItem>
          <SelectItem value="monthly">Maandelijks</SelectItem>
        </SelectContent>
      </Select>

      {pattern && (
        <>
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Elke</Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={interval}
              onChange={(e) => onIntervalChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">
              {pattern === "daily" ? "dag(en)" : pattern === "weekly" ? "we(e)k(en)" : "maand(en)"}
            </span>
          </div>

          <div>
            <Label className="text-sm">Eindigt op (optioneel)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP", { locale: nl }) : "Geen einddatum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={onEndDateChange} initialFocus className="pointer-events-auto" />
                {endDate && (
                  <div className="p-3 border-t">
                    <Button variant="outline" className="w-full" onClick={() => onEndDateChange(undefined)}>
                      Einddatum verwijderen
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}
    </div>
  );
}
