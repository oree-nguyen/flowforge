import { useSyncExternalStore } from 'react';
import { canvasEngine } from '../../engine/canvasEngine';
import { useWorkflowStore } from '../../store/workflowStore';
import type { VideoEditorData } from '../../types/nodes';
import { Scissors, Film, Maximize2 } from 'lucide-react';

export function VideoEditorProperties({ nodeId }: { nodeId: string }) {
  const node = useSyncExternalStore(
    (cb) => canvasEngine.subscribe(cb),
    () => canvasEngine.getNode(nodeId)
  );

  const setOpenVideoEditorNodeId = useWorkflowStore((state) => state.setOpenVideoEditorNodeId);

  if (!node) return null;
  const data = node.data as VideoEditorData;
  const clips = data.clips || [];

  const handleChange = (key: string, value: any) => {
    canvasEngine.updateNodeData(nodeId, { [key]: value });
  };

  return (
    <div className="flex flex-col p-4 gap-5 text-xs text-text-primary">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
        <Scissors size={18} className="text-rose-400" />
        <div>
          <h3 className="font-semibold text-sm">Video Editor (Dựng Phim)</h3>
          <p className="text-[10px] text-text-muted">Quản lý phân cảnh & xuất video đa luồng</p>
        </div>
      </div>

      {/* Node Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-muted flex items-center gap-1">
          <span>🏷️</span> Tên Node <span className="text-[10px] bg-white/10 px-1 rounded">@Slug (@mention)</span>
        </label>
        <input
          className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-rose-500"
          placeholder="Video Editor"
          value={(data.nodeName as string) || ''}
          onChange={(e) => handleChange('nodeName', e.target.value)}
        />
      </div>

      {/* Open Workspace Action Card */}
      <div className="flex flex-col gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-rose-300 flex items-center gap-1.5">
            <Film size={14} /> Video Workstation ({clips.length} Clips)
          </span>
        </div>
        <p className="text-[11px] text-text-muted leading-relaxed">
          Mở bảng điều khiển chuyên sâu bên phải để chỉnh sửa Timeline đa luồng, cắt ghép phân cảnh & tách giọng AI.
        </p>
        <button
          onClick={() => setOpenVideoEditorNodeId(nodeId)}
          className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all text-xs cursor-pointer"
        >
          <Maximize2 size={14} />
          <span>Mở Panel Video Editor</span>
        </button>
      </div>

      {/* Resolution Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-muted font-medium">Độ phân giải mặc định (Resolution)</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: '720p', label: '720p HD' },
            { id: '1080p', label: '1080p Full HD' },
          ].map((res) => (
            <button
              key={res.id}
              onClick={() => handleChange('resolution', res.id)}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                (data.resolution || '720p') === res.id
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                  : 'bg-canvas border-border-subtle text-text-muted hover:border-white/20'
              }`}
            >
              {res.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
