import { useState, useRef, useEffect } from 'react';
import { BookOpen, X, Scissors } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';

interface ShortcutGuideProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ShortcutGuide({ isOpen, onToggle }: ShortcutGuideProps) {
  const [activeCategory, setActiveCategory] = useState<'shortcuts' | 'api' | 'tips' | 'about'>('shortcuts');
  const openVideoEditorNodeId = useWorkflowStore((state) => state.openVideoEditorNodeId);
  const setOpenVideoEditorNodeId = useWorkflowStore((state) => state.setOpenVideoEditorNodeId);
  const guideContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (e: PointerEvent) => {
      if (guideContainerRef.current && !guideContainerRef.current.contains(e.target as Node)) {
        onToggle();
      }
    };

    window.addEventListener('pointerdown', handlePointerDownOutside);
    return () => window.removeEventListener('pointerdown', handlePointerDownOutside);
  }, [isOpen, onToggle]);

  return (
    <div ref={guideContainerRef} className="fixed bottom-6 right-6 z-50 flex items-end gap-4 pointer-events-none">
      {/* The Guide Panel (Opens to the LEFT of the 2 buttons) */}
      <div 
        className={`overflow-hidden rounded-2xl border border-border-subtle shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-50 opacity-0 pointer-events-none'
        }`}
        style={{
          width: '680px',
          height: '460px',
          background: 'rgba(8, 8, 12, 0.85)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="flex h-full text-text-primary">
          {/* Left Column: Categories */}
          <div className="w-[180px] shrink-0 border-r border-border-subtle p-4 flex flex-col gap-1">
            <h3 className="text-xs font-semibold text-text-muted mb-3 px-2 uppercase tracking-wider">Categories</h3>
            
            <button
              onClick={() => setActiveCategory('shortcuts')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === 'shortcuts' ? 'bg-white/10 text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              ⌨️ Shortcuts
            </button>
            <button
              onClick={() => setActiveCategory('api')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === 'api' ? 'bg-white/10 text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              🔑 API Keys
            </button>
            <button
              onClick={() => setActiveCategory('tips')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === 'tips' ? 'bg-white/10 text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              💡 Tips
            </button>
            <button
              onClick={() => setActiveCategory('about')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === 'about' ? 'bg-white/10 text-white' : 'text-text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              ℹ️ About
            </button>
          </div>

          {/* Right Column: Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold">
                {activeCategory === 'shortcuts' && 'Keyboard Shortcuts'}
                {activeCategory === 'api' && 'API Keys Guide'}
                {activeCategory === 'tips' && 'FlowForge Tips'}
                {activeCategory === 'about' && 'About FlowForge'}
              </h2>
              <button onClick={onToggle} className="p-1 text-text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content Switch */}
            {activeCategory === 'shortcuts' && (
              <div className="space-y-6">
                <ShortcutSection title="Canvas & ToolMode" items={[
                  { keys: ['Tab'], desc: 'Chuyển đổi chế độ Select / Pan' },
                  { keys: ['Space (hold)'], desc: 'Giữ để dùng chế độ Pan tạm thời' },
                  { keys: ['+', '-', '0'], desc: 'Phóng to / Thu nhỏ / Reset 100%' },
                  { keys: ['Ctrl', 'S'], desc: 'Lưu workflow thủ công' },
                  { keys: ['Ctrl', 'K'], desc: 'Mở / đóng Sổ hướng dẫn' },
                ]} />
                <ShortcutSection title="Selection" items={[
                  { keys: ['Click'], desc: 'Chọn 1 node' },
                  { keys: ['Shift', 'Click'], desc: 'Thêm node vào danh sách chọn' },
                  { keys: ['Ctrl', 'A'], desc: 'Chọn tất cả node' },
                  { keys: ['Esc'], desc: 'Bỏ chọn tất cả' },
                ]} />
                <ShortcutSection title="Edit" items={[
                  { keys: ['Ctrl', 'C'], desc: 'Copy node đang chọn' },
                  { keys: ['Ctrl', 'V'], desc: 'Paste node' },
                  { keys: ['Delete'], desc: 'Xóa node đang chọn' },
                  { keys: ['Ctrl', 'Z'], desc: 'Hoàn tác (Undo)' },
                  { keys: ['Ctrl', 'Y'], desc: 'Làm lại (Redo)' },
                ]} />
              </div>
            )}

            {activeCategory === 'api' && (
              <div className="space-y-4 text-sm text-text-muted leading-relaxed">
                <p>FlowForge sử dụng <strong className="text-white">OpenRouter</strong> làm proxy API chính để kết nối với hàng trăm AI models khác nhau.</p>
                <div className="bg-white/5 p-4 rounded-xl border border-border-subtle mt-2">
                  <h4 className="font-semibold text-white mb-2">Cách lấy API Key miễn phí:</h4>
                  <ol className="list-decimal pl-4 space-y-2">
                    <li>Truy cập <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-accent-lime hover:underline">openrouter.ai</a> và tạo tài khoản.</li>
                    <li>Vào mục <strong>Keys</strong> và tạo một key mới.</li>
                    <li>Mở <kbd className="font-sans text-[10px] bg-white/10 px-1 py-0.5 rounded">Settings</kbd> trong FlowForge, dán key vào và lưu lại.</li>
                  </ol>
                </div>
                <p className="mt-4">
                  <strong>Các models miễn phí tốt nhất:</strong><br/>
                  - <code>nvidia/nemotron-nano-9b-v2:free</code><br/>
                  - <code>google/gemma-3-27b-it:free</code>
                </p>
              </div>
            )}

            {activeCategory === 'tips' && (
              <div className="space-y-4 text-sm text-text-muted leading-relaxed">
                <ul className="space-y-3 list-disc pl-4">
                  <li><strong>Tự động tải xuống:</strong> Bạn có thể bật <kbd className="font-sans text-[10px] bg-white/10 px-1 py-0.5 rounded">Auto Download</kbd> trong bảng Properties để FlowForge tự động tải kết quả về máy ngay khi AI sinh xong.</li>
                  <li><strong>Trích xuất PDF:</strong> Kéo thả file PDF vào Canvas để tạo File Node, sau đó nối với AI Text Gen Node để hỏi đáp về tài liệu.</li>
                  <li><strong>Chế độ Pan nhanh:</strong> Dù đang ở công cụ Select, bạn chỉ cần giữ phím Spacebar và kéo chuột để di chuyển vùng nhìn Canvas.</li>
                </ul>
              </div>
            )}

            {activeCategory === 'about' && (
              <div className="space-y-4 text-sm text-text-muted leading-relaxed flex flex-col items-center justify-center h-40">
                <div className="w-16 h-16 bg-gradient-to-br from-accent-lime to-green-500 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-accent-lime/20">
                  <SparklesIcon className="text-black" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">FlowForge</h3>
                <p>Node-based AI Workflow Builder</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Stack (Scissors above BookOpen) */}
      <div className="flex flex-col gap-3 items-end">
        {/* Video Editor Button (Scissors) */}
        <button
          onClick={() => setOpenVideoEditorNodeId(openVideoEditorNodeId ? null : 'global')}
          className={`pointer-events-auto w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            openVideoEditorNodeId 
              ? 'bg-black border-2 border-accent-lime text-accent-lime shadow-[0_0_20px_rgba(163,230,53,0.3)] scale-105' 
              : 'bg-accent-lime text-black shadow-xl hover:scale-105'
          }`}
          title="Video Editor Workstation"
        >
          <Scissors size={22} className={openVideoEditorNodeId ? 'animate-pulse' : ''} />
        </button>

        {/* Shortcut Guide Button (BookOpen) */}
        <button
          onClick={onToggle}
          className={`pointer-events-auto w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isOpen 
              ? 'bg-black border-2 border-accent-lime text-accent-lime shadow-[0_0_20px_rgba(163,230,53,0.3)]' 
              : 'bg-accent-lime text-black shadow-xl hover:scale-105'
          }`}
          title="Guide (Ctrl+K)"
        >
          <BookOpen size={22} className={isOpen ? 'animate-pulse' : ''} />
        </button>
      </div>
    </div>
  );
}

function ShortcutSection({ title, items }: { title: string, items: { keys: string[], desc: string }[] }) {
  return (
    <div className="mb-6">
      <h4 className="text-xs font-semibold text-accent-lime uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-text-muted">{item.desc}</span>
            <div className="flex items-center gap-1">
              {item.keys.map((k, j) => (
                <kbd key={j} className="inline-block px-2 py-0.5 rounded-md bg-white/10 border border-white/20 font-mono text-[11px] text-white shadow-[0_2px_0_rgba(0,0,0,0.4)]">
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  );
}
