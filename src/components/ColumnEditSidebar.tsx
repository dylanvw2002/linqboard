import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";

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
          height: editedColumn.height
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
