import { useSyncExternalStore } from 'react';
import { canvasEngine } from '../../engine/canvasEngine';
import { Download } from 'lucide-react';

export function DownloadProperties({ nodeId }: { nodeId: string }) {
  const node = useSyncExternalStore(
    cb => canvasEngine.subscribe(cb),
    () => canvasEngine.getNode(nodeId)
  );

  if (!node) return null;
  const data = node.data;

  const handleChange = (key: string, value: any) => {
    canvasEngine.updateNodeData(nodeId, { [key]: value });
  };

  return (
    <div className="flex flex-col p-4 gap-5">
      {/* Node Header */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-500/20 text-gray-300">
           <Download size={14} />
        </div>
        <span className="text-sm font-semibold text-white">Download</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-muted flex items-center gap-1">
          Node Name
        </label>
        <input 
          className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-lime"
          placeholder="Download"
          value={(data.nodeName as string) || ''}
          onChange={(e) => handleChange('nodeName', e.target.value)}
        />
      </div>

      <div className="text-xs text-text-muted">
        Download results from the previous node
      </div>

      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-xs text-text-muted">Image resolution</label>
        <span className="text-[10px] text-text-muted/60 leading-tight">Only applies to Flow images (1K/2K/4K). ChatGPT/Grok use direct CDN - no resolution menu.</span>
        <select 
          className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-lime appearance-none mt-1"
          value={(data.imageRes as string) || '1K'}
          onChange={(e) => handleChange('imageRes', e.target.value)}
        >
          <option value="1K">1K</option>
          <option value="2K">2K</option>
          <option value="4K">4K</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-xs text-text-muted">Video resolution</label>
        <span className="text-[10px] text-text-muted/60 leading-tight">Only applies to Flow videos (720p/1080p/4K). Grok videos download directly from CDN - no resolution menu.</span>
        <select 
          className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-lime appearance-none mt-1"
          value={(data.videoRes as string) || '720p'}
          onChange={(e) => handleChange('videoRes', e.target.value)}
        >
          <option value="720p">720p</option>
          <option value="1080p">1080p</option>
          <option value="4K">4K</option>
        </select>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <div 
          className={`w-8 h-4 rounded-full flex items-center p-0.5 cursor-pointer transition-colors shrink-0 ${data.collectAll ? 'bg-accent-lime' : 'bg-border-subtle'}`}
          onClick={() => handleChange('collectAll', !data.collectAll)}
        >
          <div className={`w-3 h-3 rounded-full bg-black shadow-sm transform transition-transform ${data.collectAll ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-white">Collect all images on Flow</span>
          <span className="text-[10px] text-text-muted/60">Automatically collect all images on the Google Flow page</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-xs text-text-muted">Folder name</label>
        <input 
          className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-lime"
          placeholder="Leave empty for default"
          value={(data.folderName as string) || ''}
          onChange={(e) => handleChange('folderName', e.target.value)}
        />
        <div className="text-[10px] text-text-muted/60">Variables: {'{workflow}'}, {'{date}'}, {'{time}'}</div>
      </div>

      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-xs text-text-muted">File name</label>
        <input 
          className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-lime"
          placeholder="{node}_{prompt}_{date}_{time}_{index}"
          value={(data.fileName as string) || '{node}_{prompt}_{date}_{time}_{index}'}
          onChange={(e) => handleChange('fileName', e.target.value)}
        />
        <div className="text-[10px] text-text-muted/60">Variables: {'{prompt}'}, {'{node}'}, {'{index}'}, {'{date}'}, {'{time}'}</div>
      </div>
    </div>
  );
}
