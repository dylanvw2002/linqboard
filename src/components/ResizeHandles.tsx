import { cn } from "@/lib/utils";

interface ResizeHandlesProps {
  mode: 'column' | 'content';
  onMouseDown: (e: React.MouseEvent, handle: string) => void;
  activeHandle: string | null;
}

export const ResizeHandles = ({ mode, onMouseDown, activeHandle }: ResizeHandlesProps) => {
  const isColumn = mode === 'column';
  const color = isColumn ? 'bg-blue-500' : 'bg-green-500';
  const hoverColor = isColumn ? 'hover:bg-blue-600' : 'hover:bg-green-600';
  
  const handles = [
    { name: 'nw', cursor: 'nwse-resize', style: { top: -6, left: -6 }, title: 'Noordwest hoek' },
    { name: 'n', cursor: 'ns-resize', style: { top: -6, left: '50%', transform: 'translateX(-50%)' }, title: 'Boven' },
    { name: 'ne', cursor: 'nesw-resize', style: { top: -6, right: -6 }, title: 'Noordoost hoek' },
    { name: 'e', cursor: 'ew-resize', style: { top: '50%', right: -6, transform: 'translateY(-50%)' }, title: 'Rechts' },
    { name: 'se', cursor: 'nwse-resize', style: { bottom: -6, right: -6 }, title: 'Zuidoost hoek' },
    { name: 's', cursor: 'ns-resize', style: { bottom: -6, left: '50%', transform: 'translateX(-50%)' }, title: 'Onder' },
    { name: 'sw', cursor: 'nesw-resize', style: { bottom: -6, left: -6 }, title: 'Zuidwest hoek' },
    { name: 'w', cursor: 'ew-resize', style: { top: '50%', left: -6, transform: 'translateY(-50%)' }, title: 'Links' }
  ];

  return (
    <>
      {handles.map((handle) => (
        <div
          key={handle.name}
          className={cn(
            "absolute z-50 border-2 border-white rounded-full transition-all shadow-lg",
            color,
            hoverColor,
            activeHandle === handle.name ? "w-4 h-4 scale-150" : "w-3 h-3 hover:scale-125",
            `cursor-${handle.cursor}`
          )}
          style={handle.style}
          onMouseDown={(e) => onMouseDown(e, handle.name)}
          title={`${handle.title} - ${isColumn ? 'Kolom resizen' : 'Content resizen (Alt/Option)'}`}
        >
          <div 
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm",
              color,
              handle.name.includes('n') || handle.name.includes('s') ? "w-8 h-1" : "w-1 h-8"
            )}
          />
        </div>
      ))}
    </>
  );
};