import { useSyncExternalStore } from 'react';
import { canvasEngine } from '../../engine/canvasEngine';
import { Image, Sparkles, DollarSign, Dice5 } from 'lucide-react';
import { ModelSelector } from '../ModelSelector';
import { getModelMetadata } from '../../store/modelCatalog';
import { useWorkflowStore } from '../../store/workflowStore';

export function ImageGenProperties({ nodeId }: { nodeId: string }) {
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

  const ratios = ['9:16', '3:4', '1:1', '4:3', '16:9'];
  const currentRatio = (data.aspectRatio as string) || '9:16';
  const modelId = (data.model as string) || 'black-forest-labs/flux-1-schnell';
  const meta = getModelMetadata(modelId, fetchedModels);
  const displayName = meta?.name || modelId;

  return (
    <div className="flex flex-col p-4 gap-5">
      {/* Node Header - Dynamic Name */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded flex items-center justify-center bg-[#FF9800]/20 text-[#FF9800]">
           <Image size={14} />
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
          placeholder="GPT Image Node"
          value={(data.nodeName as string) || ''}
          onChange={(e) => handleChange('nodeName', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-muted flex items-center gap-1">
          <Sparkles size={12} /> Prompt
        </label>
        <div className="relative border border-border-subtle rounded-lg bg-[#141414] overflow-hidden focus-within:border-accent-lime transition-colors">
          <textarea 
            className="w-full bg-transparent p-3 text-xs text-white outline-none resize-none min-h-[120px]"
            placeholder="E.g.: A cute cat playing with yarn, cinematic lighting"
            value={(data.prompt as string) || ''}
            onChange={(e) => handleChange('prompt', e.target.value)}
          />
        </div>
        <div className="text-right text-[10px] text-text-muted">
          {((data.prompt as string) || '').length}/30.000
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <label className="text-xs font-medium text-white">Image ratio</label>
        <div className="flex gap-1">
          {ratios.map(r => (
            <button
              key={r}
              onClick={() => handleChange('aspectRatio', r)}
              className={`flex-1 py-1.5 text-[10px] rounded border transition-colors ${currentRatio === r ? 'border-accent-lime text-accent-lime bg-accent-lime/10' : 'border-border-subtle text-text-muted hover:border-white/30 hover:text-white'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-1">
        <label className="text-xs text-text-muted">Model</label>
        <ModelSelector 
          modality="image"
          value={modelId}
          onChange={(e) => handleChange('model', e.target.value)}
        />
      </div>

      {/* Advanced Settings Collapsible */}
      <div className="flex flex-col border border-border-subtle rounded-xl overflow-hidden mt-1 bg-white/5">
        <div 
          className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors select-none"
          onClick={() => handleChange('showAdvanced', !data.showAdvanced)}
        >
          <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
            ⚙️ Advanced settings
          </span>
          <span className="text-xs text-text-muted">{data.showAdvanced ? '▲' : '▼'}</span>
        </div>

        {data.showAdvanced && (
          <div className="p-3 border-t border-border-subtle flex flex-col gap-3.5 bg-canvas/40">
            {/* Steps */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <label className="text-text-muted font-medium">Steps</label>
                <span className="text-accent-lime font-mono text-[11px]">{data.steps || 25}</span>
              </div>
              <input 
                type="range"
                min={1}
                max={50}
                step={1}
                className="accent-accent-lime cursor-pointer"
                value={data.steps || 25}
                onChange={(e) => handleChange('steps', parseInt(e.target.value))}
              />
            </div>

            {/* Guidance Scale */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <label className="text-text-muted font-medium">Guidance Scale</label>
                <span className="text-accent-lime font-mono text-[11px]">{data.guidanceScale || 7.5}</span>
              </div>
              <input 
                type="range"
                min={1}
                max={20}
                step={0.5}
                className="accent-accent-lime cursor-pointer"
                value={data.guidanceScale || 7.5}
                onChange={(e) => handleChange('guidanceScale', parseFloat(e.target.value))}
              />
            </div>

            {/* Seed */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-muted font-medium">Seed (Optional)</label>
              <div className="flex items-center gap-1.5">
                <input 
                  type="number"
                  className="flex-1 bg-transparent border border-border-subtle rounded-lg px-3 py-1 text-xs text-white outline-none focus:border-accent-lime font-mono"
                  placeholder="Random (-1)"
                  value={data.seed !== undefined ? data.seed : ''}
                  onChange={(e) => handleChange('seed', e.target.value ? parseInt(e.target.value) : undefined)}
                />
                <button 
                  onClick={() => handleChange('seed', Math.floor(Math.random() * 1000000))}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-accent-lime rounded-lg border border-border-subtle transition-colors"
                  title="Randomize Seed (Xúc xắc)"
                >
                  <Dice5 size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
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
          ~${((data.n || 1) * 0.03).toFixed(3)} USD
        </span>
      </div>
    </div>
  );
}
