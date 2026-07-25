import { useSyncExternalStore } from 'react';
import { canvasEngine } from '../../engine/canvasEngine';
import { Video, Sparkles } from 'lucide-react';
import { ModelSelector } from '../ModelSelector';

export function VideoGenProperties({ nodeId }: { nodeId: string }) {
  const node = useSyncExternalStore(
    cb => canvasEngine.subscribe(cb),
    () => canvasEngine.getNode(nodeId)
  );

  if (!node) return null;
  const data = node.data;

  const handleChange = (key: string, value: any) => {
    canvasEngine.updateNodeData(nodeId, { [key]: value });
  };

  const isUseOwnPrompt = data.useOwnPrompt !== false; // Default true
  const ratios = ['16:9', '9:16', '1:1'];
  const currentRatio = (data.aspectRatio as string) || '16:9';

  return (
    <div className="flex flex-col p-4 gap-5">
      {/* Node Header */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded flex items-center justify-center bg-accent-lime/20 text-accent-lime">
           <Video size={14} />
        </div>
        <span className="text-sm font-semibold text-white">Flow - Video Generate</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-muted flex items-center gap-1">
          <span className="opacity-70">🏷️</span> Node Name <span className="text-[10px] bg-white/10 px-1 rounded">@Slug (@mention)</span>
        </label>
        <input 
          className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-lime"
          placeholder="Video Gen 1"
          value={(data.nodeName as string) || ''}
          onChange={(e) => handleChange('nodeName', e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-white">Use own prompt</label>
        <div 
          className={`w-8 h-4 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${isUseOwnPrompt ? 'bg-accent-lime' : 'bg-border-subtle'}`}
          onClick={() => handleChange('useOwnPrompt', !isUseOwnPrompt)}
        >
          <div className={`w-3 h-3 rounded-full bg-black shadow-sm transform transition-transform ${isUseOwnPrompt ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
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
            disabled={!isUseOwnPrompt}
          />
          <div className="absolute bottom-2 right-2">
            <button className="text-[10px] border border-border-subtle rounded px-2 py-1 text-text-muted hover:text-white hover:border-white transition-colors bg-[#1a1a1a]">
              ⊚ Preview
            </button>
          </div>
        </div>
        <div className="text-right text-[10px] text-text-muted">
          {((data.prompt as string) || '').length}/30.000
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-muted">Mention Mode (Advanced)</label>
        <select className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-lime appearance-none">
          <option>Settings</option>
        </select>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <label className="text-xs font-medium text-white">Video ratio</label>
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

      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-xs text-text-muted">Reference Images</label>
        <button className="w-full py-2 border border-border-subtle border-dashed rounded-lg text-xs text-text-muted hover:text-white hover:border-white/50 transition-colors flex items-center justify-center gap-2">
          <span>🖼️</span> Select / Upload image
        </button>
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-xs text-text-muted">Model</label>
        <ModelSelector 
          modality="video"
          className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-lime appearance-none"
          value={(data.model as string) || 'minimax/video-01'}
          onChange={(e) => handleChange('model', e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 mt-2 cursor-pointer text-text-muted hover:text-white transition-colors">
        <span className="text-[10px]">▶</span>
        <span className="text-xs">Advanced settings</span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <label className="text-xs font-medium text-white">Auto download</label>
        <div 
          className={`w-8 h-4 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${data.autoDownload ? 'bg-accent-lime' : 'bg-border-subtle'}`}
          onClick={() => handleChange('autoDownload', !data.autoDownload)}
        >
          <div className={`w-3 h-3 rounded-full bg-black shadow-sm transform transition-transform ${data.autoDownload ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
      </div>
    </div>
  );
}
