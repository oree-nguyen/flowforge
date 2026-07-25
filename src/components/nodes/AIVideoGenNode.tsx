import { type NodeProps } from '../NodeTypes';
import { useWorkflowStore } from '../../store/workflowStore';
import { Play, Maximize2, Video as VideoIcon, Type, Settings, Sparkles, FileText, Image as ImageIcon, Headphones } from 'lucide-react';
import { canvasEngine } from '../../engine/canvasEngine';
import { ModelSelector } from '../ModelSelector';
import { getModelMetadata } from '../../store/modelCatalog';

export function AIVideoGenNode({ id, data, selected, onDisconnectStart }: NodeProps) {
  const output = data.output as any;
  const isPropertiesPanelOpen = useWorkflowStore(state => (state as any).isPropertiesPanelOpen);
  const fetchedModels = useWorkflowStore(state => state.fetchedModels);

  // Calculate style based on aspect ratio
  const ratioStr = (data.aspectRatio as string) || '16:9';
  const ratioMap: Record<string, string> = {
    '16:9': '16/9',
    '9:16': '9/16',
    '1:1': '1/1'
  };
  const aspectRatio = ratioMap[ratioStr] || '16/9';
  
  const borderColor = 'border-[#3B82F6]'; // Blue for Flow Video
  const glowColor = 'rgba(59,130,246,0.5)';
  
  const modelId = (data.model as string) || 'minimax/video-01';
  const meta = getModelMetadata(modelId, fetchedModels);
  const nodeName = (data.nodeName as string) || (meta?.name || 'Video Generate');
  
  const showBasicSettings = selected && !isPropertiesPanelOpen;
  const inputs = meta?.inputs || ['text', 'image'];

  const handleRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    canvasEngine.updateNodeData(id, { aspectRatio: e.target.value });
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    canvasEngine.updateNodeData(id, { model: e.target.value });
  };

  return (
    <div className="relative group">
      {/* Node Label above frame */}
      <div className="absolute -top-6 left-0 text-xs font-medium text-text-primary flex items-center gap-2">
        <VideoIcon size={12} /> {nodeName}
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
           <video src={output.previewUrl} className="w-full h-full object-cover" controls />
        ) : (
           <div className="w-full h-full flex flex-col items-center justify-center text-text-muted/30">
              <VideoIcon size={48} />
           </div>
        )}

        {/* Top Controls */}
        <div className="absolute top-3 left-3 flex items-center justify-center w-6 h-6 bg-white rounded-full text-black cursor-pointer shadow-lg hover:scale-105 transition-transform">
          <Play size={12} className="ml-0.5" />
        </div>
        
        <div className="absolute top-3 right-3">
           <div className="w-8 h-4 rounded-full bg-accent-lime flex items-center p-0.5 cursor-pointer shadow-lg">
             <div className="w-3 h-3 rounded-full bg-black transform translate-x-4" />
           </div>
        </div>

        {/* Basic Settings Overlay (Bottom) */}
        {showBasicSettings && (
          <div 
            className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-white border border-white/10"
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          >
            <ModelSelector 
              modality="video"
              className="bg-white/10 px-2 py-1 rounded hover:bg-white/20 cursor-pointer outline-none appearance-none text-center min-w-[50px] max-w-[120px] truncate"
              value={modelId}
              onChange={handleModelChange}
            />
            
            <select 
              className="bg-white/10 px-2 py-1 rounded hover:bg-white/20 cursor-pointer outline-none appearance-none text-center min-w-[50px]"
              value={ratioStr}
              onChange={handleRatioChange}
            >
              <option value="16:9" className="bg-[#1a1a1a]">16:9 ▼</option>
              <option value="9:16" className="bg-[#1a1a1a]">9:16 ▼</option>
              <option value="1:1" className="bg-[#1a1a1a]">1:1 ▼</option>
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

      {/* Input Handle Ports (Floating outside left border - Image 2 Style) */}
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
            className="w-8 h-8 rounded-full border border-border-subtle bg-panel flex items-center justify-center text-text-muted hover:text-white hover:border-white transition-colors cursor-crosshair shadow-md"
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
            className="w-8 h-8 rounded-full border border-border-subtle bg-panel flex items-center justify-center text-text-muted hover:text-white hover:border-white transition-colors cursor-crosshair shadow-md"
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

        {inputs.includes('audio') && (
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
        )}
      </div>

      {/* Floating Toolbar Right Bottom */}
      <div className="absolute bottom-2 -right-10 opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="w-8 h-8 rounded-full border border-border-subtle bg-panel flex items-center justify-center text-text-muted hover:text-white hover:border-white transition-colors cursor-pointer">
           <Maximize2 size={14} />
         </div>
      </div>

      {/* Node Label below frame */}
      <div className="absolute -bottom-6 left-0 text-[10px] font-medium text-text-muted flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-[#3B82F6] flex items-center justify-center text-black">
          <Sparkles size={8} />
        </div>
        Google Flow
      </div>
    </div>
  );
}
