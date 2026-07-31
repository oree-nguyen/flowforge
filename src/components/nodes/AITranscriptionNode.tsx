import { type NodeProps } from '../NodeTypes';
import { getModelMetadata } from '../../store/modelCatalog';
import { useWorkflowStore } from '../../store/workflowStore';
import { Mic, Headphones } from 'lucide-react';

export function AITranscriptionNode({ id, data, selected, onDisconnectStart }: NodeProps) {
  const modelId = (data.model as string) || 'openai/whisper';
  const fetchedModels = useWorkflowStore(state => state.fetchedModels);
  const meta = getModelMetadata(modelId, fetchedModels);

  const displayName = meta?.name || modelId;
  const customNodeName = data.nodeName as string;

  return (
    <div className="relative group">
      {/* Node Label above node */}
      <div className="absolute -top-6 left-0 text-xs font-medium text-text-primary flex items-center gap-2">
        <Mic size={12} /> {displayName}
      </div>

      {/* Main Node Card */}
      <div className={`w-[300px] bg-node rounded-2xl shadow-lg border relative flex overflow-hidden transition-all ${selected ? 'border-text-primary shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-border-subtle'}`}>
        <div className="w-[3px] bg-[#10B981] shrink-0" />
        
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 bg-white/5 border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
               <span className="text-sm font-medium text-text-primary truncate">
                  {displayName}
               </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#10B981]/20 rounded text-[#10B981] shrink-0">Speech to Text</span>
          </div>
          
          <div className="p-4 flex flex-col gap-3">
            {data.isGenerating && (
              <div className="flex items-center gap-2 text-xs text-accent-lime">
                <div className="w-3 h-3 border-2 border-accent-lime border-t-transparent rounded-full animate-spin"></div>
                Transcribing...
              </div>
            )}
            
            {data.output && !data.isGenerating ? (
               <div className="bg-canvas border border-border-subtle rounded-xl p-3 text-xs text-text-muted max-h-24 overflow-hidden relative select-text">
                  <p className="line-clamp-3">{data.output as string}</p>
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-canvas to-transparent"></div>
               </div>
            ) : !data.isGenerating && (
               <div className="text-xs text-text-muted italic">Ready</div>
            )}
          </div>
        </div>
      </div>

      {/* Input Handle Ports */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-2 pr-2.5 z-20">
        <div 
          className="w-8 h-8 rounded-full border border-purple-400/50 bg-panel flex items-center justify-center text-purple-400 hover:text-purple-300 hover:border-purple-300 transition-colors cursor-crosshair shadow-md"
          title="Audio Input"
          data-target={`${id}:audio`}
          data-portid="audio"
          onPointerDown={(e) => {
            e.stopPropagation();
            onDisconnectStart?.(e, id, 'audio');
          }}
        >
          <Headphones size={14} />
        </div>
      </div>

      {/* Node Slug / @mention Label below frame */}
      {customNodeName && (
        <div className="absolute -bottom-6 left-0 text-[10px] font-medium text-text-muted flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
            @
          </div>
          <span className="text-white font-mono">{customNodeName}</span>
        </div>
      )}
    </div>
  );
}
