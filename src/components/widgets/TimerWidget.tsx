import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { toast } from "sonner";

interface TimerWidgetProps {
  widgetId: string;
  settings?: any;
}

export const TimerWidget = ({ widgetId, settings }: TimerWidgetProps) => {
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(300);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && totalSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            toast.success("Timer afgelopen!", {
              description: "De tijd is om!",
            });
            // Play notification sound
            const audio = new Audio("/notification.mp3");
            audio.play().catch(() => {});
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, totalSeconds]);

  useEffect(() => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    setMinutes(mins);
    setSeconds(secs);
  }, [totalSeconds]);

  const handleStart = () => {
    if (totalSeconds === 0) {
      setTotalSeconds(minutes * 60 + seconds);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTotalSeconds(300);
  };

  const handlePreset = (mins: number) => {
    setIsRunning(false);
    setTotalSeconds(mins * 60);
  };

  const progress = totalSeconds > 0 ? (totalSeconds / (minutes * 60 + seconds || 300)) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
      <div className="flex items-center gap-2 text-primary">
        <Clock className="w-5 h-5" />
        <h3 className="font-semibold text-sm">⏱️ Timer</h3>
      </div>
      
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
            className="text-primary transition-all duration-1000"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleStart} variant={isRunning ? "secondary" : "default"}>
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button size="sm" onClick={handleReset} variant="outline">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        <Button size="sm" variant="outline" onClick={() => handlePreset(5)}>
          5 min
        </Button>
        <Button size="sm" variant="outline" onClick={() => handlePreset(15)}>
          15 min
        </Button>
        <Button size="sm" variant="outline" onClick={() => handlePreset(30)}>
          30 min
        </Button>
        <Button size="sm" variant="outline" onClick={() => handlePreset(60)}>
          1 uur
        </Button>
      </div>
    </div>
  );
};
