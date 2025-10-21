import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Column {
  id: string;
  name: string;
  width: number;
  height: number;
  header_height: number;
  content_padding_top: number;
  content_padding_right: number;
  content_padding_bottom: number;
  content_padding_left: number;
}

interface ColumnCropEditorProps {
  column: Column;
  onClose: () => void;
  onChange: (updates: Partial<Column>) => void;
}

export const ColumnCropEditor = ({ column, onClose, onChange }: ColumnCropEditorProps) => {
  const [headerHeight, setHeaderHeight] = useState(column.header_height || 60);
  const [paddingRight, setPaddingRight] = useState(column.content_padding_right || 0);
  const [paddingBottom, setPaddingBottom] = useState(column.content_padding_bottom || 0);
  const [paddingLeft, setPaddingLeft] = useState(column.content_padding_left || 0);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = (handle: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveHandle(handle);
    
    const startY = e.clientY;
    const startX = e.clientX;
    const startHeaderHeight = headerHeight;
    const startPaddingRight = paddingRight;
    const startPaddingBottom = paddingBottom;
    const startPaddingLeft = paddingLeft;
    
    const handleMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaX = moveEvent.clientX - startX;
      
      switch (handle) {
        case 'header':
          setHeaderHeight(Math.max(40, Math.min(200, startHeaderHeight + deltaY)));
          break;
        case 'padding-bottom':
          setPaddingBottom(Math.max(0, Math.min(100, startPaddingBottom - deltaY)));
          break;
        case 'padding-left':
          setPaddingLeft(Math.max(0, Math.min(100, startPaddingLeft + deltaX)));
          break;
        case 'padding-right':
          setPaddingRight(Math.max(0, Math.min(100, startPaddingRight - deltaX)));
          break;
      }
    };
    
    const handleUp = () => {
      setActiveHandle(null);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const handleApply = () => {
    onChange({
      header_height: headerHeight,
      content_padding_top: 0,
      content_padding_right: paddingRight,
      content_padding_bottom: paddingBottom,
      content_padding_left: paddingLeft,
    });
    onClose();
  };

  const contentTop = headerHeight;
  const contentBottom = column.height - paddingBottom;
  const contentLeft = paddingLeft;
  const contentRight = column.width - paddingRight;
  const contentHeight = contentBottom - contentTop;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 overflow-auto">
      <div className="bg-background rounded-lg shadow-2xl p-6 max-w-6xl w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">Crop Editor - {column.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Sleep de gekleurde handvatten om de header en taak ruimte aan te passen
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Preview */}
          <div className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg p-4 min-h-[500px]">
            <div 
              ref={containerRef}
              className="relative border-2 border-border rounded-lg bg-card shadow-lg"
              style={{ 
                width: `${Math.min(column.width, 400)}px`, 
                height: `${Math.min(column.height, 600)}px`,
                minWidth: '250px',
                minHeight: '350px'
              }}
            >
              {/* Header area (yellow) */}
              <div 
                className="absolute inset-x-0 bg-yellow-500/20 border-2 border-yellow-500 rounded-t-lg flex items-center justify-center text-yellow-700 dark:text-yellow-500 font-semibold text-xs"
                style={{ top: 0, height: `${headerHeight}px` }}
              >
                Header ({headerHeight}px)
              </div>

              {/* Header resize handle */}
              <div 
                className={`absolute left-0 right-0 h-3 bg-yellow-500/50 hover:bg-yellow-500 cursor-ns-resize transition-colors flex items-center justify-center ${activeHandle === 'header' ? 'bg-yellow-500 h-4' : ''}`}
                style={{ top: `${headerHeight - 6}px` }}
                onMouseDown={(e) => startResize('header', e)}
                title="Sleep om header hoogte aan te passen"
              >
                <div className="w-8 h-1 bg-yellow-700 rounded-full"></div>
              </div>

              {/* Active content area (green) */}
              <div
                className="absolute bg-green-500/20 border-2 border-green-500 flex items-center justify-center text-green-700 dark:text-green-500 font-semibold text-center text-xs pointer-events-none"
                style={{
                  top: `${contentTop}px`,
                  left: `${contentLeft}px`,
                  width: `${contentRight - contentLeft}px`,
                  height: `${contentHeight}px`
                }}
              >
                Taak Ruimte<br/>
                <span className="text-[10px]">({contentRight - contentLeft}×{contentHeight}px)</span>
              </div>

              {/* Left padding resize handle */}
              <div 
                className={`absolute top-0 bottom-0 w-3 bg-green-500/50 hover:bg-green-500 cursor-ew-resize transition-colors z-10 flex items-center justify-center ${activeHandle === 'padding-left' ? 'bg-green-500 w-4' : ''}`}
                style={{ left: `${contentLeft - 6}px` }}
                onMouseDown={(e) => startResize('padding-left', e)}
                title="Sleep om links padding aan te passen"
              >
                <div className="w-1 h-8 bg-green-700 rounded-full"></div>
              </div>

              {/* Right padding resize handle */}
              <div 
                className={`absolute top-0 bottom-0 w-3 bg-green-500/50 hover:bg-green-500 cursor-ew-resize transition-colors z-10 flex items-center justify-center ${activeHandle === 'padding-right' ? 'bg-green-500 w-4' : ''}`}
                style={{ left: `${contentRight - 6}px` }}
                onMouseDown={(e) => startResize('padding-right', e)}
                title="Sleep om rechts padding aan te passen"
              >
                <div className="w-1 h-8 bg-green-700 rounded-full"></div>
              </div>

              {/* Bottom padding resize handle */}
              <div 
                className={`absolute left-0 right-0 h-3 bg-green-500/50 hover:bg-green-500 cursor-ns-resize transition-colors z-10 flex items-center justify-center ${activeHandle === 'padding-bottom' ? 'bg-green-500 h-4' : ''}`}
                style={{ top: `${contentBottom - 6}px` }}
                onMouseDown={(e) => startResize('padding-bottom', e)}
                title="Sleep om onder padding aan te passen"
              >
                <div className="w-8 h-1 bg-green-700 rounded-full"></div>
              </div>

              {/* Left padding area (red) */}
              {paddingLeft > 0 && (
                <div 
                  className="absolute bg-red-500/10 border border-red-500/30 pointer-events-none"
                  style={{
                    top: `${headerHeight}px`,
                    bottom: 0,
                    left: 0,
                    width: `${paddingLeft}px`
                  }}
                />
              )}

              {/* Right padding area (red) */}
              {paddingRight > 0 && (
                <div 
                  className="absolute bg-red-500/10 border border-red-500/30 pointer-events-none"
                  style={{
                    top: `${headerHeight}px`,
                    bottom: 0,
                    right: 0,
                    width: `${paddingRight}px`
                  }}
                />
              )}

              {/* Bottom padding area (red) */}
              {paddingBottom > 0 && (
                <div 
                  className="absolute bg-red-500/10 border border-red-500/30 pointer-events-none"
                  style={{
                    bottom: 0,
                    height: `${paddingBottom}px`,
                    left: 0,
                    right: 0
                  }}
                />
              )}
            </div>
          </div>

          {/* Values panel */}
          <div className="lg:w-64 w-full space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <h4 className="font-semibold mb-3 text-sm">📏 Huidige Waarden</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Header:</span>
                  <span className="font-mono">{headerHeight}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Padding Rechts:</span>
                  <span className="font-mono">{paddingRight}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Padding Onder:</span>
                  <span className="font-mono">{paddingBottom}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Padding Links:</span>
                  <span className="font-mono">{paddingLeft}px</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2 text-sm">🎨 Kleur Guide</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500/50 border border-yellow-500 rounded"></div>
                  <span>Header gebied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500/50 border border-green-500 rounded"></div>
                  <span>Actieve taak ruimte</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500/20 border border-red-500/30 rounded"></div>
                  <span>Niet-bruikbaar</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleApply} className="flex-1">
            ✓ Toepassen
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuleren
          </Button>
        </div>
      </div>
    </div>
  );
};
