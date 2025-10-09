import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface BackgroundCropEditorProps {
  imageUrl: string;
  initialPositionX?: number;
  initialPositionY?: number;
  initialScale?: number;
  initialFitMode?: 'scale' | 'cover';
  onClose: () => void;
  onApply: (positionX: number, positionY: number, scale: number, fitMode: 'scale' | 'cover') => void;
}

export const BackgroundCropEditor = ({ 
  imageUrl, 
  initialPositionX = 50,
  initialPositionY = 50,
  initialScale = 100,
  initialFitMode = 'scale',
  onClose, 
  onApply 
}: BackgroundCropEditorProps) => {
  const [positionX, setPositionX] = useState(initialPositionX);
  const [positionY, setPositionY] = useState(initialPositionY);
  const [scale, setScale] = useState(initialScale);
  const [fitMode, setFitMode] = useState<'scale' | 'cover'>(initialFitMode);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = (e.clientX - dragStart.x) / rect.width * 100;
      const deltaY = (e.clientY - dragStart.y) / rect.height * 100;
      
      setPositionX((prev) => Math.max(0, Math.min(100, prev + deltaX)));
      setPositionY((prev) => Math.max(0, Math.min(100, prev + deltaY)));
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleReset = () => {
    setPositionX(50);
    setPositionY(50);
    setScale(100);
    setFitMode('scale');
  };

  const handleApply = () => {
    onApply(positionX, positionY, scale, fitMode);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">Achtergrond Bijsnijden & Positioneren</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Sleep de afbeelding en gebruik de schuifregelaar om in/uit te zoomen
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
              className="relative border-2 border-border rounded-lg overflow-hidden bg-black cursor-move"
              style={{ 
                width: '100%',
                maxWidth: '800px',
                aspectRatio: '16/9'
              }}
              onMouseDown={handleMouseDown}
            >
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  Laden...
                </div>
              )}
              <img
                src={imageUrl}
                alt="Achtergrond preview"
                className="absolute inset-0 w-full h-full object-cover transition-all duration-200"
                style={{
                  objectPosition: `${positionX}% ${positionY}%`,
                  transform: `scale(${scale / 100})`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onLoad={() => setImageLoaded(true)}
                draggable={false}
              />
              
              {/* Crosshair */}
              <div 
                className="absolute w-6 h-6 pointer-events-none"
                style={{
                  left: `${positionX}%`,
                  top: `${positionY}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="absolute inset-0 border-2 border-white rounded-full shadow-lg"></div>
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white shadow-lg"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white shadow-lg"></div>
              </div>

              {/* Info overlay */}
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
                Positie: {positionX.toFixed(0)}%, {positionY.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Controls panel */}
          <div className="lg:w-80 w-full space-y-4">
            {/* Fit mode control */}
            <div className="p-4 rounded-lg bg-muted">
              <h4 className="font-semibold mb-3 text-sm">📐 Weergave Modus</h4>
              <div className="flex gap-2">
                <Button
                  variant={fitMode === 'scale' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFitMode('scale')}
                  className="flex-1"
                >
                  Aangepast
                </Button>
                <Button
                  variant={fitMode === 'cover' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFitMode('cover')}
                  className="flex-1"
                >
                  Volledig scherm
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {fitMode === 'cover' 
                  ? 'Afbeelding vult het hele scherm' 
                  : 'Handmatig instellen met zoom'}
              </p>
            </div>

            {/* Scale control - only show in scale mode */}
            {fitMode === 'scale' && (
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-semibold mb-3 text-sm">🔍 Zoom</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Schaal:</span>
                    <span className="font-mono">{scale}%</span>
                  </div>
                  <Slider
                    value={[scale]}
                    onValueChange={([value]) => setScale(value)}
                    min={50}
                    max={200}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>50%</span>
                    <span>200%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Position info */}
            <div className="p-4 rounded-lg bg-muted">
              <h4 className="font-semibold mb-3 text-sm">📍 Positie</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horizontaal:</span>
                  <span className="font-mono">{positionX.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verticaal:</span>
                  <span className="font-mono">{positionY.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2 text-sm">💡 Instructies</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Sleep de afbeelding om te positioneren</li>
                <li>• Gebruik de schuifregelaar om te zoomen</li>
                <li>• Het kruisje toont het focuspunt</li>
              </ul>
            </div>

            {/* Reset button */}
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset naar standaard
            </Button>
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
