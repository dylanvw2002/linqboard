import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, X, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
}

interface TaskChecklistProps {
  taskId: string;
  readOnly?: boolean;
}

export const TaskChecklist = ({ taskId, readOnly = false }: TaskChecklistProps) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch checklist items
  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .select('*')
        .eq('task_id', taskId)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching checklist items:', error);
      } else {
        setItems(data || []);
      }
      setIsLoading(false);
    };

    fetchItems();
  }, [taskId]);

  // Calculate progress
  const completedCount = items.filter(item => item.is_completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Toggle item completion (allowed in both view and edit mode)
  const toggleItem = async (item: ChecklistItem) => {
    const newCompleted = !item.is_completed;
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('task_checklist_items')
      .update({
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
        completed_by: newCompleted ? userData.user?.id : null,
      })
      .eq('id', item.id);

    if (error) {
      console.error('Error updating checklist item:', error);
      toast.error(t('common.error'));
    } else {
      setItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? {
                ...i,
                is_completed: newCompleted,
                completed_at: newCompleted ? new Date().toISOString() : null,
                completed_by: newCompleted ? userData.user?.id || null : null,
              }
            : i
        )
      );
    }
  };

  // Add new item
  const addItem = async () => {
    if (!newItemTitle.trim() || readOnly) return;

    setIsAdding(true);
    const maxPosition = items.length > 0 ? Math.max(...items.map(i => i.position)) + 1 : 0;

    const { data, error } = await supabase
      .from('task_checklist_items')
      .insert({
        task_id: taskId,
        title: newItemTitle.trim(),
        position: maxPosition,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding checklist item:', error);
      toast.error(t('common.error'));
    } else if (data) {
      setItems(prev => [...prev, data]);
      setNewItemTitle('');
      toast.success(t('board.checklistItemAdded'));
    }
    setIsAdding(false);
  };

  // Delete item
  const deleteItem = async (itemId: string) => {
    if (readOnly) return;

    const { error } = await supabase
      .from('task_checklist_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting checklist item:', error);
      toast.error(t('common.error'));
    } else {
      setItems(prev => prev.filter(i => i.id !== itemId));
      toast.success(t('board.checklistItemDeleted'));
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addItem();
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-8 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with progress */}
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{t('board.checklist')}</span>
        {totalCount > 0 && (
          <span className="text-xs text-muted-foreground">
            ({completedCount}/{totalCount})
          </span>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <Progress value={progressPercent} className="h-2" />
      )}

      {/* Checklist items */}
      <div className="space-y-1">
        {items.map(item => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group",
              item.is_completed && "opacity-60"
            )}
          >
            <Checkbox
              checked={item.is_completed}
              onCheckedChange={() => toggleItem(item)}
              className="shrink-0"
            />
            <span
              className={cn(
                "flex-1 text-sm",
                item.is_completed && "line-through text-muted-foreground"
              )}
            >
              {item.title}
            </span>
            {!readOnly && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteItem(item.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add new item */}
      {!readOnly && (
        <div className="flex items-center gap-2">
          <Input
            placeholder={t('board.addChecklistItem')}
            value={newItemTitle}
            onChange={e => setNewItemTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAdding}
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={addItem}
            disabled={!newItemTitle.trim() || isAdding}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && readOnly && (
        <p className="text-sm text-muted-foreground italic">
          {t('board.emptyChecklist')}
        </p>
      )}
    </div>
  );
};
