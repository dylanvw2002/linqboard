import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NotesWidgetProps {
  widgetId: string;
  settings?: any;
}

export const NotesWidget = ({ widgetId, settings }: NotesWidgetProps) => {
  const [content, setContent] = useState(settings?.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setContent(settings?.content || "");
  }, [settings?.content]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("widgets")
        .update({ settings: { content } })
        .eq("id", widgetId);

      if (error) throw error;
      
      setHasChanges(false);
      toast.success("Notitie opgeslagen");
    } catch (error: any) {
      toast.error("Kon notitie niet opslaan: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">📝 Notities</h3>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="h-7"
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <Save className="h-3 w-3 mr-1" />
              Opslaan
            </>
          )}
        </Button>
      </div>
      <Textarea
        value={content}
        onChange={handleChange}
        placeholder="Begin met typen..."
        className="flex-1 resize-none"
      />
    </div>
  );
};
