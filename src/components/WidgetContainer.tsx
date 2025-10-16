import React, { useState } from "react";
import { ChatWidget } from "./ChatWidget";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Widget>) => void;
  isEditMode: boolean;
}

export const WidgetContainer = ({
  widget,
  onDelete,
  onUpdate,
  isEditMode,
}: WidgetContainerProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - widget.x_position,
      y: e.clientY - widget.y_position,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && isEditMode) {
      onUpdate(widget.id, {
        x_position: e.clientX - dragStart.x,
        y_position: e.clientY - dragStart.y,
      });
    }
    if (isResizing && isEditMode) {
      const newWidth = Math.max(300, e.clientX - widget.x_position);
      const newHeight = Math.max(200, e.clientY - widget.y_position);
      onUpdate(widget.id, {
        width: newWidth,
        height: newHeight,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  const renderWidgetContent = () => {
    switch (widget.widget_type) {
      case "chat":
        return <ChatWidget widgetId={widget.id} />;
      default:
        return <div className="p-4">Widget type: {widget.widget_type}</div>;
    }
  };

  return (
    <div
      className={cn(
        "absolute shadow-2xl rounded-lg overflow-hidden border-2",
        isDragging && "opacity-70 cursor-grabbing",
        isEditMode && !isDragging && "cursor-grab hover:ring-2 hover:ring-primary",
        !isEditMode && "cursor-default",
        "bg-card border-border"
      )}
      style={{
        left: widget.x_position,
        top: widget.y_position,
        width: widget.width,
        height: widget.height,
      }}
    >
      {isEditMode && (
        <div
          className="absolute top-0 left-0 right-0 h-8 bg-primary/10 backdrop-blur-sm flex items-center justify-between px-2 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="text-xs font-medium text-muted-foreground">
            Widget slepen
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onDelete(widget.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className={cn("h-full", isEditMode && "pt-8")}>
        {renderWidgetContent()}
      </div>
      {isEditMode && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-primary cursor-se-resize"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
            setDragStart({
              x: e.clientX,
              y: e.clientY,
            });
          }}
        />
      )}
    </div>
  );
};
