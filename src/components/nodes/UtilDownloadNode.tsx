import { type NodeProps } from '../NodeTypes';
import { Download } from 'lucide-react';

export function UtilDownloadNode({ id, data, selected, onDisconnectStart }: NodeProps) {
  const output = data.output as any;

  const handleDownload = () => {
    if (!output?.previewUrl) return;
    const a = document.createElement('a');
    a.href = output.previewUrl;
    a.download = `output_${Date.now()}`;
    a.click();
  };

  return (
    <div className={`w-[220px] bg-node rounded-2xl shadow-lg border ${selected ? 'border-text-primary shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-border-subtle'} overflow-hidden transition-all`}>
      <div className="px-4 py-3 bg-white/5 border-b border-border-subtle flex items-center gap-2">
        <Download size={14} className="text-text-muted" />
        <span className="text-sm font-medium text-text-primary">Download</span>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <button
          onClick={handleDownload}
          onPointerDown={e => e.stopPropagation()}
          disabled={!output?.previewUrl}
          className="w-full py-2 bg-accent-lime/20 hover:bg-accent-lime/30 text-accent-lime text-xs font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {output?.previewUrl ? 'Download Output' : 'No output yet'}
        </button>
        {output?.sizeBytes && (
          <span className="text-xs text-text-muted text-center font-mono">
            {(output.sizeBytes / 1024).toFixed(1)} KB
          </span>
        )}
      </div>

      {/* Input Port (Left) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-2 pr-2.5 z-20">
        <div 
          className="port-handle w-8 h-8 rounded-full border border-emerald-400/60 bg-panel flex items-center justify-center text-emerald-400 cursor-crosshair shadow-md"
          title="Input (in)"
          data-target={`${id}:in`}
          data-portid="in"
          onPointerDown={(e) => {
            e.stopPropagation();
            onDisconnectStart?.(e, id, 'in');
          }}
        >
          <Download size={14} />
        </div>
      </div>
    </div>
  );
}
