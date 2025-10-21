import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TaskStackProps {
  children: React.ReactNode[];
  maxVisibleTasks?: number;
  stackOffset?: number;
  onTaskClick?: (index: number) => void;
  availableHeight?: number;
}

export const TaskStack = ({ 
  children, 
  maxVisibleTasks = 4, 
  stackOffset = 5,
  onTaskClick,
  availableHeight
}: TaskStackProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      
      // Force a layout reflow to ensure we get updated dimensions
      void container.offsetHeight;
      
      const containerHeight = availableHeight || container.clientHeight;
      
      // Calculate how many tasks fit in the visible area
      const taskElements = container.querySelectorAll('[data-task-item]');
      
      // Wait for DOM to update if not all task elements are present yet
      if (taskElements.length === 0 || taskElements.length < children.length) {
        requestAnimationFrame(() => checkOverflow());
        return;
      }
      
      let totalHeight = 0;
      let visibleTaskCount = 0;
      
      // Bereken hoeveel taken passen in de beschikbare ruimte
      for (let i = 0; i < taskElements.length; i++) {
        const element = taskElements[i] as HTMLElement;
        // Force reflow for each task element
        void element.offsetHeight;
        const taskHeight = element.clientHeight;
        const gap = 12; // gap-3 = 12px
        
        // Check if adding this task would exceed available height
        if (totalHeight + taskHeight > containerHeight) {
          break;
        }
        
        totalHeight += taskHeight + gap;
        visibleTaskCount++;
      }
      
      setVisibleCount(visibleTaskCount);
      setIsOverflowing(visibleTaskCount < taskElements.length && visibleTaskCount > 0);
    };

    // Use double requestAnimationFrame to ensure browser has finished layout
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          checkOverflow();
        });
      });
    }, 100);
    
    window.addEventListener('resize', checkOverflow);
    
    // Use ResizeObserver for better detection
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => checkOverflow());
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
      resizeObserver.disconnect();
    };
  }, [children.length, availableHeight]);

  const handleStackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
  };

  if (children.length === 0) {
    return <div ref={containerRef} className="flex-1 pt-3.5 pb-1" />;
  }

  if (!isOverflowing) {
    // Normal mode - show all tasks (no stacking)
    return (
      <div 
        ref={containerRef}
        className="flex-1 pt-3.5 grid gap-3 content-start pb-1"
      >
        {children.map((child, index) => (
          <div 
            key={index} 
            data-task-item
          >
            {child}
          </div>
        ))}
      </div>
    );
  }

  // Stack mode - show visible tasks + stacked preview
  const visibleTasks = children.slice(0, visibleCount);
  const stackedTasks = children.slice(visibleCount, visibleCount + maxVisibleTasks);
  const hiddenCount = children.length - visibleCount;

  return (
    <>
      <div 
        ref={containerRef}
        className="flex-1 pt-3.5 pb-1 relative"
      >
        {/* Visible tasks */}
        <div className="grid gap-3 content-start pb-[40px]">
          {visibleTasks.map((child, index) => (
            <div key={index} data-task-item>
              {child}
            </div>
          ))}
        </div>

        {/* Stacked tasks at bottom */}
        <div 
          className="absolute bottom-1 left-0 right-0 cursor-pointer"
          onClick={handleStackClick}
        >
          <div className="relative h-[100px]">
            {stackedTasks.map((child, index) => {
              const reverseIndex = stackedTasks.length - 1 - index;
              const offset = reverseIndex * stackOffset;
              const scale = 1 - (reverseIndex * 0.02);
              const isTopCard = reverseIndex === stackedTasks.length - 1;
              const opacity = isTopCard ? 1 : 1 - (reverseIndex * 0.15);
              
              return (
                <div
                  key={visibleCount + index}
                  className={cn(
                    "absolute inset-x-0 bottom-0 transition-all duration-300 ease-out",
                    "hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                  )}
                  style={{
                    transform: `translateY(-${offset}px) scale(${scale})`,
                    opacity,
                    zIndex: 10 + reverseIndex,
                    transformOrigin: 'bottom center',
                  }}
                >
                  <div className="pointer-events-none">
                    {child}
                  </div>
                </div>
              );
            })}
            
            {/* Stack indicator badge */}
            <div 
              className="absolute -top-8 right-2 z-[100] pointer-events-none"
            >
              <div className="backdrop-blur-[60px] bg-primary/90 text-primary-foreground border-2 border-white/60 px-3 py-1.5 rounded-full font-extrabold text-sm shadow-[0_8px_24px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)] animate-[pop_0.3s_ease-out]">
                +{hiddenCount} meer
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog voor expanded view */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-visible flex flex-col">
          <DialogHeader>
            <DialogTitle>Alle taken ({children.length})</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 -mx-6" style={{ scrollbarWidth: 'thin' }}>
            <div className="grid gap-3 pb-2 px-4">
              {children.map((child, index) => (
                <div 
                  key={index} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  {child}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
