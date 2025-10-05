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
  const [headerHeight, setHeaderHeight] = useState(column.header_height);
  const [paddingTop, setPaddingTop] = useState(column.content_padding_top);
  const [paddingRight, setPaddingRight] = useState(column.content_padding_right);
  const [paddingBottom, setPaddingBottom] = useState(column.content_padding_bottom);
  const [paddingLeft, setPaddingLeft] = useState(column.content_padding_left);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = (handle: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveHandle(handle);
    
    const startY = e.clientY;
    const startX = e.clientX;
    const startHeaderHeight = headerHeight;
    const startPaddingTop = paddingTop;
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
        case 'padding-top':
          setPaddingTop(Math.max(0, Math.min(100, startPaddingTop + deltaY)));
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
      content_padding_top: paddingTop,
      content_padding_right: paddingRight,
      content_padding_bottom: paddingBottom,
      content_padding_left: paddingLeft,
    });
    onClose();
  };

  const contentTop = headerHeight + paddingTop;
  const contentBottom = column.height - paddingBottom;
  const contentLeft = paddingLeft;
  const contentRight = column.width - paddingRight;
  const contentHeight = contentBottom - contentTop;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center">
      <div className="bg-background rounded-lg shadow-2xl p-6 max-w-4xl w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">Crop Editor - {column.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Sleep de handvatten om de header en taak ruimte aan te passen
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Preview */}
          <div 
            ref={containerRef}
            className="relative border-2 border-border rounded-lg bg-card flex-1"
            style={{ 
              width: `${column.width}px`, 
              height: `${column.height}px`,
              minWidth: '300px',
              minHeight: '400px'
            }}
          >
            {/* Header area (yellow) */}
            <div 
              className="absolute inset-x-0 bg-yellow-500/20 border-2 border-yellow-500 rounded-t-lg flex items-center justify-center text-yellow-700 font-semibold"
              style={{ top: 0, height: `${headerHeight}px` }}
            >
              Header ({headerHeight}px)
            </div>

            {/* Header resize handle */}
            <div 
              className={`absolute left-0 right-0 h-2 bg-yellow-500/50 hover:bg-yellow-500 cursor-ns-resize transition-colors ${activeHandle === 'header' ? 'bg-yellow-500' : ''}`}
              style={{ top: `${headerHeight - 4}px` }}
              onMouseDown={(e) => startResize('header', e)}
            />

            {/* Top padding area (red) */}
            {paddingTop > 0 && (
              <div 
                className="absolute bg-red-500/10 border border-red-500/30"
                style={{
                  top: `${headerHeight}px`,
                  height: `${paddingTop}px`,
                  left: 0,
                  right: 0
                }}
              />
            )}

            {/* Top padding resize handle */}
            <div 
              className={`absolute left-0 right-0 h-2 bg-green-500/50 hover:bg-green-500 cursor-ns-resize transition-colors z-10 ${activeHandle === 'padding-top' ? 'bg-green-500' : ''}`}
              style={{ top: `${contentTop - 4}px` }}
              onMouseDown={(e) => startResize('padding-top', e)}
            />

            {/* Active content area (green) */}
            <div 
              className="absolute bg-green-500/20 border-2 border-green-500 flex items-center justify-center text-green-700 font-semibold text-center"
              style={{
                top: `${contentTop}px`,
                left: `${contentLeft}px`,
                width: `${contentRight - contentLeft}px`,
                height: `${contentHeight}px`
              }}
            >
              Taak Ruimte<br/>
              <span className="text-xs">({contentRight - contentLeft}×{contentHeight}px)</span>
            </div>

            {/* Left padding resize handle */}
            <div 
              className={`absolute top-0 bottom-0 w-2 bg-green-500/50 hover:bg-green-500 cursor-ew-resize transition-colors z-10 ${activeHandle === 'padding-left' ? 'bg-green-500' : ''}`}
              style={{ left: `${contentLeft - 4}px` }}
              onMouseDown={(e) => startResize('padding-left', e)}
            />

            {/* Right padding resize handle */}
            <div 
              className={`absolute top-0 bottom-0 w-2 bg-green-500/50 hover:bg-green-500 cursor-ew-resize transition-colors z-10 ${activeHandle === 'padding-right' ? 'bg-green-500' : ''}`}
              style={{ left: `${contentRight - 4}px` }}
              onMouseDown={(e) => startResize('padding-right', e)}
            />

            {/* Bottom padding resize handle */}
            <div 
              className={`absolute left-0 right-0 h-2 bg-green-500/50 hover:bg-green-500 cursor-ns-resize transition-colors z-10 ${activeHandle === 'padding-bottom' ? 'bg-green-500' : ''}`}
              style={{ top: `${contentBottom - 4}px` }}
              onMouseDown={(e) => startResize('padding-bottom', e)}
            />

            {/* Left padding area (red) */}
            {paddingLeft > 0 && (
              <div 
                className="absolute bg-red-500/10 border border-red-500/30"
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
                className="absolute bg-red-500/10 border border-red-500/30"
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
                className="absolute bg-red-500/10 border border-red-500/30"
                style={{
                  bottom: 0,
                  height: `${paddingBottom}px`,
                  left: 0,
                  right: 0
                }}
              />
            )}
          </div>

          {/* Values panel */}
          <div className="w-64 space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <h4 className="font-semibold mb-3 text-sm">📏 Huidige Waarden</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Header:</span>
                  <span className="font-mono">{headerHeight}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Padding Boven:</span>
                  <span className="font-mono">{paddingTop}px</span>
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
