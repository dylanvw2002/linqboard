import React from "react";
import { ChatWidget } from "./ChatWidget";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResizeHandles } from "./ResizeHandles";

interface Widget {
  id: string;
  widget_type: "chat" | "notes" | "calculator" | "timer";
  x_position: number;
  y_position: number;
  width: number;
  height: number;
}

interface WidgetContainerProps {
  widget: Widget;
  boardName: string;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, widget: Widget) => void;
  onDragEnd: () => void;
  onResizeMouseDown: (e: React.MouseEvent, widget: Widget, handle: string) => void;
  onModeChange: (widgetId: string, mode: 'general' | 'private') => void;
  resizeHandle: string | null;
  isEditMode: boolean;
  isDragging: boolean;
}

export const WidgetContainer = ({
  widget,
  boardName,
  onDelete,
  onDragStart,
  onDragEnd,
  onResizeMouseDown,
  onModeChange,
  resizeHandle,
  isEditMode,
  isDragging,
}: WidgetContainerProps) => {
  const renderWidgetContent = () => {
    switch (widget.widget_type) {
      case "chat":
        return (
          <ChatWidget 
            widgetId={widget.id} 
            boardName={boardName}
            widgetMode={(widget as any).mode || 'private'}
            onModeChange={(mode) => onModeChange(widget.id, mode)}
          />
        );
      default:
        return <div className="p-4">Widget type: {widget.widget_type}</div>;
    }
  };

  return (
    <div
      className={cn(
        "absolute shadow-2xl rounded-lg overflow-hidden border-2 transition-all",
        isDragging && "opacity-50",
        isEditMode && !isDragging && "cursor-move hover:ring-2 hover:ring-primary hover:shadow-2xl",
        !isEditMode && "cursor-default",
        "bg-card border-border"
      )}
      style={{
        left: `${widget.x_position}px`,
        top: `${widget.y_position}px`,
        width: `${widget.width}px`,
        height: `${widget.height}px`,
      }}
      draggable={isEditMode}
      onDragStart={(e) => isEditMode && onDragStart(e, widget)}
      onDragEnd={onDragEnd}
    >
      {isEditMode && (
        <div className="absolute top-0 left-0 right-0 h-8 bg-primary/10 backdrop-blur-sm flex items-center justify-between px-2 z-10">
          <div className="text-xs font-medium text-muted-foreground cursor-grab active:cursor-grabbing">
            ⋮⋮ Widget slepen
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(widget.id);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {isEditMode && (
        <ResizeHandles
          mode="column"
          onMouseDown={(e, handle) => onResizeMouseDown(e, widget, handle)}
          activeHandle={resizeHandle}
          headerHeight={0}
        />
      )}
      <div className={cn("h-full", isEditMode && "pt-8")}>
        {renderWidgetContent()}
      </div>
    </div>
  );
};
