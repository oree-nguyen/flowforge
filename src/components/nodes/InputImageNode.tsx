import { useRef } from 'react';
import { canvasEngine } from '../../engine/canvasEngine';
import { type NodeProps } from '../NodeTypes';
import { ImagePlus, X } from 'lucide-react';

export function InputImageNode({ id, data, selected, onConnectStart }: NodeProps) {
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

  const removeImage = () => {
    canvasEngine.updateNodeData(id, { file: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="relative group">
      {/* Node Label above node */}
      <div className="absolute -top-6 left-0 label-micro text-text-primary flex items-center gap-1.5">
        <ImagePlus size={12} className="text-[#FF9800]" /> Image Input
      </div>

      <div className={`w-[260px] flex rounded-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${selected ? 'border-accent-lime shadow-elev-node-selected' : 'border-defined shadow-elev-node'}`}>
        <div className="w-[3px] bg-[#FF9800] shrink-0 rounded-l-xl" />
        
        <div className="flex-1 flex flex-col bg-surface-1 rounded-r-xl overflow-hidden">
          <div className="px-3 h-8 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="title-node text-text-primary truncate">
                Input Image
              </span>
            </div>
            <span className="label-micro px-1.5 py-0.5 bg-[#FF9800]/12 text-[#FF9800] rounded shrink-0">Image</span>
          </div>
          
          <div className="p-3 flex flex-col gap-3">
            {data.file ? (
              <div className="relative group/img rounded-md overflow-hidden bg-surface-0 border border-hairline aspect-video flex items-center justify-center">
                <img src={data.file as string} alt="Input" className="max-w-full max-h-full object-contain" />
                <button 
                  onClick={removeImage}
                  onPointerDown={e => e.stopPropagation()}
                  className="absolute top-2 right-2 bg-surface-1/80 p-1.5 rounded-lg text-text-primary opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-state-error shadow-elev-floating"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div 
                className="h-32 bg-surface-0 border border-dashed border-hairline rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-text-muted transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onPointerDown={e => e.stopPropagation()}
              >
                <ImagePlus size={24} className="text-text-muted" />
                <span className="label-small text-text-muted opacity-80">Click to upload</span>
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
      </div>

      {/* Single Output Port Icon (Right) */}
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
          <ImagePlus size={14} />
        </div>
      </div>
    </div>
  );
}
