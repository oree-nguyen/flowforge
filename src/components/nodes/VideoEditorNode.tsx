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
  Maximize2,
  Music
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
      className={`relative group cursor-grab active:cursor-grabbing rounded-[10px] overflow-hidden border transition-all shrink-0 w-24 h-11 bg-black/80 flex flex-col justify-between p-1.5 ${
        isSelected
          ? 'border-rose-400 ring-2 ring-rose-500/50 shadow-xl'
          : isDragging
          ? 'border-rose-400 ring-2 ring-rose-500/50 shadow-xl'
          : 'border-white/10 hover:border-rose-400/60'
      }`}
    >
      {/* Background Thumbnail */}
      {clip.thumbnailUrl ? (
        <img
          src={clip.thumbnailUrl}
          alt={`Clip ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 bg-canvas/80 flex items-center justify-center text-text-muted">
          <Film size={16} />
        </div>
      )}

      {/* Order Badge & Grip */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[9px] font-bold font-mono px-1 py-0.2 rounded bg-rose-600/90 text-white shadow-sm">
          #{index + 1}
        </span>
        <GripVertical size={11} className="text-white/80 drop-shadow" />
      </div>

      {/* Hover Remove Button */}
      <div className="relative z-10 flex items-center justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(clip.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-rose-600/90 hover:bg-rose-600 text-white transition-opacity"
          title="Xóa clip này"
        >
          <Trash2 size={9} />
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

  // --- CapCut Timeline Ruler & Playhead Logic ---
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  const totalDuration = Math.max(duration || 0, 30); // 30s minimum axis
  const playheadPercent = Math.max(0, Math.min(100, (currentTime / totalDuration) * 100));

  // Time Ticks (00:00, 00:05, 00:10, 00:15...)
  const timeTicks = Array.from({ length: Math.floor(totalDuration / 5) + 1 }, (_, i) => {
    const sec = i * 5;
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const label = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return { sec, label };
  });

  const handleRulerScrub = (clientX: number) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, offsetX / rect.width));
    const targetTime = pct * totalDuration;
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  useEffect(() => {
    if (!isDraggingPlayhead) return;

    const handlePointerMove = (e: PointerEvent) => {
      handleRulerScrub(e.clientX);
    };

    const handlePointerUp = () => {
      setIsDraggingPlayhead(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingPlayhead, totalDuration]);

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
            end: Math.max(10, (segments?.[segments.length - 1]?.end || 10)),
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
                  className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors shrink-0"
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
                <span className="font-mono text-[9px] text-text-muted shrink-0">
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

          {/* BOTTOM SECTION: Frame 2 (Exact CapCut Multi-track Timeline - Below) */}
          <div className="p-3 bg-canvas/60 flex flex-col gap-3 relative select-none">
            {/* Timeline Title Bar */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-primary font-bold flex items-center gap-1.5">
                <Layers size={13} className="text-rose-400" /> CapCut Multi-track Timeline ({clips.length} clips)
              </span>
              <span className="text-[10px] font-mono text-text-muted">
                {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
              </span>
            </div>

            {/* Time Axis Container with Ruler & Playhead */}
            <div
              ref={timelineRef}
              className="relative overflow-x-auto custom-scrollbar pb-2 pt-1 flex flex-col gap-2 min-w-full cursor-pointer"
              onPointerDown={(e) => handleRulerScrub(e.clientX)}
            >
              {/* 1. TOP RULER (Thước thời gian) */}
              <div className="relative h-6 w-full min-w-[420px] border-b border-border-subtle/60 flex items-end pb-1 bg-white/[0.02] rounded-t-lg">
                {timeTicks.map((tick) => (
                  <div
                    key={tick.sec}
                    className="absolute bottom-0 flex flex-col items-center transform -translate-x-1/2"
                    style={{ left: `${(tick.sec / totalDuration) * 100}%` }}
                  >
                    <span className="text-[8px] font-mono text-text-muted/80">{tick.label}</span>
                    <div className="w-[1px] h-1.5 bg-white/20 mt-0.5" />
                  </div>
                ))}
              </div>

              {/* 2. PLAYHEAD (Kim thời gian + Tay cầm Giọt nước lộn ngược) */}
              <div
                className="absolute top-0 bottom-0 z-30 pointer-events-auto cursor-ew-resize flex flex-col items-center group/playhead"
                style={{ left: `${playheadPercent}%` }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingPlayhead(true);
                }}
              >
                {/* Inverted Teardrop SVG Handle (Con trỏ giọt nước lộn ngược) */}
                <svg
                  width="14"
                  height="16"
                  viewBox="0 0 14 16"
                  fill="currentColor"
                  className="text-white drop-shadow-md -mb-1 group-hover/playhead:scale-115 transition-transform"
                >
                  <path d="M 1,4.5 C 1,2 3.7,0 7,0 C 10.3,0 13,2 13,4.5 C 13,8 7,16 7,16 C 7,16 1,8 1,4.5 Z" />
                  <circle cx="7" cy="4.5" r="2" fill="#000000" />
                </svg>
                {/* Vertical Playhead Line spanning all 3 tracks */}
                <div className="w-[2px] flex-1 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
              </div>

              {/* 3. TRACKS CONTAINER (3 Track xếp chồng cùng 1 trục thời gian) */}
              <div className="relative flex flex-col gap-2 w-full min-w-[420px]">
                {/* --- TRACK 1: SUBTITLE (Phụ đề - Màu Cam #F97316) --- */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px] font-mono text-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" /> TRACK 1 — SUBTITLES
                    </span>
                  </div>
                  <div className="relative h-7 w-full bg-white/[0.03] rounded-lg border border-white/5 flex items-center px-1">
                    {nodeData.subtitleTrack && nodeData.subtitleTrack.length > 0 ? (
                      nodeData.subtitleTrack.map((sub, idx) => {
                        const leftPct = (sub.start / totalDuration) * 100;
                        const widthPct = Math.max(3, ((sub.end - sub.start) / totalDuration) * 100);
                        return (
                          <div
                            key={idx}
                            className="absolute top-1 bottom-1 bg-[#F97316] text-white rounded-[8px] px-2 flex items-center gap-1 shadow-sm text-[10px] font-bold truncate group/sub hover:brightness-110 cursor-pointer"
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            title={`[${sub.start.toFixed(1)}s - ${sub.end.toFixed(1)}s]: ${sub.text}`}
                          >
                            <span className="font-serif font-black text-[11px] shrink-0">T</span>
                            <span className="truncate text-[9px] font-normal opacity-95">{sub.text}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-2 text-[9px] text-text-muted/60 italic">
                        Chưa có phụ đề (Nối từ node Dubbing/Sub)
                      </div>
                    )}
                  </div>
                </div>

                {/* --- TRACK 2: VIDEO CLIPS (Thumbnail background) --- */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px] font-mono text-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> TRACK 2 — VIDEO CLIPS
                    </span>
                  </div>
                  <div className="relative h-13 w-full bg-white/[0.03] rounded-lg border border-white/5 flex items-center p-1">
                    {clips.length > 0 ? (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={clips.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                          <div className="flex items-center gap-1 w-full h-full">
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
                      <div className="p-2 text-[9px] text-text-muted/60 italic">
                        Nối video input vào port videos_in bên trái
                      </div>
                    )}
                  </div>
                </div>

                {/* --- TRACK 3: AUDIO / LỒNG TIẾNG (Màu Xanh Ngọc #14B8A6 + Formant Pattern) --- */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px] font-mono text-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" /> TRACK 3 — AUDIO / DUBBING
                    </span>
                  </div>
                  <div className="relative h-7 w-full bg-white/[0.03] rounded-lg border border-white/5 flex items-center px-1">
                    {nodeData.dubAudioTrack && nodeData.dubAudioTrack.length > 0 ? (
                      nodeData.dubAudioTrack.map((dub, idx) => {
                        const leftPct = (dub.start / totalDuration) * 100;
                        const widthPct = Math.max(8, ((dub.end - dub.start) / totalDuration) * 100);
                        return (
                          <div
                            key={idx}
                            className="absolute top-1 bottom-1 bg-[#14B8A6] text-white rounded-[8px] px-2 flex items-center gap-1.5 shadow-sm text-[10px] font-medium truncate group/dub hover:brightness-110 cursor-pointer overflow-hidden"
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              backgroundImage:
                                'repeating-linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.2) 2px, transparent 2px, transparent 6px)',
                            }}
                            title={`Dubbed Audio #${idx + 1}`}
                          >
                            <Music size={11} className="shrink-0 text-white/90" />
                            <span className="truncate text-[9px] font-semibold">Lồng tiếng #{idx + 1}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-2 text-[9px] text-text-muted/60 italic">
                        Chưa có dữ liệu lồng tiếng (Nối từ node Dubbing/Sub)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

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
