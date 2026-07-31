import { Type } from 'lucide-react';
import { canvasEngine } from '../../engine/canvasEngine';
import { type NodeProps } from '../NodeTypes';

export function InputTextNode({ id, data, selected, onConnectStart }: NodeProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    canvasEngine.updateNodeData(id, { text: e.target.value });
  };

  const isFilledByAI = !!(data.filledByAI);
  const text = (data.text as string) || '';

    <div className="relative group">
      {/* Node Label above node */}
      <div className="absolute -top-6 left-0 label-micro text-text-primary flex items-center gap-1.5">
        <Type size={12} className="text-[#9C27B0]" /> Text Input
      </div>

      <div className={`w-[260px] flex rounded-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${selected ? 'border-accent-lime shadow-elev-node-selected' : 'border-defined shadow-elev-node'}`}>
        <div className="w-[3px] bg-[#9C27B0] shrink-0 rounded-l-xl" />
        
        <div className="flex-1 flex flex-col bg-surface-1 rounded-r-xl overflow-hidden">
          <div className="px-3 h-8 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="title-node text-text-primary truncate">
                Input Text
              </span>
            </div>
            {isFilledByAI ? (
              <span className="label-micro px-1.5 py-0.5 bg-accent-lime/12 text-accent-lime rounded shrink-0">← AI Output</span>
            ) : (
              <span className="label-micro px-1.5 py-0.5 bg-[#9C27B0]/12 text-[#9C27B0] rounded shrink-0">Text</span>
            )}
          </div>
          
          <div className="p-3">
            <textarea
              className={`w-full h-24 bg-surface-3 border rounded-md p-3 body text-text-primary outline-none resize-none transition-colors placeholder:text-text-muted ${
                isFilledByAI 
                  ? 'border-accent-lime/40 focus:border-accent-lime' 
                  : 'border-hairline focus:border-accent-lime'
              }`}
              placeholder="Enter text..."
              value={text}
              onChange={handleChange}
              onPointerDown={e => e.stopPropagation()}
            />
            {text && (
              <div className="flex justify-between items-center mt-1.5 px-1">
                <span className="label-micro text-text-muted opacity-60">{text.length} chars · {text.split(/\s+/).filter(Boolean).length} words</span>
                <button
                  className="label-micro text-text-muted hover:text-danger transition-colors"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => canvasEngine.updateNodeData(id, { text: '', filledByAI: false })}
                >
                  ✕ Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Single Output Port Icon (Right) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-2 pl-2.5 z-20">
        <div 
          className="port-handle w-8 h-8 rounded-full border border-[#9C27B0]/60 bg-panel flex items-center justify-center text-[#9C27B0] cursor-crosshair shadow-md"
          title="Text Output (out)"
          data-target={`${id}:out`}
          data-portid="out"
          onPointerDown={(e) => {
            e.stopPropagation();
            onConnectStart?.(e, id, 'out');
          }}
        >
          <Type size={14} />
        </div>
      </div>
    </div>
  );
}
