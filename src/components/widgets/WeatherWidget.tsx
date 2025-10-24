import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cloud, MapPin } from "lucide-react";
import { toast } from "sonner";

interface WeatherWidgetProps {
  widgetId: string;
  settings?: any;
}

export const WeatherWidget = ({ widgetId, settings }: WeatherWidgetProps) => {
  const [location, setLocation] = useState(settings?.location || "Amsterdam");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-sm">🌤️ Weer</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
          className="h-7"
        >
          {isEditing ? "Opslaan" : "Locatie"}
        </Button>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Input
            placeholder="Stad"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      ) : null}

      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{location}</span>
        </div>
        
        <div className="text-center">
          <div className="text-6xl font-bold">--°</div>
          <p className="text-sm text-muted-foreground mt-2">
            Weer widget vereist API configuratie
          </p>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Neem contact op met support om OpenWeatherMap API toe te voegen
        </div>
      </div>
    </div>
  );
};
