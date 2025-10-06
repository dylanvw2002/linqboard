import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, GripVertical, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getGlowStyles, getGlowTypeLabel, GlowType } from "@/lib/glowStyles";
import { ColumnType, getColumnTypeOptions } from "@/lib/columnTypes";

interface Column {
  id: string;
  name: string;
  position: number;
  width_ratio: number;
  board_id: string;
  glow_type?: GlowType;
  column_type?: ColumnType;
}

interface ColumnManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
  boardId: string;
  onColumnsChange: () => void;
}

export function ColumnManagement({ open, onOpenChange, columns, boardId, onColumnsChange }: ColumnManagementProps) {
  const [editingColumns, setEditingColumns] = useState<Column[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; columnId: string | null }>({ open: false, columnId: null });
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Initialize editing columns when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setEditingColumns([...columns].sort((a, b) => a.position - b.position));
    }
    onOpenChange(newOpen);
  };

  const updateColumnName = (id: string, name: string) => {
    setEditingColumns(cols => cols.map(col => col.id === id ? { ...col, name } : col));
  };

  const updateColumnWidth = (id: string, width: number) => {
    setEditingColumns(cols => cols.map(col => col.id === id ? { ...col, width_ratio: width } : col));
  };

  const updateColumnGlowType = (id: string, glowType: GlowType) => {
    setEditingColumns(cols => cols.map(col => col.id === id ? { ...col, glow_type: glowType } : col));
  };

  const updateColumnType = (id: string, columnType: ColumnType) => {
    setEditingColumns(cols => cols.map(col => col.id === id ? { ...col, column_type: columnType } : col));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newCols = [...editingColumns];
    const [draggedCol] = newCols.splice(draggedIndex, 1);
    newCols.splice(index, 0, draggedCol);
    
    setEditingColumns(newCols);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    try {
      // Update all columns with new positions, names, widths, column types, and glow types
      const updates = editingColumns.map((col, index) => ({
        id: col.id,
        name: col.name,
        position: index,
        width_ratio: col.width_ratio,
        column_type: col.column_type || 'regular',
        glow_type: col.glow_type || 'default'
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('columns')
          .update({ 
            name: update.name, 
            position: update.position,
            width_ratio: update.width_ratio,
            column_type: update.column_type,
            glow_type: update.glow_type
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success("Kolommen bijgewerkt");
      onColumnsChange();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Fout bij opslaan: " + error.message);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      // Check if there are tasks in this column
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id')
        .eq('column_id', columnId);

      if (tasksError) throw tasksError;

      if (tasks && tasks.length > 0) {
        // Move tasks to the first column
        const firstColumn = editingColumns.find(col => col.id !== columnId);
        if (!firstColumn) {
          toast.error("Kan kolom niet verwijderen: er zijn geen andere kolommen");
          return;
        }

        const { error: moveError } = await supabase
          .from('tasks')
          .update({ column_id: firstColumn.id })
          .eq('column_id', columnId);

        if (moveError) throw moveError;
      }

      // Delete the column
      const { error: deleteError } = await supabase
        .from('columns')
        .delete()
        .eq('id', columnId);

      if (deleteError) throw deleteError;

      toast.success("Kolom verwijderd");
      setEditingColumns(cols => cols.filter(col => col.id !== columnId));
      onColumnsChange();
      setDeleteConfirm({ open: false, columnId: null });
    } catch (error: any) {
      toast.error("Fout bij verwijderen: " + error.message);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      toast.error("Kolomnaam mag niet leeg zijn");
      return;
    }

    try {
      const newPosition = editingColumns.length;
      const { data, error } = await supabase
        .from('columns')
        .insert({
          board_id: boardId,
          name: newColumnName,
          position: newPosition,
          width_ratio: 1
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Kolom toegevoegd");
      setEditingColumns([...editingColumns, data]);
      setNewColumnName("");
      setIsAddingColumn(false);
      onColumnsChange();
    } catch (error: any) {
      toast.error("Fout bij toevoegen: " + error.message);
    }
  };

  const getWidthLabel = (width: number) => {
    const labels = { 1: "Klein", 2: "Gemiddeld", 3: "Groot", 4: "Extra groot" };
    return labels[width as keyof typeof labels] || "Gemiddeld";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kolommen beheren</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {editingColumns.map((col, index) => (
              <div 
                key={col.id} 
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-4 border rounded-lg bg-card transition-all cursor-move ${
                  draggedIndex === index ? 'opacity-40 scale-95' : ''
                } ${
                  dragOverIndex === index && draggedIndex !== index ? 'border-primary border-2' : ''
                }`}
              >
                <div className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <Label htmlFor={`name-${col.id}`}>Naam</Label>
                    <Input
                      id={`name-${col.id}`}
                      value={col.name}
                      onChange={(e) => updateColumnName(col.id, e.target.value)}
                      placeholder="Kolomnaam"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`width-${col.id}`}>
                      Breedte: {getWidthLabel(col.width_ratio)}
                    </Label>
                    <Slider
                      id={`width-${col.id}`}
                      value={[col.width_ratio]}
                      onValueChange={([value]) => updateColumnWidth(col.id, value)}
                      min={1}
                      max={4}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`type-${col.id}`}>Kolom Type</Label>
                    <Select
                      value={col.column_type || 'regular'}
                      onValueChange={(value: ColumnType) => updateColumnType(col.id, value)}
                    >
                      <SelectTrigger id={`type-${col.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getColumnTypeOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`glow-${col.id}`}>Glow Effect</Label>
                    <Select
                      value={col.glow_type || 'default'}
                      onValueChange={(value: GlowType) => updateColumnGlowType(col.id, value)}
                    >
                      <SelectTrigger id={`glow-${col.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(['default', 'red', 'green', 'blue', 'yellow', 'purple', 'orange'] as GlowType[]).map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border ${getGlowStyles(type).header.split(' ')[0]}`} />
                              {getGlowTypeLabel(type)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteConfirm({ open: true, columnId: col.id })}
                  disabled={editingColumns.length === 1}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {isAddingColumn ? (
              <div className="flex gap-2 p-4 border rounded-lg bg-card">
                <Input
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Nieuwe kolomnaam"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                />
                <Button onClick={handleAddColumn}>Toevoegen</Button>
                <Button variant="ghost" onClick={() => {
                  setIsAddingColumn(false);
                  setNewColumnName("");
                }}>
                  Annuleren
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsAddingColumn(true)}
                disabled={editingColumns.length >= 8}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe kolom toevoegen
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSave}>
              Opslaan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ open, columnId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kolom verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Alle taken in deze kolom worden verplaatst naar de eerste kolom. Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm.columnId && handleDeleteColumn(deleteConfirm.columnId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}