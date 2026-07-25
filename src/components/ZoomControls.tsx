import { Search, Minus, Plus, RotateCcw, Maximize } from 'lucide-react';

export function ZoomControls() {
  return (
    <div className="flex items-center gap-1 bg-panel backdrop-blur-panel border border-border-subtle rounded-xl p-1 shadow-lg">
      <div className="flex items-center gap-2 px-2 py-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer rounded-lg hover:bg-white/5">
        <Search size={14} />
        <span className="text-xs font-mono font-medium">100%</span>
      </div>
      
      <div className="w-[1px] h-4 bg-border-subtle mx-1"></div>
      
      <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors">
        <Minus size={16} />
      </button>
      <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors">
        <Plus size={16} />
      </button>
      
      <div className="w-[1px] h-4 bg-border-subtle mx-1"></div>
      
      <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors" title="Reset Zoom">
        <RotateCcw size={16} />
      </button>
      <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors" title="Fit View">
        <Maximize size={16} />
      </button>
    </div>
  );
}
