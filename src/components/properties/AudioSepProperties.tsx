import { Activity } from 'lucide-react';
import { canvasEngine } from '../../engine/canvasEngine';

export function AudioSepProperties({ nodeId }: { nodeId: string }) {
  const node = canvasEngine.getNode(nodeId);
  if (!node) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Settings Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-text-primary" />
          <h3 className="text-sm font-semibold text-text-primary tracking-[-0.01em]">Separation Settings</h3>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Model Type</label>
            <div className="bg-surface-2 border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary">
              HTDemucs ONNX (Local)
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              Mô hình chạy trực tiếp trên trình duyệt, có thể tốn tài nguyên và thời gian tải lần đầu.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-border-hairline" />

      {/* Output Configuration */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium text-text-muted">Output Stems</label>
        <div className="bg-surface-2 border border-border-subtle rounded-xl p-3 flex flex-col gap-2">
           <div className="flex items-center justify-between">
              <span className="text-xs text-text-primary">Vocals</span>
              <span className="text-[10px] bg-accent-lime/20 text-accent-lime px-2 py-0.5 rounded-full font-medium">Enabled</span>
           </div>
           <div className="flex items-center justify-between">
              <span className="text-xs text-text-primary">Instrumental (Drums + Bass + Other)</span>
              <span className="text-[10px] bg-accent-lime/20 text-accent-lime px-2 py-0.5 rounded-full font-medium">Enabled</span>
           </div>
        </div>
      </div>
      
    </div>
  );
}
