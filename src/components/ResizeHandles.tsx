import { cn } from "@/lib/utils";

interface ResizeHandlesProps {
  mode: 'column' | 'content' | 'header';
  onMouseDown: (e: React.MouseEvent, handle: string) => void;
  activeHandle: string | null;
}

export const ResizeHandles = ({ mode, onMouseDown, activeHandle }: ResizeHandlesProps) => {
  const isColumn = mode === 'column';
  const color = isColumn ? 'bg-purple-600' : 'bg-purple-600';
  const hoverColor = isColumn ? 'hover:bg-purple-700' : 'hover:bg-purple-700';
  
  // Only corner handles
  const handles = [
    { name: 'nw', cursor: 'nwse-resize', style: { top: -6, left: -6 }, title: 'Noordwest hoek' },
    { name: 'ne', cursor: 'nesw-resize', style: { top: -6, right: -6 }, title: 'Noordoost hoek' },
    { name: 'se', cursor: 'nwse-resize', style: { bottom: -6, right: -6 }, title: 'Zuidoost hoek' },
    { name: 'sw', cursor: 'nesw-resize', style: { bottom: -6, left: -6 }, title: 'Zuidwest hoek' }
  ];

  return (
    <>
      {handles.map((handle) => (
        <div
          key={handle.name}
          className={cn(
            "absolute z-50 border-2 border-white rounded-sm transition-all shadow-lg",
            color,
            hoverColor,
            activeHandle === handle.name ? "w-5 h-5 scale-110" : "w-4 h-4 hover:scale-110",
            `cursor-${handle.cursor}`
          )}
          style={handle.style}
          onMouseDown={(e) => onMouseDown(e, handle.name)}
          title={`${handle.title} - Sleep om grootte aan te passen`}
        />
      ))}
    </>
  );
};