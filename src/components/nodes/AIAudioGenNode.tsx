import { type NodeProps } from '../NodeTypes';
import { getModelMetadata } from '../../store/modelCatalog';
import { useWorkflowStore } from '../../store/workflowStore';
import { Headphones, Type, FileText } from 'lucide-react';

export function AIAudioGenNode({ id, data, selected, onConnectStart, onDisconnectStart }: NodeProps) {
  const modelId = (data.model as string) || 'openai/tts-1';
  const fetchedModels = useWorkflowStore(state => state.fetchedModels);
  const meta = getModelMetadata(modelId, fetchedModels);

  const displayName = meta?.name || modelId;
  const customNodeName = data.nodeName as string;
  const inputs = meta?.inputs || ['text'];

  return (
    <div className="relative group">
      {/* Node Label above node */}
      <div className="absolute -top-6 left-0 label-micro text-text-primary flex items-center gap-1.5">
        <Headphones size={12} className="text-[#3B82F6]" /> Audio Generation
      </div>

      {/* Main Node Card */}
      <div className={`w-[300px] flex rounded-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${selected ? 'border-accent-lime shadow-elev-node-selected' : 'border-defined shadow-elev-node'}`}>
        <div className="w-[3px] bg-[#3B82F6] shrink-0 rounded-l-xl" />
        
        <div className="flex-1 flex flex-col bg-surface-1 rounded-r-xl overflow-hidden">
          {/* Header */}
          <div className="px-3 h-8 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-hidden">
               <span className="title-node text-text-primary truncate">
                  {displayName}
               </span>
            </div>
            <span className="label-micro px-1.5 py-0.5 bg-[#3B82F6]/12 text-[#3B82F6] rounded shrink-0">Audio</span>
          </div>
          
          {/* Vùng Nội Dung */}
          <div className="p-3 flex flex-col gap-3">
            {data.isGenerating && (
              <div className="flex flex-col gap-1.5 p-2 bg-surface-3 border border-hairline rounded-md">
                <div className="flex items-center justify-between text-xs text-state-running">
                  <span className="flex items-center gap-1.5 font-medium">
                    <div className="w-3 h-3 border-2 border-state-running border-t-transparent rounded-full animate-spin"></div>
                    Đang tạo Audio/TTS...
                  </span>
                </div>
                <div className="w-full h-1 bg-surface-0 rounded-full overflow-hidden border border-hairline">
                  <div className="h-full bg-state-running animate-pulse w-full" />
                </div>
              </div>
            )}
            
            {data.output ? (
               <div className="bg-surface-3 border border-hairline rounded-md p-3 select-text">
                  <audio src={data.output as string} controls className="w-full h-8" />
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

        {inputs.includes('file') && (
          <div 
            className="port-handle w-8 h-8 rounded-full border border-orange-400/50 bg-panel flex items-center justify-center text-orange-400 hover:text-orange-300 hover:border-orange-300 cursor-crosshair shadow-md"
            title="File Input"
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
          className="port-handle w-8 h-8 rounded-full border border-[#3B82F6]/60 bg-panel flex items-center justify-center text-[#3B82F6] cursor-crosshair shadow-md"
          title="Audio Output (out)"
          data-target={`${id}:out`}
          data-portid="out"
          onPointerDown={(e) => {
            e.stopPropagation();
            onConnectStart?.(e, id, 'out');
          }}
        >
          <Headphones size={14} />
        </div>
      </div>

      {/* Node Slug / @mention Label below frame */}
      {customNodeName && (
        <div className="absolute -bottom-6 left-0 text-[10px] font-medium text-text-muted flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#3B82F6]">
            @
          </div>
          <span className="text-white font-mono">{customNodeName}</span>
        </div>
      )}
    </div>
  );
}
