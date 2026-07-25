import { X, Image as ImageIcon, Download, Copy, Trash2 } from 'lucide-react';

export function ImageLibraryModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  // Mock generated images for now since we haven't implemented the execution engine
  const mockImages = [
    'https://images.unsplash.com/photo-1699119565747-97d8b52f6b8f?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1698226065545-2e0f46c6f376?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1697998393529-6881c15f9b5a?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1697998393356-912f20fb13a5?q=80&w=600&auto=format&fit=crop',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-panel border border-border-subtle w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2 text-text-primary font-semibold">
            <ImageIcon size={20} className="text-accent-lime" />
            <h2>Image Library</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary hover:bg-white/10 p-1.5 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto no-scrollbar">
          {mockImages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted">
              <ImageIcon size={48} className="mb-4 opacity-50" />
              <p>No images generated yet.</p>
              <p className="text-sm">Run an AI Image Gen node to see results here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mockImages.map((img, i) => (
                <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-canvas border border-border-subtle">
                  <img src={img} alt={`Generated ${i}`} className="w-full h-full object-cover" />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors" title="Copy Image">
                        <Copy size={14} />
                      </button>
                      <button className="p-1.5 bg-white/10 hover:bg-danger/80 text-white rounded-lg transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <button className="w-full py-1.5 bg-accent-lime text-black text-sm font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-accent-lime/90 transition-colors">
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
