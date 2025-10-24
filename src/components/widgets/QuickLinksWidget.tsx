import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link as LinkIcon, Plus, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Link {
  [key: string]: string;
  url: string;
  title: string;
}

interface QuickLinksWidgetProps {
  widgetId: string;
  settings?: any;
}

export const QuickLinksWidget = ({ widgetId, settings }: QuickLinksWidgetProps) => {
  const [links, setLinks] = useState<Link[]>(settings?.links || []);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setLinks(settings?.links || []);
  }, [settings?.links]);

  const handleSave = async (updatedLinks: Link[]) => {
    try {
      const { error } = await supabase
        .from("widgets")
        .update({ settings: { links: updatedLinks } })
        .eq("id", widgetId);

      if (error) throw error;
      setLinks(updatedLinks);
    } catch (error: any) {
      toast.error("Kon link niet opslaan: " + error.message);
    }
  };

  const handleAdd = async () => {
    if (!newUrl || !newTitle) {
      toast.error("Vul zowel URL als titel in");
      return;
    }

    const updatedLinks = [...links, { url: newUrl, title: newTitle }];
    await handleSave(updatedLinks);
    setNewUrl("");
    setNewTitle("");
    setIsAdding(false);
    toast.success("Link toegevoegd");
  };

  const handleDelete = async (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    await handleSave(updatedLinks);
    toast.success("Link verwijderd");
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">🔗 Snelkoppelingen</h3>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)} className="h-7">
          {isAdding ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </Button>
      </div>

      {isAdding && (
        <div className="space-y-2 p-3 bg-muted rounded-lg">
          <Input
            placeholder="Titel"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Input
            placeholder="https://example.com"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <Button size="sm" onClick={handleAdd} className="w-full">
            Link toevoegen
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {links.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            Geen links toegevoegd
          </div>
        ) : (
          links.map((link, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <LinkIcon className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="text-sm truncate">{link.title}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
              </a>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(index)}
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
