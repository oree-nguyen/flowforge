import { useSyncExternalStore } from 'react';
import { canvasEngine } from '../../engine/canvasEngine';
import { Headphones, Sparkles, DollarSign } from 'lucide-react';
import { ModelSelector } from '../ModelSelector';
import { getModelMetadata } from '../../store/modelCatalog';
import { useWorkflowStore } from '../../store/workflowStore';

export function AudioGenProperties({ nodeId }: { nodeId: string }) {
  const node = useSyncExternalStore(
    cb => canvasEngine.subscribe(cb),
    () => canvasEngine.getNode(nodeId)
  );

  const fetchedModels = useWorkflowStore(state => state.fetchedModels);

  if (!node) return null;
  const data = node.data;

  const handleChange = (key: string, value: any) => {
    canvasEngine.updateNodeData(nodeId, { [key]: value });
  };

  const modelId = (data.model as string) || 'openai/tts-1';
  const meta = getModelMetadata(modelId, fetchedModels);
  const displayName = meta?.name || modelId;

  return (
    <div className="flex flex-col p-4 gap-5">
      {/* Node Header - Dynamic Name */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded flex items-center justify-center bg-[#F59E0B]/20 text-[#F59E0B]">
           <Headphones size={14} />
        </div>
        <span className="text-sm font-semibold text-white truncate" title={displayName}>
          {displayName}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-muted flex items-center gap-1">
          <span className="opacity-70">🏷️</span> Node Name <span className="text-[10px] bg-white/10 px-1 rounded">@Slug (@mention)</span>
        </label>
        <input 
          className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-lime"
          placeholder="Audio Gen Node"
          value={(data.nodeName as string) || ''}
          onChange={(e) => handleChange('nodeName', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-muted flex items-center gap-1">
          <Sparkles size={12} /> Text / Script
        </label>
        <div className="relative border border-border-subtle rounded-lg bg-[#141414] overflow-hidden focus-within:border-accent-lime transition-colors">
          <textarea 
            className="w-full bg-transparent p-3 text-xs text-white outline-none resize-none min-h-[120px]"
            placeholder="Text script to read aloud..."
            value={(data.prompt as string) || ''}
            onChange={(e) => handleChange('prompt', e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-xs text-text-muted">Model</label>
        <ModelSelector 
          modality="audio"
          value={modelId}
          onChange={(e) => handleChange('model', e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <label className="text-xs font-medium text-white">Auto download</label>
        <div 
          className={`w-8 h-4 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${data.autoDownload ? 'bg-accent-lime' : 'bg-border-subtle'}`}
          onClick={() => handleChange('autoDownload', !data.autoDownload)}
        >
          <div className={`w-3 h-3 rounded-full bg-black shadow-sm transform transition-transform ${data.autoDownload ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
      </div>

      {/* Pre-Execution Cost Estimate */}
      <div className="flex items-center justify-between px-3 py-2 bg-canvas/60 border border-border-subtle rounded-xl text-xs mt-2">
        <span className="flex items-center gap-1 text-text-muted text-[11px]">
          <DollarSign size={13} className="text-emerald-400" /> Ước tính chi phí trước khi chạy:
        </span>
        <span className="font-mono text-emerald-400 font-semibold text-[11px]">
          ~${((((data.prompt as string) || '').length / 1000) * 0.015 || 0.015).toFixed(3)} USD
        </span>
      </div>
    </div>
  );
}
