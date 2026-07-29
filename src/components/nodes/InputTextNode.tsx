import { Type } from 'lucide-react';
import { canvasEngine } from '../../engine/canvasEngine';
import { type NodeProps } from '../NodeTypes';

export function InputTextNode({ id, data, selected }: NodeProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    canvasEngine.updateNodeData(id, { text: e.target.value });
  };

  const isFilledByAI = !!(data.filledByAI);
  const text = (data.text as string) || '';

  return (
    <div className={`w-[260px] bg-node rounded-2xl shadow-lg border transition-all relative ${
      selected 
        ? 'border-text-primary shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
        : isFilledByAI 
          ? 'border-accent-lime/60 shadow-[0_0_12px_rgba(198,241,53,0.15)]' 
          : 'border-border-subtle'
    } overflow-hidden`}>
      <div className="px-4 py-3 bg-white/5 border-b border-border-subtle flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full transition-colors ${isFilledByAI ? 'bg-accent-lime' : 'bg-blue-400'}`}></div>
        <span className="text-sm font-medium text-text-primary">Input Text</span>
        {isFilledByAI && (
          <span className="ml-auto text-[9px] text-accent-lime font-mono border border-accent-lime/40 px-1.5 py-0.5 rounded-full">
            ← AI Output
          </span>
        )}
      </div>
      
      <div className="p-4">
        <textarea
          className={`w-full h-24 bg-canvas border rounded-xl p-3 text-sm text-text-primary outline-none resize-none transition-colors placeholder:text-text-muted ${
            isFilledByAI 
              ? 'border-accent-lime/40 focus:border-accent-lime' 
              : 'border-border-subtle focus:border-accent-lime'
          }`}
          placeholder="Enter text..."
          value={text}
          onChange={handleChange}
          onPointerDown={e => e.stopPropagation()}
        />
        {text && (
          <div className="flex justify-between items-center mt-1.5 px-1">
            <span className="text-[9px] text-text-muted">{text.length} chars · {text.split(/\s+/).filter(Boolean).length} words</span>
            <button
              className="text-[9px] text-text-muted hover:text-danger transition-colors"
              onPointerDown={e => e.stopPropagation()}
              onClick={() => canvasEngine.updateNodeData(id, { text: '', filledByAI: false })}
            >
              ✕ Clear
            </button>
          </div>
        )}
      </div>

      {/* Single Output Port Icon (Right) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-2 pl-2.5 z-20">
        <div 
          className="port-handle w-8 h-8 rounded-full border border-accent-lime/60 bg-panel flex items-center justify-center text-accent-lime cursor-crosshair shadow-md"
          title="Text Output (out)"
          data-target={`${id}:out`}
          data-portid="out"
        >
          <Type size={14} />
        </div>
      </div>
    </div>
  );
}
