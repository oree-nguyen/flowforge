import { useRef } from 'react';
import { canvasEngine } from '../../engine/canvasEngine';
import { type NodeProps } from '../NodeTypes';
import { Video, X } from 'lucide-react';

export function InputVideoNode({ id, data, selected, onConnectStart }: NodeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const videoUrl = URL.createObjectURL(file);
    canvasEngine.updateNodeData(id, { output: videoUrl, file: videoUrl, fileName: file.name });
  };

  const removeVideo = () => {
    canvasEngine.updateNodeData(id, { output: null, file: null, fileName: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`w-[260px] bg-[#0c0c0e]/95 backdrop-blur-xl rounded-[24px] shadow-2xl border ${selected ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-white/10 hover:border-white/20'} transition-all`}>
      <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center gap-2 rounded-t-[24px]">
        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
        <span className="text-sm font-medium text-white">Input Video</span>
      </div>
      
      <div className="p-4">
        {data.output || data.file ? (
          <div className="relative group rounded-xl overflow-hidden bg-canvas border border-border-subtle aspect-video flex items-center justify-center">
            <video src={(data.output || data.file) as string} controls className="max-w-full max-h-full object-contain" />
            <button 
              onClick={removeVideo}
              onPointerDown={e => e.stopPropagation()}
              className="absolute top-2 right-2 bg-panel/80 p-1.5 rounded-lg text-text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
            >
              <X size={14} />
            </button>
            {data.fileName && (
               <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-1.5 text-[10px] text-white truncate text-center font-mono z-10">
                  {data.fileName as string}
               </div>
            )}
          </div>
        ) : (
          <div 
            className="h-32 bg-canvas border border-dashed border-border-subtle rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-text-muted transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onPointerDown={e => e.stopPropagation()}
          >
            <Video size={24} className="text-text-muted" />
            <span className="text-xs text-text-muted font-medium">Click to upload video</span>
          </div>
        )}
        <input 
          type="file" 
          accept="video/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleVideoChange}
        />
      </div>

      {/* Single Output Port Icon (Right) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-2 pl-2.5 z-20">
        <div 
          className="port-handle w-8 h-8 rounded-full border border-emerald-400/60 bg-panel flex items-center justify-center text-emerald-400 cursor-crosshair shadow-md"
          title="Video Output (out)"
          data-target={`${id}:out`}
          data-portid="out"
          onPointerDown={(e) => {
            e.stopPropagation();
            onConnectStart?.(e, id, 'out');
          }}
        >
          <Video size={14} />
        </div>
      </div>
    </div>
  );
}
