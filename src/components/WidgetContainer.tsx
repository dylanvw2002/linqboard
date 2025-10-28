import React from "react";
import { ChatWidget } from "./ChatWidget";
import { NotesWidget } from "./widgets/NotesWidget";
import { TimerWidget } from "./widgets/TimerWidget";
import { CalculatorWidget } from "./widgets/CalculatorWidget";
import { QuickLinksWidget } from "./widgets/QuickLinksWidget";
import { CalendarWidget } from "./widgets/CalendarWidget";
import { NotificationsCenterWidget } from "./widgets/NotificationsCenterWidget";
import { AchievementBadgesWidget } from "./widgets/AchievementBadgesWidget";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResizeHandles } from "./ResizeHandles";

interface Widget {
  id: string;
  widget_type: "chat" | "notes" | "timer" | "calculator" | "quick-links" | "calendar" | "notifications" | "achievements";
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  board_id: string;
  settings?: any;
}

interface WidgetContainerProps {
  widget: Widget;
  boardName: string;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, widget: Widget) => void;
  onDragEnd: () => void;
  onResizeMouseDown: (e: React.MouseEvent, widget: Widget, handle: string) => void;
  resizeHandle: string | null;
  isEditMode: boolean;
  isDragging: boolean;
  onSizeChange?: (widgetId: string, width: number, height: number, x: number, y: number) => void;
}

export const WidgetContainer = ({
  widget,
  boardName,
  onDelete,
  onDragStart,
  onDragEnd,
  onResizeMouseDown,
  resizeHandle,
  isEditMode,
  isDragging,
  onSizeChange,
}: WidgetContainerProps) => {
  const renderWidgetContent = () => {
    switch (widget.widget_type) {
      case "chat":
        return (
          <ChatWidget 
            widgetId={widget.id} 
            boardName={boardName}
            x={widget.x_position}
            y={widget.y_position}
            onSizeChange={(width, height, x, y) => {
              if (onSizeChange) {
                onSizeChange(widget.id, width, height, x, y);
              }
            }}
          />
        );
      case "notes":
        return <NotesWidget widgetId={widget.id} settings={widget.settings} />;
      case "timer":
        return <TimerWidget widgetId={widget.id} settings={widget.settings} />;
      case "calculator":
        return <CalculatorWidget widgetId={widget.id} />;
      case "quick-links":
        return <QuickLinksWidget widgetId={widget.id} settings={widget.settings} />;
      case "calendar":
        return <CalendarWidget widgetId={widget.id} boardId={widget.board_id} />;
      case "notifications":
        return <NotificationsCenterWidget widgetId={widget.id} boardId={widget.board_id} />;
      case "achievements":
        return <AchievementBadgesWidget widgetId={widget.id} boardId={widget.board_id} />;
      default:
        return <div className="p-4">Widget type: {widget.widget_type}</div>;
    }
  };

  // Check if this is a collapsed chat widget (56x56px button only)
  const isCollapsedChat = widget.widget_type === "chat" && widget.width === 56 && widget.height === 56;

  return (
    <div
      className={cn(
        "absolute transition-all z-20",
        !isCollapsedChat && "shadow-2xl rounded-lg border-2 bg-card border-border",
        isCollapsedChat ? "overflow-visible" : "overflow-hidden",
        isDragging && "opacity-50",
        isEditMode && !isDragging && "cursor-move hover:ring-2 hover:ring-primary hover:shadow-2xl",
        !isEditMode && "cursor-default"
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
      {isEditMode && !isCollapsedChat && (
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
      {isEditMode && isCollapsedChat && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute -top-2 -right-2 h-6 w-6 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full shadow-lg z-10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(widget.id);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      {isEditMode && !isCollapsedChat && (
        <ResizeHandles
          mode="column"
          onMouseDown={(e, handle) => onResizeMouseDown(e, widget, handle)}
          activeHandle={resizeHandle}
          headerHeight={0}
        />
      )}
      <div className={cn("h-full", isEditMode && !isCollapsedChat && "pt-8")}>
        {renderWidgetContent()}
      </div>
    </div>
  );
};
