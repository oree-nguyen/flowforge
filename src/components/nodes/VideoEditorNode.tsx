import { useState, useEffect, useRef } from 'react';
import { type NodeProps } from '../NodeTypes';
import { canvasEngine, type EdgeData, type NodeData } from '../../engine/canvasEngine';
import type { VideoEditorData, VideoClipItem, ClipTransform } from '../../types/nodes';
import { concatVideosWithFFmpeg, extractVideoThumbnail } from '../../services/ffmpegEngine';
import { separateVocalsAndInstrumental } from '../../services/vocalSeparator';
import {
  Scissors,
  Video,
  Loader2,
  Play,
  Pause,
  CheckCircle2,
  Film,
  GripVertical,
  Trash2,
  AudioWaveform,
  Volume2,
  Sparkles,
  Layers,
  FileText,
  Sliders,
  RotateCw,
  Maximize2
} from 'lucide-react';

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
  isSelected,
  onSelect,
  onRemove,
}: {
  clip: VideoClipItem;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
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
      onClick={() => onSelect(clip.id)}
      className={`relative group cursor-grab active:cursor-grabbing rounded-xl overflow-hidden border transition-all shrink-0 w-24 h-16 bg-black/80 flex flex-col justify-between p-1.5 ${
        isSelected
          ? 'border-rose-400 ring-2 ring-rose-500/50 shadow-xl'
          : isDragging
          ? 'border-rose-400 ring-2 ring-rose-500/50 shadow-xl'
          : 'border-border-subtle hover:border-rose-400/60'
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

export function VideoEditorNode({ id, data, selected, onConnectStart, onDisconnectStart }: NodeProps) {
  const nodeData = data as VideoEditorData;
  const clips = nodeData.clips || [];
  const customNodeName = data.nodeName as string;

  const [selectedClipId, setSelectedClipId] = useState<string>(clips[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Active clip transform (Scale, OffsetX, OffsetY, Rotation)
  const transforms = nodeData.clipTransforms || [];
  const activeTransform = transforms.find((t) => t.clipId === selectedClipId) || {
    clipId: selectedClipId,
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
    rotationDeg: 0,
  };

  const canvasSettings = nodeData.canvas || {
    aspectRatio: '16:9',
    backgroundFill: 'black',
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Sync connected video inputs into clips list automatically & populate Dubbing/Sub tracks
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

    // Add new connected edges & check for Dubbing/Sub node connections
    let subtitleTrack: any[] = [];
    let dubAudioTrack: any[] = [];

    inputEdges.forEach((edge: EdgeData) => {
      const existing = validClips.find((c) => c.id === edge.id);
      const sourceNode = nodes.find((n: NodeData) => n.id === edge.source);
      const sourceOutput = sourceNode?.data?.output || sourceNode?.data?.outputVideo || sourceNode?.data?.file || sourceNode?.data?.url;

      // Extract Dubbing/Sub tracks if connected from a Dubbing/Sub node
      if (sourceNode?.type === 'ai.dubSub') {
        const segments = sourceNode.data?.segments as any[];
        if (segments && Array.isArray(segments)) {
          subtitleTrack = segments.map((s) => ({
            start: s.start,
            end: s.end,
            text: s.text,
          }));
        }
        if (sourceNode.data?.outputVideo) {
          dubAudioTrack.push({
            start: 0,
            end: 10,
            audioUrl: sourceNode.data.outputVideo,
          });
        }
      }

      if (!existing && sourceOutput) {
        hasChanged = true;
        validClips.push({
          id: edge.id,
          sourceNodeId: edge.source,
          order: validClips.length,
          thumbnailUrl: '',
          videoUrl: String(sourceOutput),
          volume: 100,
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
      canvasEngine.updateNodeData(id, {
        clips: validClips,
        subtitleTrack: subtitleTrack.length > 0 ? subtitleTrack : nodeData.subtitleTrack,
        dubAudioTrack: dubAudioTrack.length > 0 ? dubAudioTrack : nodeData.dubAudioTrack,
      });
      if (!selectedClipId && validClips.length > 0) {
        setSelectedClipId(validClips[0].id);
      }
    }
  }, [id, clips.length]);

  const updateActiveTransform = (partial: Partial<ClipTransform>) => {
    const currentTransforms = [...(nodeData.clipTransforms || [])];
    const index = currentTransforms.findIndex((t) => t.clipId === selectedClipId);
    const updated = { ...activeTransform, ...partial, clipId: selectedClipId };

    if (index >= 0) {
      currentTransforms[index] = updated;
    } else {
      currentTransforms.push(updated);
    }
    canvasEngine.updateNodeData(id, { clipTransforms: currentTransforms });
  };

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
    if (selectedClipId === clipId) {
      setSelectedClipId(filtered[0]?.id || '');
    }
  };

  // Split Clip at current playhead
  const handleSplitClip = () => {
    if (!selectedClipId) return;
    const targetClip = clips.find((c) => c.id === selectedClipId);
    if (!targetClip) return;

    const newClipId = `clip_split_${Date.now()}`;
    const newClip: VideoClipItem = {
      ...targetClip,
      id: newClipId,
      order: targetClip.order + 1,
    };

    const newClips = [...clips];
    newClips.splice(targetClip.order + 1, 0, newClip);
    const reordered = newClips.map((c, idx) => ({ ...c, order: idx }));
    canvasEngine.updateNodeData(id, { clips: reordered });
    setSelectedClipId(newClipId);
  };

  // Extract Vocal & Instrumental Audio
  const handleExtractAudio = async () => {
    const activeClip = clips.find((c) => c.id === selectedClipId) || clips[0];
    if (!activeClip?.videoUrl) {
      alert('Vui lòng chọn clip có video hợp lệ để tách âm thanh.');
      return;
    }

    try {
      canvasEngine.updateNodeData(id, {
        isSeparatingAudio: true,
        progressPercent: 10,
        progressMessage: 'Đang khởi chạy công cụ tách âm thanh...',
      });

      const response = await fetch(activeClip.videoUrl);
      const audioBlob = await response.blob();

      const result = await separateVocalsAndInstrumental(audioBlob, (pct, msg) => {
        canvasEngine.updateNodeData(id, { progressPercent: pct, progressMessage: msg });
      });

      canvasEngine.updateNodeData(id, {
        isSeparatingAudio: false,
        vocalSeparationEngine: result.engineUsed,
        separatedVocalsUrl: result.vocalsUrl,
        separatedInstrumentalUrl: result.instrumentalUrl,
        progressMessage: 'Tách âm thanh hoàn thành!',
      });
    } catch (err: any) {
      console.error('Vocal separation error:', err);
      alert(`Lỗi tách âm thanh: ${err.message || err}`);
      canvasEngine.updateNodeData(id, { isSeparatingAudio: false });
    }
  };

  const handleRunConcat = async () => {
    if (clips.length === 0) {
      alert('Chưa có video input nào được kết nối vào port videos_in.');
      return;
    }

    const validVideoClips = clips
      .filter((c) => !!c.videoUrl)
      .sort((a, b) => a.order - b.order)
      .map((c) => {
        const tr = (nodeData.clipTransforms || []).find((t) => t.clipId === c.id);
        return { url: c.videoUrl as string, id: c.id, transform: tr, volume: c.volume || 100 };
      });

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
        canvasSettings.aspectRatio,
        canvasSettings.backgroundFill,
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

  const activeClip = clips.find((c) => c.id === selectedClipId) || clips[0];
  const activeVideoUrl = nodeData.output || activeClip?.videoUrl;

  return (
    <div className="relative group">
      {/* Node Label above node */}
      <div className="absolute -top-6 left-0 text-xs font-medium text-text-primary flex items-center gap-2">
        <Scissors size={14} className="text-rose-400" /> CapCut Workstation (3 Khung & Tách Giọng)
      </div>

      {/* Main Node Workstation Frame */}
      <div
        className={`w-[480px] bg-node rounded-2xl shadow-2xl border relative flex flex-col overflow-hidden transition-all ${
          selected
            ? 'border-rose-500 shadow-[0_0_24px_rgba(244,63,94,0.25)]'
            : 'border-border-subtle hover:border-rose-500/50'
        }`}
      >
        {/* Workstation Header */}
        <div className="px-4 py-2.5 bg-white/5 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xs font-semibold text-text-primary truncate">
              {customNodeName || 'Video Editor Pro'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* AI vs DSP Quality Badge */}
            {nodeData.vocalSeparationEngine && (
              <span
                className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                  nodeData.vocalSeparationEngine === 'htdemucs_onnx'
                    ? 'bg-accent-lime/20 border-accent-lime/40 text-accent-lime'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                }`}
                title={
                  nodeData.vocalSeparationEngine === 'htdemucs_onnx'
                    ? 'Tách âm thanh bằng Mô hình AI HTDemucs (Chất lượng cao)'
                    : 'Tách âm thanh bằng Bộ lọc DSP Filter (Chất lượng Cơ bản)'
                }
              >
                {nodeData.vocalSeparationEngine === 'htdemucs_onnx' ? '✨ AI HTDemucs' : '⚡ DSP Filter'}
              </span>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/20 rounded text-rose-400">
              {clips.length} Clips
            </span>
          </div>
        </div>

        {/* 3-Frame Workstation Grid Layout */}
        <div className="flex flex-col">
          {/* TOP SECTION: Frame 1 (Canvas Preview - Left) + Frame 3 (Toolbox Panel - Right) */}
          <div className="grid grid-cols-12 border-b border-border-subtle">
            {/* Frame 1: Canvas Preview (Col 8) */}
            <div className="col-span-8 p-3 border-r border-border-subtle flex flex-col gap-2 bg-canvas/60">
              {/* Aspect Ratio Pills */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-text-muted font-medium flex items-center gap-1">
                  <Maximize2 size={11} className="text-rose-400" /> Tỉ lệ Frame:
                </span>
                <div className="flex items-center gap-1">
                  {(['16:9', '9:16', '1:1', '4:5'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() =>
                        canvasEngine.updateNodeData(id, {
                          canvas: { ...canvasSettings, aspectRatio: ratio },
                        })
                      }
                      className={`px-1.5 py-0.5 rounded font-mono transition-all ${
                        canvasSettings.aspectRatio === ratio
                          ? 'bg-rose-500 text-white font-bold'
                          : 'bg-white/5 text-text-muted hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Preview Box with Canvas Ratio & Interactive Transform */}
              <div className="w-full aspect-video bg-black rounded-xl relative flex items-center justify-center overflow-hidden border border-border-subtle group/canvas">
                {activeVideoUrl ? (
                  <div
                    className="w-full h-full flex items-center justify-center transition-transform"
                    style={{
                      transform: `scale(${activeTransform.scale}) translate(${activeTransform.offsetX}%, ${activeTransform.offsetY}%) rotate(${activeTransform.rotationDeg}deg)`,
                    }}
                  >
                    <video
                      ref={videoRef}
                      src={activeVideoUrl}
                      className="max-w-full max-h-full object-contain"
                      onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                      onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-text-muted text-[11px] p-4 text-center">
                    <Film size={24} className="text-rose-400/60" />
                    <span>Xem trước Canvas CapCut</span>
                  </div>
                )}

                {/* Progress Overlay */}
                {(nodeData.isConcatting || nodeData.isSeparatingAudio) && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white p-4 z-30">
                    <Loader2 size={22} className="animate-spin text-rose-400" />
                    <span className="text-xs font-medium text-center">{nodeData.progressMessage || 'Processing...'}</span>
                    <div className="w-3/4 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/20">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                        style={{ width: `${nodeData.progressPercent || 10}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Play Controls & Scrubber */}
              <div className="flex items-center gap-2 pt-1 text-[11px]">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      if (isPlaying) videoRef.current.pause();
                      else videoRef.current.play();
                      setIsPlaying(!isPlaying);
                    }
                  }}
                  className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => {
                    const t = parseFloat(e.target.value);
                    if (videoRef.current) videoRef.current.currentTime = t;
                    setCurrentTime(t);
                  }}
                  className="flex-1 accent-rose-500 h-1 bg-white/10 rounded cursor-pointer"
                />
                <span className="font-mono text-[9px] text-text-muted">
                  {currentTime.toFixed(1)}s / {(duration || 0).toFixed(1)}s
                </span>
              </div>
            </div>

            {/* Frame 3: Toolbox Panel (Col 4 - Right) */}
            <div className="col-span-4 p-3 flex flex-col gap-3 bg-panel/60">
              <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-1 border-b border-border-subtle pb-1">
                <Sliders size={12} className="text-rose-400" /> Toolbox CapCut
              </span>

              {/* Split Clip Button */}
              <button
                onClick={handleSplitClip}
                disabled={!selectedClipId}
                className="w-full py-1.5 px-2 bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-border-subtle rounded-lg text-[10px] text-white font-medium flex items-center gap-1.5 transition-colors"
              >
                <Scissors size={12} className="text-rose-400" /> Cắt Clip (Split)
              </button>

              {/* Extract Audio Button */}
              <button
                onClick={handleExtractAudio}
                disabled={nodeData.isSeparatingAudio}
                className="w-full py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <AudioWaveform size={12} className="text-amber-400" /> Tách Giọng Nói (Stem)
              </button>

              {/* Volume Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <Volume2 size={11} /> Volume Clip
                  </span>
                  <span className="font-mono">{activeClip?.volume || 100}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={activeClip?.volume || 100}
                  onChange={(e) => {
                    const vol = parseInt(e.target.value, 10);
                    const updated = clips.map((c) => (c.id === selectedClipId ? { ...c, volume: vol } : c));
                    canvasEngine.updateNodeData(id, { clips: updated });
                  }}
                  className="w-full accent-rose-500 h-1 bg-white/10 rounded cursor-pointer"
                />
              </div>

              {/* Transform Adjustment (Scale & Rotation) */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-border-subtle">
                <div className="flex items-center justify-between text-[10px] text-text-muted">
                  <span>Zoom Layer</span>
                  <span className="font-mono">{activeTransform.scale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={3.0}
                  step={0.05}
                  value={activeTransform.scale}
                  onChange={(e) => updateActiveTransform({ scale: parseFloat(e.target.value) })}
                  className="w-full accent-rose-500 h-1 bg-white/10 rounded cursor-pointer"
                />

                <div className="flex items-center justify-between text-[10px] text-text-muted mt-1">
                  <span className="flex items-center gap-1">
                    <RotateCw size={10} /> Xoay Góc
                  </span>
                  <span className="font-mono">{activeTransform.rotationDeg}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={5}
                  value={activeTransform.rotationDeg}
                  onChange={(e) => updateActiveTransform({ rotationDeg: parseInt(e.target.value, 10) })}
                  className="w-full accent-rose-500 h-1 bg-white/10 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: Frame 2 (Multi-track Timeline - Below) */}
          <div className="p-3 bg-canvas/40 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted font-medium flex items-center gap-1">
                <Layers size={12} className="text-rose-400" /> Multi-track Timeline:
              </span>
              <span className="text-[10px] text-text-muted font-mono">{clips.length} phân cảnh</span>
            </div>

            {/* Track 1: Video Clips */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-text-muted">TRACK 1 — VIDEO CLIPS</span>
              {clips.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={clips.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 pt-1 min-h-[72px]">
                      {clips
                        .sort((a, b) => a.order - b.order)
                        .map((clip, idx) => (
                          <SortableClipCard
                            key={clip.id}
                            clip={clip}
                            index={idx}
                            isSelected={clip.id === selectedClipId}
                            onSelect={setSelectedClipId}
                            onRemove={handleRemoveClip}
                          />
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="p-2 border border-dashed border-border-subtle rounded-xl text-[10px] text-text-muted text-center italic">
                  Nối video input vào port videos_in bên trái
                </div>
              )}
            </div>

            {/* Track 2: Subtitles */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[9px] font-mono text-text-muted flex items-center gap-1">
                <FileText size={10} className="text-purple-400" /> TRACK 2 — SUBTITLES
              </span>
              {nodeData.subtitleTrack && nodeData.subtitleTrack.length > 0 ? (
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
                  {nodeData.subtitleTrack.map((sub, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded text-[9px] font-mono text-purple-300 truncate max-w-[120px] shrink-0"
                      title={sub.text}
                    >
                      {sub.text}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-2 py-1 bg-white/5 rounded text-[9px] text-text-muted italic">
                  Chưa có dữ liệu sub (Nối từ node Dubbing/Sub)
                </div>
              )}
            </div>

            {/* Track 3: Dubbed Audio */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[9px] font-mono text-text-muted flex items-center gap-1">
                <Sparkles size={10} className="text-amber-400" /> TRACK 3 — LỒNG TIẾNG (TTS)
              </span>
              {nodeData.dubAudioTrack && nodeData.dubAudioTrack.length > 0 ? (
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
                  {nodeData.dubAudioTrack.map((dub, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded text-[9px] font-mono text-amber-300 shrink-0"
                    >
                      🔊 Dubbed Audio #{idx + 1}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-2 py-1 bg-white/5 rounded text-[9px] text-text-muted italic">
                  Chưa có dữ liệu lồng tiếng (Nối từ node Dubbing/Sub)
                </div>
              )}
            </div>

            {/* Action Trigger Button */}
            <button
              onClick={handleRunConcat}
              disabled={nodeData.isConcatting || clips.length === 0}
              className="w-full mt-2 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-md transition-all text-xs"
            >
              {nodeData.isConcatting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : nodeData.output ? (
                <CheckCircle2 size={14} />
              ) : (
                <Play size={14} />
              )}
              <span>{nodeData.output ? 'Ghép lại Video (FFmpeg CapCut)' : 'Ghép Video (Run Workstation)'}</span>
            </button>
          </div>
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
            onConnectStart?.(e, id, 'out');
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
