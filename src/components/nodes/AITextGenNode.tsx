import { type NodeProps } from '../NodeTypes';
import { getModelMetadata } from '../../store/modelCatalog';
import { useWorkflowStore } from '../../store/workflowStore';
import { canvasEngine } from '../../engine/canvasEngine';
import { Type, Image as ImageIcon, FileText, Bot } from 'lucide-react';

export function AITextGenNode({ id, data, selected, onConnectStart, onDisconnectStart }: NodeProps) {
  const modelId = (data.model as string) || 'google/gemini-1.5-flash';
  const fetchedModels = useWorkflowStore(state => state.fetchedModels);
  const meta = getModelMetadata(modelId, fetchedModels);

  const displayName = meta?.name || modelId;
  const customNodeName = data.nodeName as string;
  const inputs = meta?.inputs || ['text'];

  return (
    <div className="relative group">
      {/* Node Label above node */}
      <div className="absolute -top-6 left-0 text-xs font-medium text-text-primary flex items-center gap-2">
        <Type size={12} /> {displayName}
      </div>

      {/* Main Node Card */}
      <div className={`w-[300px] bg-node rounded-2xl shadow-lg border relative flex overflow-hidden transition-all ${selected ? 'border-text-primary shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-border-subtle'}`}>
        <div className="w-[3px] bg-[#9C27B0] shrink-0" />
        
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 bg-white/5 border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
               <span className="text-sm font-medium text-text-primary truncate">
                  {displayName}
               </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#9C27B0]/20 rounded text-[#9C27B0] shrink-0">Text</span>
          </div>
          
          <div className="p-4 flex flex-col gap-3">
            {data.isGenerating && (
              <div className="flex flex-col gap-1.5 p-2 bg-[#9C27B0]/10 border border-[#9C27B0]/30 rounded-xl">
                <div className="flex items-center justify-between text-xs text-[#9C27B0]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <div className="w-3 h-3 border-2 border-[#9C27B0] border-t-transparent rounded-full animate-spin"></div>
                    Đang gọi AI Text API...
                  </span>
                </div>
                <div className="w-full h-1 bg-canvas rounded-full overflow-hidden border border-border-subtle">
                  <div className="h-full bg-gradient-to-r from-[#9C27B0] to-accent-lime animate-pulse w-full" />
                </div>
              </div>
            )}
            
            {data.errorDetails && !data.isGenerating && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400 flex flex-col gap-2">
                <span className="font-semibold flex items-center gap-1">
                  ⚠️ API Error:
                </span>
                <p className="text-[11px] break-words opacity-90">{data.errorDetails as string}</p>
                <button 
                  onClick={() => {
                    canvasEngine.updateNodeData(id, { errorDetails: null });
                    useWorkflowStore.getState().executeWorkflow();
                  }}
                  className="mt-1 self-end px-2.5 py-1 bg-red-500/20 hover:bg-red-500 hover:text-white border border-red-500/40 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1"
                >
                  🔄 Thử lại (Retry)
                </button>
              </div>
            )}
            
            {data.output && !data.isGenerating && !data.errorDetails ? (
               <div className="bg-canvas border border-border-subtle rounded-xl p-3 text-xs text-text-muted max-h-24 overflow-hidden relative select-text">
                  <p className="line-clamp-3">{data.output as string}</p>
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-canvas to-transparent"></div>
               </div>
            ) : !data.isGenerating && !data.errorDetails && (
               <div className="text-xs text-text-muted italic">Ready</div>
            )}
          </div>
        </div>
      </div>

      {/* Input Handle Ports */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-2 pr-2.5 z-20">
        {inputs.includes('text') && (
          <div 
            className="port-handle w-8 h-8 rounded-full border border-border-subtle bg-panel flex items-center justify-center text-text-muted hover:text-white hover:border-white cursor-crosshair shadow-md"
            title="Text Input"
            data-target={`${id}:text`}
            data-portid="text"
            onPointerDown={(e) => {
              e.stopPropagation();
              onDisconnectStart?.(e, id, 'text');
            }}
          >
            <Type size={14} />
          </div>
        )}

        {inputs.includes('image') && (
          <div 
            className="port-handle w-8 h-8 rounded-full border border-border-subtle bg-panel flex items-center justify-center text-text-muted hover:text-white hover:border-white cursor-crosshair shadow-md"
            title="Image Input"
            data-target={`${id}:image`}
            data-portid="image"
            onPointerDown={(e) => {
              e.stopPropagation();
              onDisconnectStart?.(e, id, 'image');
            }}
          >
            <ImageIcon size={14} />
          </div>
        )}

        {inputs.includes('file') && (
          <div 
            className="w-8 h-8 rounded-full border border-orange-400/50 bg-panel flex items-center justify-center text-orange-400 hover:text-orange-300 hover:border-orange-300 transition-colors cursor-crosshair shadow-md"
            title="File Input (.pdf .docx .md ...)"
            data-target={`${id}:file`}
            data-portid="file"
            onPointerDown={(e) => {
              e.stopPropagation();
              onDisconnectStart?.(e, id, 'file');
            }}
          >
            <FileText size={14} />
          </div>
        )}
      </div>

      {/* Output Port (Right) */}
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
          <Bot size={14} />
        </div>
      </div>

      {/* Node Slug / @mention Label below frame */}
      {customNodeName && (
        <div className="absolute -bottom-6 left-0 text-[10px] font-medium text-text-muted flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded-full bg-[#9C27B0]/20 border border-[#9C27B0]/40 flex items-center justify-center text-[#9C27B0]">
            @
          </div>
          <span className="text-white font-mono">{customNodeName}</span>
        </div>
      )}
    </div>
  );
}
