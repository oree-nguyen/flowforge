import { Search, Minus, Plus, RotateCcw, Maximize } from 'lucide-react';
import { canvasEngine } from '../engine/canvasEngine';
import { useCanvasEngine } from '../engine/useCanvasEngine';

export function ZoomControls() {
  const { viewport } = useCanvasEngine();
  const zoomPercent = Math.round(viewport.zoom * 100);

  const handleZoomIn = () => {
    canvasEngine.zoomTo(viewport.zoom * 1.2);
  };

  const handleZoomOut = () => {
    canvasEngine.zoomTo(viewport.zoom / 1.2);
  };

  const handleResetZoom = () => {
    canvasEngine.zoomTo(1);
  };

  const handleFitView = () => {
    const nodes = canvasEngine.getNodes();
    if (nodes.length === 0) {
      canvasEngine.setViewport({ x: 0, y: 0, zoom: 1 });
      return;
    }
    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + 300);
      maxY = Math.max(maxY, n.position.y + 150);
    });
    const padding = 80;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const scaleX = window.innerWidth / width;
    const scaleY = window.innerHeight / height;
    const zoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.2), 1.5);
    const x = (window.innerWidth - width * zoom) / 2 - minX * zoom + padding * zoom;
    const y = (window.innerHeight - height * zoom) / 2 - minY * zoom + padding * zoom;
    canvasEngine.setViewport({ x, y, zoom });
  };

  return (
    <div className="flex items-center gap-1 bg-panel backdrop-blur-panel border border-border-subtle rounded-xl p-1 shadow-lg">
      <div 
        onClick={handleResetZoom}
        className="flex items-center gap-2 px-2 py-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer rounded-lg hover:bg-white/5"
      >
        <Search size={14} />
        <span className="text-xs font-mono font-medium">{zoomPercent}%</span>
      </div>
      
      <div className="w-[1px] h-4 bg-border-subtle mx-1"></div>
      
      <button onClick={handleZoomOut} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors">
        <Minus size={16} />
      </button>
      <button onClick={handleZoomIn} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors">
        <Plus size={16} />
      </button>
      
      <div className="w-[1px] h-4 bg-border-subtle mx-1"></div>
      
      <button onClick={handleResetZoom} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors" title="Reset Zoom">
        <RotateCcw size={16} />
      </button>
      <button onClick={handleFitView} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors" title="Fit View">
        <Maximize size={16} />
      </button>
    </div>
  );
}
