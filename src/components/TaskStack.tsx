import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TaskStackProps {
  children: React.ReactNode[];
  maxVisibleTasks?: number;
  stackOffset?: number;
  onTaskClick?: (index: number) => void;
}

export const TaskStack = ({ 
  children, 
  maxVisibleTasks = 4, 
  stackOffset = 5,
  onTaskClick 
}: TaskStackProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const containerHeight = container.clientHeight;
      
      // Calculate how many tasks fit in the visible area
      const taskElements = container.querySelectorAll('[data-task-item]');
      let totalHeight = 0;
      let visibleTaskCount = 0;
      
      // Reserve 100px for stack preview if we're going to need it
      const stackPreviewHeight = 100;
      
      for (let i = 0; i < taskElements.length; i++) {
        const taskHeight = taskElements[i].clientHeight;
        const gap = 12; // gap-3 = 12px
        
        // Check if we have more tasks after this one
        const hasMoreTasks = i < taskElements.length - 1;
        
        // If we have more tasks, we need to reserve space for the stack preview
        const requiredSpace = hasMoreTasks ? stackPreviewHeight : 0;
        
        // Check if this task would fit with the required reserved space
        if (totalHeight + taskHeight + requiredSpace > containerHeight) {
          break;
        }
        
        totalHeight += taskHeight + gap;
        visibleTaskCount++;
      }
      
      setVisibleCount(visibleTaskCount);
      setIsOverflowing(children.length > visibleTaskCount && children.length > 3);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    
    // Use ResizeObserver for better detection
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', checkOverflow);
      resizeObserver.disconnect();
    };
  }, [children.length]);

  const handleStackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  if (children.length === 0) {
    return <div ref={containerRef} className="flex-1 pt-3.5 pb-1" />;
  }

  if (!isOverflowing || isExpanded) {
    // Normal mode - show all tasks
    return (
      <div 
        ref={containerRef}
        className={cn(
          "flex-1 pt-3.5 pb-1 grid gap-3 content-start transition-all duration-300",
          isExpanded && "overflow-y-auto list"
        )}
      >
        {children.map((child, index) => (
          <div 
            key={index} 
            data-task-item
            className="animate-[slide-up_0.3s_ease-out]"
            style={{ animationDelay: isExpanded ? `${index * 0.03}s` : '0s' }}
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
    <div 
      ref={containerRef}
      className="flex-1 pt-3.5 pb-1 relative"
    >
      {/* Visible tasks */}
      <div className="grid gap-3 content-start pb-[20px]">
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
        <div className="relative h-[80px]">
          {stackedTasks.map((child, index) => {
            const reverseIndex = stackedTasks.length - 1 - index;
            const offset = reverseIndex * stackOffset;
            const scale = 1 - (reverseIndex * 0.02);
            const opacity = 1 - (reverseIndex * 0.15);
            
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
  );
};
