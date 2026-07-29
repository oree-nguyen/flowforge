import { useEffect } from 'react';
import { type NodeProps } from '../NodeTypes';
import { canvasEngine, type EdgeData, type NodeData } from '../../engine/canvasEngine';
import type { VideoEditorData, VideoClipItem } from '../../types/nodes';
import { concatVideosWithFFmpeg, extractVideoThumbnail } from '../../services/ffmpegEngine';
import { Scissors, Video, Loader2, Play, CheckCircle2, Film, GripVertical, Trash2 } from 'lucide-react';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableClipCard({
  clip,
  index,
  onRemove,
}: {
  clip: VideoClipItem;
  index: number;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: clip.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group cursor-grab active:cursor-grabbing rounded-xl overflow-hidden border transition-all shrink-0 w-24 h-16 bg-black/80 flex flex-col justify-between p-1.5 ${
        isDragging ? 'border-rose-400 ring-2 ring-rose-500/50 shadow-xl' : 'border-border-subtle hover:border-rose-400/60'
      }`}
    >
      {/* Background Thumbnail */}
      {clip.thumbnailUrl ? (
        <img
          src={clip.thumbnailUrl}
          alt={`Clip ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 bg-canvas/60 flex items-center justify-center text-text-muted">
          <Film size={18} />
        </div>
      )}

      {/* Order Badge & Grip */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-500 text-white shadow-sm">
          #{index + 1}
        </span>
        <GripVertical size={12} className="text-white/70" />
      </div>

      {/* Hover Remove Button */}
      <div className="relative z-10 flex items-center justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(clip.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-rose-600/80 hover:bg-rose-600 text-white transition-opacity"
          title="Xóa clip này"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}

