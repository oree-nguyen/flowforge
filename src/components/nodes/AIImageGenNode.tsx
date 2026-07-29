import { type NodeProps } from '../NodeTypes';
import { useWorkflowStore } from '../../store/workflowStore';
import { Play, Image as ImageIcon, Type, Settings, FileText, Camera } from 'lucide-react';
import { canvasEngine } from '../../engine/canvasEngine';
import { ModelSelector } from '../ModelSelector';
import { getModelMetadata } from '../../store/modelCatalog';

export function AIImageGenNode({ id, data, selected, onConnectStart, onDisconnectStart }: NodeProps) {
  const output = data.output as any;
  const isPropertiesPanelOpen = useWorkflowStore(state => (state as any).isPropertiesPanelOpen);
  const fetchedModels = useWorkflowStore(state => state.fetchedModels);

  // Calculate style based on aspect ratio
  const ratioStr = (data.aspectRatio as string) || '9:16';
  const ratioMap: Record<string, string> = {
    '9:16': '9/16',
    '16:9': '16/9',
    '1:1': '1/1',
    '4:3': '4/3',
    '3:4': '3/4'
  };
  const aspectRatio = ratioMap[ratioStr] || '9/16';
  
  const borderColor = 'border-[#FF9800]';
  const glowColor = 'rgba(255,152,0,0.5)';
  
  const modelId = (data.model as string) || 'black-forest-labs/flux-1-schnell';
  const meta = getModelMetadata(modelId, fetchedModels);
  const displayName = meta?.name || modelId;
  const customNodeName = data.nodeName as string;
  
  const showBasicSettings = selected && !isPropertiesPanelOpen;
  const inputs = meta?.inputs || ['text'];

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
      <div className="absolute -top-6 left-0 text-xs font-medium text-text-primary flex items-center gap-2">
        <ImageIcon size={12} /> {displayName}
      </div>

      {/* Main Frame */}
      <div 
        className={`w-[320px] bg-[#1a1a1a] rounded-xl relative overflow-hidden transition-all ${selected ? `border-2 ${borderColor}` : 'border-2 border-border-subtle hover:border-text-muted'}`}
        style={{ 
          aspectRatio, 
          boxShadow: selected ? `0 0 20px ${glowColor}` : 'none' 
        }}
      >
        {/* Preview or Placeholder */}
        {output?.previewUrl ? (
           <img src={output.previewUrl} className="w-full h-full object-cover" alt="Output" />
        ) : (
           <div className="w-full h-full flex flex-col items-center justify-center text-text-muted/30">
              <ImageIcon size={48} />
           </div>
        )}

        {/* Loading Overlay */}
        {data.isGenerating && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-accent-lime z-20">
            <div className="w-6 h-6 border-2 border-accent-lime border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold">Đang sinh ảnh AI...</span>
            <div className="w-1/2 h-1 bg-white/10 rounded-full overflow-hidden border border-white/20">
              <div className="h-full bg-accent-lime animate-pulse w-full" />
            </div>
          </div>
        )}

        {/* Top Controls */}
        <div className="absolute top-3 left-3 flex items-center justify-center w-6 h-6 bg-white rounded-full text-black cursor-pointer shadow-lg hover:scale-105 transition-transform">
          <Play size={12} className="ml-0.5" />
        </div>
        
        <div className="absolute top-3 right-3">
           <div 
             className={`w-8 h-4 rounded-full flex items-center p-0.5 cursor-pointer shadow-lg transition-colors ${data.autoDownload ? 'bg-accent-lime' : 'bg-border-subtle'}`}
             onClick={toggleAuto}
           >
             <div className={`w-3 h-3 rounded-full bg-black shadow-sm transform transition-transform ${data.autoDownload ? 'translate-x-4' : 'translate-x-0'}`} />
           </div>
        </div>

        {/* Basic Settings Overlay (Bottom) */}
        {showBasicSettings && (
          <div 
            className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-white border border-white/10"
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          >
            <div className="max-w-[120px]">
              <ModelSelector 
                modality="image"
                value={modelId}
                onChange={handleModelChange}
              />
            </div>
            
            <select 
              className="bg-white/10 px-2 py-1 rounded hover:bg-white/20 cursor-pointer outline-none appearance-none text-center min-w-[50px]"
              value={ratioStr}
              onChange={handleRatioChange}
            >
              <option value="9:16" className="bg-[#1a1a1a]">9:16 ▼</option>
              <option value="3:4" className="bg-[#1a1a1a]">3:4 ▼</option>
              <option value="1:1" className="bg-[#1a1a1a]">1:1 ▼</option>
              <option value="4:3" className="bg-[#1a1a1a]">4:3 ▼</option>
              <option value="16:9" className="bg-[#1a1a1a]">16:9 ▼</option>
            </select>

            <div className="flex-1" />
            <div 
              className="p-1 hover:bg-white/20 rounded cursor-pointer"
              onClick={(e) => { 
                e.stopPropagation(); 
                canvasEngine.select(id); 
                useWorkflowStore.getState().setPropertiesPanelOpen(true); 
              }}
            >
              <Settings size={12} />
            </div>
          </div>
        )}
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
          className="port-handle w-8 h-8 rounded-full border border-[#FF9800]/60 bg-panel flex items-center justify-center text-[#FF9800] cursor-crosshair shadow-md"
          title="Image Output (out)"
          data-target={`${id}:out`}
          data-portid="out"
          onPointerDown={(e) => {
            e.stopPropagation();
            onConnectStart?.(e, id, 'out');
          }}
        >
          <Camera size={14} />
        </div>
      </div>

      {/* Node Slug / @mention Label below frame */}
      {customNodeName && (
        <div className="absolute -bottom-6 left-0 text-[10px] font-medium text-text-muted flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded-full bg-[#FF9800]/20 border border-[#FF9800]/40 flex items-center justify-center text-[#FF9800]">
            @
          </div>
          <span className="text-white font-mono">{customNodeName}</span>
        </div>
      )}
    </div>
  );
}
