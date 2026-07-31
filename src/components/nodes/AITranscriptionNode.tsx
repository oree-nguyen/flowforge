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
      <div className="absolute -top-6 left-0 label-micro text-text-primary flex items-center gap-1.5">
        <Mic size={12} className="text-[#10B981]" /> Transcription
      </div>

      {/* Main Node Card */}
      <div className={`w-[300px] flex rounded-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${selected ? 'border-accent-lime shadow-elev-node-selected' : 'border-defined shadow-elev-node'}`}>
        <div className="w-[3px] bg-[#10B981] shrink-0 rounded-l-xl" />
        
        <div className="flex-1 flex flex-col bg-surface-1 rounded-r-xl overflow-hidden">
          {/* Header */}
          <div className="px-3 h-8 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-hidden">
               <span className="title-node text-text-primary truncate">
                  {displayName}
               </span>
            </div>
            <span className="label-micro px-1.5 py-0.5 bg-[#10B981]/12 text-[#10B981] rounded shrink-0">STT</span>
          </div>
          
          {/* Vùng Nội Dung */}
          <div className="p-3 flex flex-col gap-3">
            {data.isGenerating && (
              <div className="flex flex-col gap-1.5 p-2 bg-surface-3 border border-hairline rounded-md">
                <div className="flex items-center justify-between text-xs text-state-running">
                  <span className="flex items-center gap-1.5 font-medium">
                    <div className="w-3 h-3 border-2 border-state-running border-t-transparent rounded-full animate-spin"></div>
                    Transcribing...
                  </span>
                </div>
                <div className="w-full h-1 bg-surface-0 rounded-full overflow-hidden border border-hairline">
                  <div className="h-full bg-state-running animate-pulse w-full" />
                </div>
              </div>
            )}
            
            {data.output && !data.isGenerating ? (
               <div className="bg-surface-3 border border-hairline rounded-md p-3 body text-text-muted max-h-24 overflow-hidden relative select-text">
                  <p className="line-clamp-3">{data.output as string}</p>
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-surface-3 to-transparent"></div>
               </div>
            ) : !data.isGenerating && (
               <div className="body text-text-muted italic opacity-50">Sẵn sàng</div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 border-t border-hairline bg-surface-1 flex items-center justify-between">
             <span className="label-small text-text-muted truncate">{modelId}</span>
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
