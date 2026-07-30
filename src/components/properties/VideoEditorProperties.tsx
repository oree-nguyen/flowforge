import { useSyncExternalStore } from 'react';
import { canvasEngine } from '../../engine/canvasEngine';
import { concatVideosWithFFmpeg } from '../../services/ffmpegEngine';
import type { VideoEditorData } from '../../types/nodes';
import { Scissors, Film, Loader2, Play, CheckCircle2, Download } from 'lucide-react';

export function VideoEditorProperties({ nodeId }: { nodeId: string }) {
  const node = useSyncExternalStore(
    (cb) => canvasEngine.subscribe(cb),
    () => canvasEngine.getNode(nodeId)
  );

  if (!node) return null;
  const data = node.data as VideoEditorData;
  const clips = data.clips || [];
  const resolution = data.resolution || '720p';
  const isConcatting = !!data.isConcatting;

  const handleChange = (key: string, value: any) => {
    canvasEngine.updateNodeData(nodeId, { [key]: value });
  };

  const handleRunConcat = async () => {
    if (clips.length === 0) {
      alert('Chưa có video input nào được kết nối.');
      return;
    }

    const validVideoClips = clips
      .filter((c) => !!c.videoUrl)
      .sort((a, b) => a.order - b.order)
      .map((c) => ({ url: c.videoUrl as string, id: c.id }));

    if (validVideoClips.length === 0) {
      alert('Các video kết nối chưa có dữ liệu output.');
      return;
    }

    try {
      canvasEngine.updateNodeData(nodeId, {
        isConcatting: true,
        progressPercent: 5,
        progressMessage: 'Đang khởi chạy FFmpeg WASM...',
      });

      const outputUrl = await concatVideosWithFFmpeg(
        validVideoClips,
        resolution,
        (pct, msg) => {
          canvasEngine.updateNodeData(nodeId, { progressPercent: pct, progressMessage: msg });
        }
      );

      canvasEngine.updateNodeData(nodeId, {
        isConcatting: false,
        output: outputUrl,
        progressMessage: 'Ghép video hoàn thành!',
      });
    } catch (err: any) {
      console.error('Concat Error:', err);
      alert(`Lỗi ghép video: ${err.message || err}`);
      canvasEngine.updateNodeData(nodeId, { isConcatting: false });
    }
  };

  return (
    <div className="flex flex-col p-4 gap-5 text-xs text-text-primary">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
        <Scissors size={18} className="text-rose-400" />
        <div>
          <h3 className="font-semibold text-sm">Video Editor (Dựng & Ghép Phim)</h3>
          <p className="text-[10px] text-text-muted">Chuẩn hóa & ghép nối nhiều phân cảnh bằng FFmpeg WASM</p>
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

      {/* Aspect Ratio Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-muted font-medium">Tỉ lệ khung hình Canvas (Aspect Ratio)</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: '16:9', label: '16:9' },
            { id: '9:16', label: '9:16' },
            { id: '1:1', label: '1:1' },
            { id: '4:5', label: '4:5' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => handleChange('canvas', { ...(data.canvas || {}), aspectRatio: r.id })}
              className={`py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
                (data.canvas?.aspectRatio || '16:9') === r.id
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                  : 'bg-canvas border-border-subtle text-text-muted hover:border-white/20'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Background Fill Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-muted font-medium">Màu nền khung Canvas (Background Fill)</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'black', label: 'Đen (Mặc định)' },
            { id: 'blur', label: 'Mờ (Blur)' },
            { id: '#18181b', label: 'Xám Đen' },
          ].map((bg) => (
            <button
              key={bg.id}
              onClick={() => handleChange('canvas', { ...(data.canvas || { aspectRatio: '16:9' }), backgroundFill: bg.id })}
              className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                (data.canvas?.backgroundFill || 'black') === bg.id
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                  : 'bg-canvas border-border-subtle text-text-muted hover:border-white/20'
              }`}
            >
              {bg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resolution Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-muted font-medium">Độ phân giải đầu ra (Resolution)</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: '720p', label: '720p HD (Nhanh)' },
            { id: '1080p', label: '1080p Full HD' },
          ].map((res) => (
            <button
              key={res.id}
              onClick={() => handleChange('resolution', res.id)}
              className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                resolution === res.id
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                  : 'bg-canvas border-border-subtle text-text-muted hover:border-white/20'
              }`}
            >
              {res.label}
            </button>
          ))}
        </div>
      </div>

      {/* Connected Clips List overview */}
      <div className="flex flex-col gap-2 p-3 bg-canvas/40 border border-border-subtle rounded-xl">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-rose-400 flex items-center gap-1">
            <Film size={14} /> Danh sách phân cảnh ({clips.length})
          </span>
          <span className="text-[10px] text-text-muted">Kéo-thả chuột trên card node</span>
        </div>

        {clips.length > 0 ? (
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
            {clips
              .sort((a, b) => a.order - b.order)
              .map((c, idx) => (
                <div
                  key={c.id}
                  className="p-2 bg-panel border border-border-subtle rounded-lg flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded">
                      #{idx + 1}
                    </span>
                    <span className="text-xs truncate font-mono text-text-muted">
                      {c.sourceNodeId}
                    </span>
                  </div>
                  {c.thumbnailUrl && (
                    <img src={c.thumbnailUrl} alt="" className="w-8 h-5 object-cover rounded shrink-0 border border-white/10" />
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="text-[11px] text-text-muted italic text-center p-2">
            Chưa nối video input nào vào port videos_in
          </div>
        )}
      </div>

      {/* Run Concatenation Trigger */}
      <button
        onClick={handleRunConcat}
        disabled={isConcatting || clips.length === 0}
        className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all text-xs"
      >
        {isConcatting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>FFmpeg: {data.progressMessage || 'Đang xử lý...'}</span>
          </>
        ) : data.output ? (
          <>
            <CheckCircle2 size={14} />
            <span>Ghép lại Video (FFmpeg)</span>
          </>
        ) : (
          <>
            <Play size={14} />
            <span>Ghép Video (Run Editor)</span>
          </>
        )}
      </button>

      {/* Output Download Link if available */}
      {data.output && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
          <span className="text-xs text-emerald-300 font-medium">Video đã ghép hoàn tất</span>
          <a
            href={data.output}
            download="concatenated_video.mp4"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Download size={12} /> Tải Video
          </a>
        </div>
      )}
    </div>
  );
}
