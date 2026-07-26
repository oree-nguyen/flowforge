import { useSyncExternalStore } from 'react';
import { canvasEngine } from '../../engine/canvasEngine';
import { Sparkles, Type } from 'lucide-react';
import { ModelSelector } from '../ModelSelector';

export function TextGenProperties({ nodeId }: { nodeId: string }) {
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

  return (
    <div className="flex flex-col p-4 gap-5">
      {/* Node Header */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded flex items-center justify-center bg-[#9C27B0]/20 text-[#9C27B0]">
           <Type size={14} />
        </div>
        <span className="text-sm font-semibold text-white">ChatGPT (Text)</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-muted flex items-center gap-1">
          <span className="opacity-70">🏷️</span> Node Name <span className="text-[10px] bg-white/10 px-1 rounded">@Slug (@mention)</span>
        </label>
        <input 
          className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-lime"
          placeholder="GPT Text Node"
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

      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-xs text-text-muted">Model</label>
        <ModelSelector 
          modality="text"
          className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-lime appearance-none"
          value={(data.model as string) || 'google/gemini-1.5-flash'}
          onChange={(e) => handleChange('model', e.target.value)}
        />
      </div>

      {/* Advanced Settings Collapsible */}
      <div className="flex flex-col border border-border-subtle rounded-xl overflow-hidden mt-2 bg-white/5">
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
            {/* Max Tokens */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <label className="text-text-muted font-medium">Max Tokens</label>
                <span className="text-accent-lime font-mono text-[11px]">{data.maxTokens || 16000}</span>
              </div>
              <input 
                type="number"
                min={512}
                max={32000}
                step={512}
                className="bg-transparent border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-accent-lime"
                placeholder="16000"
                value={data.maxTokens !== undefined ? data.maxTokens : 16000}
                onChange={(e) => handleChange('maxTokens', parseInt(e.target.value) || 16000)}
              />
              <span className="text-[10px] text-text-muted">Giới hạn độ dài output (mặc định: 16,000 cho giáo án dài).</span>
            </div>

            {/* Temperature */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <label className="text-text-muted font-medium">Temperature</label>
                <span className="text-accent-lime font-mono text-[11px]">{data.temperature !== undefined ? data.temperature : 0.7}</span>
              </div>
              <input 
                type="range"
                min={0}
                max={1}
                step={0.05}
                className="accent-accent-lime cursor-pointer"
                value={data.temperature !== undefined ? data.temperature : 0.7}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
              />
              <div className="flex justify-between text-[9px] text-text-muted">
                <span>0.0 (Chính xác/Logic)</span>
                <span>1.0 (Sáng tạo)</span>
              </div>
            </div>

            {/* Hide Reasoning Trace */}
            <div className="flex items-center justify-between pt-1 border-t border-border-subtle/50">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-white">Ẩn reasoning trace</label>
                <span className="text-[10px] text-text-muted">Gửi parameter reasoning.exclude đến API</span>
              </div>
              <div 
                className={`w-8 h-4 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${(data.hideReasoning !== false) ? 'bg-accent-lime' : 'bg-border-subtle'}`}
                onClick={() => handleChange('hideReasoning', data.hideReasoning === false ? true : false)}
              >
                <div className={`w-3 h-3 rounded-full bg-black shadow-sm transform transition-transform ${(data.hideReasoning !== false) ? 'translate-x-4' : 'translate-x-0'}`} />
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
    </div>
  );
}
