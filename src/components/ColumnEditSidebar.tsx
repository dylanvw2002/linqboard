import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X, Crop } from "lucide-react";
import { getGlowStyles, glowTypeLabels, GlowType } from "@/lib/glowStyles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Column {
  id: string;
  name: string;
  position: number;
  width_ratio: number;
  board_id: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  header_height: number;
  content_padding_top: number;
  content_padding_right: number;
  content_padding_bottom: number;
  content_padding_left: number;
  glow_type?: GlowType;
}

interface ColumnEditSidebarProps {
  column: Column;
  onClose: () => void;
  onSave: () => void;
}

export const ColumnEditSidebar = ({ column, onClose, onSave }: ColumnEditSidebarProps) => {
  const [editedColumn, setEditedColumn] = useState(column);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('columns')
        .update({
          name: editedColumn.name,
          x_position: editedColumn.x_position,
          y_position: editedColumn.y_position,
          width: editedColumn.width,
          height: editedColumn.height,
          header_height: editedColumn.header_height,
          content_padding_top: editedColumn.content_padding_top,
          content_padding_right: editedColumn.content_padding_right,
          content_padding_bottom: editedColumn.content_padding_bottom,
          content_padding_left: editedColumn.content_padding_left,
          glow_type: editedColumn.glow_type || 'default'
        })
        .eq('id', editedColumn.id);

      if (error) throw error;

      toast.success("Kolom opgeslagen");
      onSave();
      onClose();
    } catch (error: any) {
      toast.error("Fout bij opslaan: " + error.message);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-background shadow-2xl z-50 overflow-y-auto border-l">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Kolom bewerken</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="column-name">Naam</Label>
            <Input
              id="column-name"
              value={editedColumn.name}
              onChange={(e) => setEditedColumn({...editedColumn, name: e.target.value})}
              placeholder="Kolom naam"
            />
          </div>

          <div>
            <Label htmlFor="x-position">X Positie: {editedColumn.x_position}px</Label>
            <Input
              id="x-position"
              type="number"
              value={editedColumn.x_position}
              onChange={(e) => setEditedColumn({...editedColumn, x_position: parseInt(e.target.value) || 0})}
              min={0}
            />
          </div>

          <div>
            <Label htmlFor="y-position">Y Positie: {editedColumn.y_position}px</Label>
            <Input
              id="y-position"
              type="number"
              value={editedColumn.y_position}
              onChange={(e) => setEditedColumn({...editedColumn, y_position: parseInt(e.target.value) || 0})}
              min={0}
            />
          </div>

          <div>
            <Label>Breedte: {editedColumn.width}px</Label>
            <Slider
              value={[editedColumn.width]}
              onValueChange={(value) => setEditedColumn({...editedColumn, width: value[0]})}
              min={200}
              max={600}
              step={10}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Hoogte: {editedColumn.height}px</Label>
            <Slider
              value={[editedColumn.height]}
              onValueChange={(value) => setEditedColumn({...editedColumn, height: value[0]})}
              min={400}
              max={1000}
              step={50}
              className="mt-2"
            />
          </div>
        </div>

        {/* Header & Content Crop Section */}
        <div className="space-y-4 pt-6 border-t">
          <h4 className="font-semibold flex items-center gap-2">
            <Crop className="h-4 w-4" />
            Header & Taak Ruimte
          </h4>

          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> Klik op een kolom en sleep aan de hoeken/randen om te resizen
            </p>
            <p className="text-xs text-muted-foreground">
              • Sleep hoeken/randen = kolom grootte<br />
              • Houd Alt/Option + sleep = content ruimte
            </p>
          </div>

          <div>
            <Label>Header Hoogte: {editedColumn.header_height || 60}px</Label>
            <Slider
              value={[editedColumn.header_height || 60]}
              onValueChange={(value) => setEditedColumn({...editedColumn, header_height: value[0]})}
              min={40}
              max={200}
              step={5}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Boven: {editedColumn.content_padding_top || 0}px</Label>
              <Slider
                value={[editedColumn.content_padding_top || 0]}
                onValueChange={(value) => setEditedColumn({...editedColumn, content_padding_top: value[0]})}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs">Rechts: {editedColumn.content_padding_right || 0}px</Label>
              <Slider
                value={[editedColumn.content_padding_right || 0]}
                onValueChange={(value) => setEditedColumn({...editedColumn, content_padding_right: value[0]})}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs">Onder: {editedColumn.content_padding_bottom || 0}px</Label>
              <Slider
                value={[editedColumn.content_padding_bottom || 0]}
                onValueChange={(value) => setEditedColumn({...editedColumn, content_padding_bottom: value[0]})}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs">Links: {editedColumn.content_padding_left || 0}px</Label>
              <Slider
                value={[editedColumn.content_padding_left || 0]}
                onValueChange={(value) => setEditedColumn({...editedColumn, content_padding_left: value[0]})}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="glow-type">Glow Type</Label>
            <Select
              value={editedColumn.glow_type || 'default'}
              onValueChange={(value: GlowType) => setEditedColumn({...editedColumn, glow_type: value})}
            >
              <SelectTrigger id="glow-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(glowTypeLabels) as GlowType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${getGlowStyles(type).card}`} />
                      {glowTypeLabels[type]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            Opslaan
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuleren
          </Button>
        </div>
      </div>
    </div>
  );
};
