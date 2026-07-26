import { useRef } from 'react';
import { canvasEngine } from '../../engine/canvasEngine';
import { type NodeProps } from '../NodeTypes';
import { ImagePlus, X } from 'lucide-react';

export function InputImageNode({ id, data, selected }: NodeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      canvasEngine.updateNodeData(id, { file: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const imageSrc = (data.file as string) || (data.image as string);

  const removeImage = () => {
    canvasEngine.updateNodeData(id, { file: null, image: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`w-[260px] bg-node rounded-2xl shadow-lg border ${selected ? 'border-text-primary shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-border-subtle'} overflow-hidden transition-all`}>
      <div className="px-4 py-3 bg-white/5 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-400"></div>
          <span className="text-sm font-medium text-text-primary">Input Image</span>
        </div>
        <span className="text-[10px] text-text-muted font-mono">Input</span>
      </div>
      
      <div className="p-4">
        {imageSrc ? (
          <div className="relative group rounded-xl overflow-hidden bg-canvas border border-border-subtle aspect-square flex items-center justify-center">
            <img src={imageSrc} alt="Input" className="w-full h-full object-cover" />
            <button 
              onClick={removeImage}
              onPointerDown={e => e.stopPropagation()}
              className="absolute top-2 right-2 bg-panel/80 p-1.5 rounded-lg text-text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              title="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div 
            className="h-32 bg-canvas border border-dashed border-border-subtle rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-text-muted transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onPointerDown={e => e.stopPropagation()}
          >
            <ImagePlus size={24} className="text-text-muted" />
            <span className="text-xs text-text-muted font-medium">Click to upload</span>
          </div>
        )}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleImageChange}
        />
      </div>
    </div>
  );
}
