import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Music, Save } from "lucide-react";
import { toast } from "sonner";

interface SpotifyWidgetProps {
  widgetId: string;
  settings?: any;
}

export const SpotifyWidget = ({ widgetId, settings }: SpotifyWidgetProps) => {
  const [url, setUrl] = useState(settings?.url || "");
  const [embedUrl, setEmbedUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (settings?.url) {
      setUrl(settings.url);
      setEmbedUrl(convertToEmbedUrl(settings.url));
    }
  }, [settings?.url]);

  const convertToEmbedUrl = (spotifyUrl: string): string => {
    try {
      // Extract Spotify ID from various URL formats
      const patterns = [
        /spotify\.com\/track\/([a-zA-Z0-9]+)/,
        /spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
        /spotify\.com\/album\/([a-zA-Z0-9]+)/,
        /spotify\.com\/episode\/([a-zA-Z0-9]+)/,
      ];

      for (const pattern of patterns) {
        const match = spotifyUrl.match(pattern);
        if (match) {
          const type = spotifyUrl.includes("/track/") ? "track" :
                      spotifyUrl.includes("/playlist/") ? "playlist" :
                      spotifyUrl.includes("/album/") ? "album" : "episode";
          return `https://open.spotify.com/embed/${type}/${match[1]}`;
        }
      }

      return "";
    } catch {
      return "";
    }
  };

  const handleSave = async () => {
    try {
      const newEmbedUrl = convertToEmbedUrl(url);
      if (!newEmbedUrl) {
        toast.error("Ongeldige Spotify URL");
        return;
      }

      const { error } = await supabase
        .from("widgets")
        .update({ settings: { url } })
        .eq("id", widgetId);

      if (error) throw error;

      setEmbedUrl(newEmbedUrl);
      setIsEditing(false);
      toast.success("Spotify link opgeslagen");
    } catch (error: any) {
      toast.error("Kon link niet opslaan: " + error.message);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-sm">🎵 Spotify</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
          className="h-7"
        >
          {isEditing ? "Annuleren" : "Bewerken"}
        </Button>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Input
            placeholder="Plak Spotify URL (track, playlist, album)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button size="sm" onClick={handleSave} className="w-full">
            <Save className="h-3 w-3 mr-1" />
            Opslaan
          </Button>
        </div>
      ) : null}

      <div className="flex-1 bg-muted rounded-lg overflow-hidden">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {isEditing ? "Voeg een Spotify URL toe" : "Geen Spotify track ingesteld"}
          </div>
        )}
      </div>
    </div>
  );
};
