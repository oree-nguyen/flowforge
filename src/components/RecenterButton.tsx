import { Scan } from 'lucide-react';

export function RecenterButton() {
  return (
    <button className="flex items-center gap-2 bg-panel backdrop-blur-panel border border-border-subtle rounded-full px-4 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-border-subtle transition-all shadow-lg hover:-translate-y-0.5">
      <Scan size={16} />
      <span className="font-medium">Recenter</span>
    </button>
  );
}
