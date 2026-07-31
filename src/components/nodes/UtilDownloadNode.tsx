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
    <div className="relative group">
      {/* Node Label above node */}
      <div className="absolute -top-6 left-0 label-micro text-text-primary flex items-center gap-1.5">
        <Download size={12} className="text-emerald-400" /> Utility
      </div>

      <div className={`w-[220px] flex rounded-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${selected ? 'border-accent-lime shadow-elev-node-selected' : 'border-defined shadow-elev-node'}`}>
        <div className="w-[3px] bg-emerald-400 shrink-0 rounded-l-xl" />
        
        <div className="flex-1 flex flex-col bg-surface-1 rounded-r-xl overflow-hidden">
          <div className="px-3 h-8 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="title-node text-text-primary truncate">
                Download
              </span>
            </div>
            <span className="label-micro px-1.5 py-0.5 bg-emerald-400/12 text-emerald-400 rounded shrink-0">UTIL</span>
          </div>
          
          <div className="p-3 flex flex-col gap-2">
            <button
              onClick={handleDownload}
              onPointerDown={e => e.stopPropagation()}
              disabled={!output?.previewUrl}
              className="w-full py-1.5 bg-accent-lime/20 hover:bg-accent-lime/30 text-accent-lime label-small rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-accent-lime/40"
            >
              {output?.previewUrl ? 'Download Output' : 'No output yet'}
            </button>
            {output?.sizeBytes && (
              <span className="label-micro text-text-muted text-center opacity-60">
                {(output.sizeBytes / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
        </div>
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