export function VideoEditorNode({ id, data, selected, onDisconnectStart }: NodeProps) {
  const nodeData = data as VideoEditorData;
  const clips = nodeData.clips || [];
  const customNodeName = data.nodeName as string;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Sync connected video inputs into clips list automatically
  useEffect(() => {
    const edges = canvasEngine.getEdges();
    const nodes = canvasEngine.getNodes();

    const inputEdges = edges.filter((e: EdgeData) => e.target === id && e.targetHandle === 'videos_in');
    let hasChanged = false;
    const currentClips = [...clips];

    // Filter out removed edges
    const validClips = currentClips.filter((c) => inputEdges.some((e: EdgeData) => e.id === c.id));
    if (validClips.length !== currentClips.length) {
      hasChanged = true;
    }

    // Add new connected edges
    inputEdges.forEach((edge: EdgeData) => {
      const existing = validClips.find((c) => c.id === edge.id);
      const sourceNode = nodes.find((n: NodeData) => n.id === edge.source);
      const sourceOutput = sourceNode?.data?.output || sourceNode?.data?.file || sourceNode?.data?.url;

      if (!existing && sourceOutput) {
        hasChanged = true;
        validClips.push({
          id: edge.id,
          sourceNodeId: edge.source,
          order: validClips.length,
          thumbnailUrl: '',
          videoUrl: String(sourceOutput),
        });

        // Extract thumbnail async
        extractVideoThumbnail(String(sourceOutput)).then((thumbUrl) => {
          const updatedClips = canvasEngine.getNode(id)?.data?.clips as VideoClipItem[];
          if (updatedClips) {
            const targetClip = updatedClips.find((c) => c.id === edge.id);
            if (targetClip) {
              targetClip.thumbnailUrl = thumbUrl;
              canvasEngine.updateNodeData(id, { clips: [...updatedClips] });
            }
          }
        });
      } else if (existing && sourceOutput && existing.videoUrl !== sourceOutput) {
        existing.videoUrl = String(sourceOutput);
        hasChanged = true;
      }
    });

    if (hasChanged) {
      canvasEngine.updateNodeData(id, { clips: validClips });
    }
  }, [id, clips.length]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = clips.findIndex((c) => c.id === active.id);
      const newIndex = clips.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(clips, oldIndex, newIndex).map((c, idx) => ({ ...c, order: idx }));
      canvasEngine.updateNodeData(id, { clips: reordered });
    }
  };

  const handleRemoveClip = (clipId: string) => {
    const filtered = clips.filter((c) => c.id !== clipId).map((c, idx) => ({ ...c, order: idx }));
    canvasEngine.updateNodeData(id, { clips: filtered });
  };

  const handleRunConcat = async () => {
    if (clips.length === 0) {
      alert('Chưa có video input nào được kết nối vào port videos_in.');
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
      canvasEngine.updateNodeData(id, {
        isConcatting: true,
        progressPercent: 5,
        progressMessage: 'Đang khởi chạy FFmpeg WASM...',
      });

      const outputUrl = await concatVideosWithFFmpeg(
        validVideoClips,
        nodeData.resolution || '720p',
        (pct, msg) => {
          canvasEngine.updateNodeData(id, { progressPercent: pct, progressMessage: msg });
        }
      );

      canvasEngine.updateNodeData(id, {
        isConcatting: false,
        output: outputUrl,
        progressMessage: 'Ghép video hoàn thành!',
      });
    } catch (err: any) {
      console.error('Concat Error:', err);
      alert(`Lỗi ghép video: ${err.message || err}`);
      canvasEngine.updateNodeData(id, { isConcatting: false });
    }
  };

  return (
    <div className="relative group">
      {/* Node Label above node */}
      <div className="absolute -top-6 left-0 text-xs font-medium text-text-primary flex items-center gap-2">
        <Scissors size={14} className="text-rose-400" /> Video Editor (Ghép phim)
      </div>

      {/* Main Node Card */}
      <div
        className={`w-[360px] bg-node rounded-2xl shadow-lg border relative flex flex-col overflow-hidden transition-all ${
          selected
            ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
            : 'border-border-subtle hover:border-rose-500/50'
        }`}
      >
        {/* Node Header */}
        <div className="px-4 py-3 bg-white/5 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-sm font-medium text-text-primary truncate">
              {customNodeName || 'Video Editor'}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/20 rounded text-rose-400 shrink-0">
            {clips.length} Clips
          </span>
        </div>

        {/* Top Preview Video Frame */}
        <div className="w-full aspect-video bg-black relative flex items-center justify-center border-b border-border-subtle overflow-hidden">
          {nodeData.output ? (
            <video
              src={nodeData.output}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-text-muted text-xs p-4 text-center">
              <Film size={28} className="text-rose-400/60" />
              <span>Khung xem trước video sau khi ghép</span>
              <span className="text-[10px] opacity-70">Bấm nút Run bên dưới để chạy FFmpeg WASM</span>
            </div>
          )}

          {/* Progress Overlay */}
          {nodeData.isConcatting && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white p-4 z-20">
              <Loader2 size={24} className="animate-spin text-rose-400" />
              <span className="text-xs font-medium text-center">{nodeData.progressMessage || 'FFmpeg Processing...'}</span>
              <div className="w-3/4 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/20">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                  style={{ width: `${nodeData.progressPercent || 10}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* CapCut Style Horizontal Clips Strip with Mouse Drag & Drop */}
        <div className="p-3 flex flex-col gap-2 bg-canvas/40">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-muted font-medium flex items-center gap-1">
              <Film size={12} className="text-rose-400" /> Thứ tự Phân cảnh (Kéo-thả chuột):
            </span>
            <span className="text-[10px] text-text-muted font-mono">{clips.length} phân cảnh</span>
          </div>

          {clips.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={clips.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 pt-1 min-h-[76px]">
                  {clips
                    .sort((a, b) => a.order - b.order)
                    .map((clip, idx) => (
                      <SortableClipCard
                        key={clip.id}
                        clip={clip}
                        index={idx}
                        onRemove={handleRemoveClip}
                      />
                    ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="p-3 border border-dashed border-border-subtle rounded-xl text-[11px] text-text-muted text-center italic">
              Nối 1 hoặc nhiều video input vào port videos_in bên trái
            </div>
          )}

          {/* Action Trigger Button */}
          <button
            onClick={handleRunConcat}
            disabled={nodeData.isConcatting || clips.length === 0}
            className="w-full mt-1 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-md transition-all text-xs"
          >
            {nodeData.isConcatting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : nodeData.output ? (
              <CheckCircle2 size={14} />
            ) : (
              <Play size={14} />
            )}
            <span>{nodeData.output ? 'Ghép lại Video (FFmpeg)' : 'Ghép Video (Run Editor)'}</span>
          </button>
        </div>
      </div>

      {/* Input Ports (Left) - Multi Connection Target */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-2 pr-2.5 z-20">
        <div
          className="port-handle w-8 h-8 rounded-full border border-rose-400/50 bg-panel flex items-center justify-center text-rose-400 hover:text-rose-300 hover:border-rose-300 cursor-crosshair shadow-md"
          title="Video Inputs (videos_in - Nhận nhiều kết nối)"
          data-target={`${id}:videos_in`}
          data-portid="videos_in"
          onPointerDown={(e) => {
            e.stopPropagation();
            onDisconnectStart?.(e, id, 'videos_in');
          }}
        >
          <Video size={14} />
        </div>
      </div>

      {/* Output Port (Right) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-2 pl-2.5 z-20">
        <div
          className="port-handle w-8 h-8 rounded-full border border-emerald-400/50 bg-panel flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:border-emerald-300 cursor-crosshair shadow-md"
          title="Concatenated Video Output (video_out)"
          data-target={`${id}:video_out`}
          data-portid="video_out"
          onPointerDown={(e) => {
            e.stopPropagation();
            onDisconnectStart?.(e, id, 'video_out');
          }}
        >
          <Video size={14} />
        </div>
      </div>

      {/* Node Mention Tag */}
      {customNodeName && (
        <div className="absolute -bottom-6 left-0 text-[10px] font-medium text-text-muted flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            @
          </div>
          <span className="text-white font-mono">{customNodeName}</span>
        </div>
      )}
    </div>
  );
}
