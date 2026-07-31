import { type NodeProps } from '../NodeTypes';
import { useWorkflowStore } from '../../store/workflowStore';
import { Play, Video as VideoIcon, Type, Settings, Image as ImageIcon } from 'lucide-react';
import { canvasEngine } from '../../engine/canvasEngine';
import { ModelSelector } from '../ModelSelector';
import { getModelMetadata } from '../../store/modelCatalog';

export function AIVideoGenNode({ id, data, selected, onConnectStart, onDisconnectStart }: NodeProps) {
  const output = data.output as any;
  const fetchedModels = useWorkflowStore(state => state.fetchedModels);

  // Calculate style based on aspect ratio
  const ratioStr = (data.aspectRatio as string) || '16:9';
  const ratioMap: Record<string, string> = {
    '16:9': '16/9',
    '9:16': '9/16',
    '1:1': '1/1'
  };
  const aspectRatio = ratioMap[ratioStr] || '16/9';
  
  const modelId = (data.model as string) || 'minimax/video-01';
  const meta = getModelMetadata(modelId, fetchedModels);
  const displayName = meta?.name || modelId;
  const customNodeName = data.nodeName as string;
  

  const inputs = meta?.inputs || ['text', 'image'];

  const handleRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    canvasEngine.updateNodeData(id, { aspectRatio: e.target.value });
  };

  const handleModelChange = (e: { target: { value: string } }) => {
    canvasEngine.updateNodeData(id, { model: e.target.value });
  };

  const toggleAuto = (e: React.MouseEvent) => {
    e.stopPropagation();
    canvasEngine.updateNodeData(id, { autoDownload: !data.autoDownload });
  };

  return (
    <div className="relative group">
      {/* Node Label above frame */}
      <div className="absolute -top-6 left-0 label-micro text-text-primary flex items-center gap-1.5">
        <VideoIcon size={12} className="text-accent-lime" /> Video Generation
      </div>

      {/* Main Node Card */}
      <div className={`w-[320px] flex rounded-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${selected ? 'border-accent-lime shadow-elev-node-selected' : 'border-defined shadow-elev-node'}`}>
        <div className="w-[3px] bg-accent-lime shrink-0 rounded-l-xl" />
        
        <div className="flex-1 flex flex-col bg-surface-1 rounded-r-xl overflow-hidden">
          {/* Header */}
          <div className="px-3 h-8 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-hidden">
               <span className="title-node text-text-primary truncate">
                  {displayName}
               </span>
            </div>
            <span className="label-micro px-1.5 py-0.5 bg-accent-lime/12 text-accent-lime rounded shrink-0">Video</span>
          </div>

          {/* Vùng Nội Dung (Preview) */}
          <div className="p-3 flex flex-col gap-3">
            <div 
              className="w-full bg-surface-0 rounded-md relative border border-hairline overflow-hidden"
              style={{ aspectRatio }}
            >
              {/* Preview or Placeholder */}
              {output?.previewUrl ? (
                 <video src={output.previewUrl} className="w-full h-full object-cover" controls />
              ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-text-muted/30">
                    <VideoIcon size={48} />
                 </div>
              )}

              {/* Loading Overlay */}
              {data.isGenerating && (
                <div className="absolute inset-0 bg-surface-0/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-state-running z-20">
                  <div className="w-6 h-6 border-2 border-state-running border-t-transparent rounded-full animate-spin"></div>
                  <span className="label-small font-semibold">Đang tạo Video AI...</span>
                  <div className="w-1/2 h-1 bg-surface-1 rounded-full overflow-hidden border border-hairline">
                    <div className="h-full bg-state-running animate-pulse w-full" />
                  </div>
                </div>
              )}

              {/* Action Overlay */}
              <div className="absolute top-2 left-2 flex items-center justify-center w-6 h-6 bg-surface-1 rounded border border-hairline text-text-primary cursor-pointer hover:bg-surface-3 transition-colors shadow-elev-floating">
                <Play size={12} className="ml-0.5 text-accent-lime" />
              </div>
              
              <div className="absolute top-2 right-2">
                 <div 
                   className={`w-7 h-3.5 rounded-full flex items-center p-0.5 cursor-pointer shadow-elev-floating transition-colors ${data.autoDownload ? 'bg-accent-lime' : 'bg-surface-3 border border-hairline'}`}
                   onClick={toggleAuto}
                 >
                   <div className={`w-2.5 h-2.5 rounded-full bg-white shadow-sm transform transition-transform ${data.autoDownload ? 'translate-x-3.5' : 'translate-x-0'}`} />
                 </div>
              </div>
            </div>

            {/* Sub-controls (Ratio) */}
            <div className="flex items-center gap-2">
              <select 
                className="bg-surface-3 border border-hairline px-2 py-1 rounded-md hover:bg-surface-4 cursor-pointer outline-none appearance-none text-center label-small text-text-primary w-20"
                value={ratioStr}
                onChange={handleRatioChange}
              >
                <option value="16:9">16:9 ▼</option>
                <option value="9:16">9:16 ▼</option>
                <option value="1:1">1:1 ▼</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 border-t border-hairline bg-surface-1 flex items-center justify-between">
             <div className="flex-1 max-w-[150px]">
               <ModelSelector 
                 modality="video"
                 value={modelId}
                 onChange={handleModelChange}
               />
             </div>
             
             <div className="flex items-center gap-2">
               {/* Giả lập giá tiền */}
               <span className="data-mono text-text-muted">~$0.20</span>
               <div 
                 className="p-1 hover:bg-surface-3 rounded cursor-pointer text-text-muted"
                 onClick={(e) => { 
                   e.stopPropagation(); 
                   canvasEngine.select(id); 
                   useWorkflowStore.getState().setPropertiesPanelOpen(true); 
                 }}
               >
                 <Settings size={12} />
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Input Handle Ports */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-2 pr-2.5 z-20">
        {inputs.includes('video') && (
          <div 
            className="w-8 h-8 rounded-full border border-border-subtle bg-panel flex items-center justify-center text-text-muted hover:text-white hover:border-white transition-colors cursor-crosshair shadow-md"
            title="Video Input"
            data-target={`${id}:video`}
            data-portid="video"
            onPointerDown={(e) => {
              e.stopPropagation();
              onDisconnectStart?.(e, id, 'video');
            }}
          >
            <VideoIcon size={14} />
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
      </div>

      {/* Output Port (Right) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-2 pl-2.5 z-20">
        <div 
          className="port-handle w-8 h-8 rounded-full border border-accent-lime/60 bg-panel flex items-center justify-center text-accent-lime cursor-crosshair shadow-md"
          title="Video Output (out)"
          data-target={`${id}:out`}
          data-portid="out"
          onPointerDown={(e) => {
            e.stopPropagation();
            onConnectStart?.(e, id, 'out');
          }}
        >
          <VideoIcon size={14} />
        </div>
      </div>

      {/* Node Slug / @mention Label below frame */}
      {customNodeName && (
        <div className="absolute -bottom-6 left-0 text-[10px] font-medium text-text-muted flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded-full bg-accent-lime/20 border border-accent-lime/40 flex items-center justify-center text-accent-lime">
            @
          </div>
          <span className="text-white font-mono">{customNodeName}</span>
        </div>
      )}
    </div>
  );
}
