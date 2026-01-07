import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, X, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NewChecklistItem {
  id: string;
  title: string;
  is_completed: boolean;
  position: number;
}

interface TaskChecklistCreateProps {
  items: NewChecklistItem[];
  onChange: (items: NewChecklistItem[]) => void;
}

export const TaskChecklistCreate = ({ items, onChange }: TaskChecklistCreateProps) => {
  const { t } = useTranslation();
  const [newItemTitle, setNewItemTitle] = useState('');

  // Calculate progress
  const completedCount = items.filter(item => item.is_completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Toggle item completion
  const toggleItem = (itemId: string) => {
    onChange(
      items.map(item =>
        item.id === itemId ? { ...item, is_completed: !item.is_completed } : item
      )
    );
  };

  // Add new item
  const addItem = () => {
    if (!newItemTitle.trim()) return;

    const newItem: NewChecklistItem = {
      id: `temp-${Date.now()}`,
      title: newItemTitle.trim(),
      is_completed: false,
      position: items.length,
    };

    onChange([...items, newItem]);
    setNewItemTitle('');
  };

  // Delete item
  const deleteItem = (itemId: string) => {
    onChange(items.filter(item => item.id !== itemId));
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addItem();
    }
  };

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
              onCheckedChange={() => toggleItem(item.id)}
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
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteItem(item.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add new item */}
      <div className="flex items-center gap-2">
        <Input
          placeholder={t('board.addChecklistItem')}
          value={newItemTitle}
          onChange={e => setNewItemTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={addItem}
          disabled={!newItemTitle.trim()}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
