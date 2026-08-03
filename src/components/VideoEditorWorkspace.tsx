import { useState, useEffect, useRef } from 'react';
import { canvasEngine } from '../engine/canvasEngine';
import type { VideoEditorData, VideoClipItem, ClipTransform } from '../types/nodes';
import { concatVideosWithFFmpeg, extractVideoThumbnail } from '../services/ffmpegEngine';
import { separateVocalsAndInstrumental } from '../services/vocalSeparator';
import {
  Scissors,
  Video,
  Loader2,
  Play,
  Pause,
  CheckCircle2,
  Film,
  Trash2,
  AudioWaveform,
  Volume2,
  Layers,
  RotateCw,
  Copy,
  X,
  Pin,
  PinOff,
  Sliders,
  Image as ImageIcon,
  Type
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
  label,
  isSelected,
  onSelect,
  onRemove,
  onDuplicate,
}: {
  clip: VideoClipItem;
  index: number;
  label: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (clip: VideoClipItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: clip.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hoverNote = typeof canvasEngine.getNode(clip.sourceNodeId)?.data?.note === 'string' 
      ? canvasEngine.getNode(clip.sourceNodeId)?.data?.note 
      : clip.sourceNodeId;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(clip.id);
      }}
      title={String(hoverNote)}
      className={`relative group cursor-grab active:cursor-grabbing rounded-xl overflow-hidden border transition-all shrink-0 w-24 h-11 bg-black/80 flex flex-col justify-between p-1.5 ${
        isSelected
          ? 'border-accent-lime ring-2 ring-accent-lime/50 shadow-xl'
          : isDragging
          ? 'border-accent-lime ring-2 ring-accent-lime/50 shadow-xl'
          : 'border-white/10 hover:border-white/30'
      }`}
    >
      {/* Background Thumbnail */}
      {clip.thumbnailUrl ? (
        <img
          src={clip.thumbnailUrl}
          alt={`Clip ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 bg-canvas/80 flex items-center justify-center text-text-muted">
          <Film size={16} />
        </div>
      )}

      {/* Order Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[9px] font-bold font-mono px-1 py-0.2 rounded bg-black/60 backdrop-blur-md text-white shadow-sm border border-white/20">
          {label}
        </span>
      </div>

      {/* Hover Control Buttons */}
      <div className="relative z-10 flex items-center justify-end gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(clip);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-blue-500/90 hover:bg-blue-500 text-white transition-opacity shadow-md"
          title="Nhân bản clip"
        >
          <Copy size={9} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(clip.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-rose-600/90 hover:bg-rose-600 text-white transition-opacity shadow-md"
          title="Xóa clip"
        >
          <Trash2 size={9} />
        </button>
      </div>

      {/* Selection Trim Handles */}
      {isSelected && (
        <>
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-accent-lime cursor-col-resize hover:scale-x-150 transition-transform origin-left rounded-l-[10px]" title="Kéo để cắt đầu" />
          <div className="absolute top-0 bottom-0 right-0 w-1.5 bg-accent-lime cursor-col-resize hover:scale-x-150 transition-transform origin-right rounded-r-[10px]" title="Kéo để cắt đuôi" />
        </>
      )}
    </div>
  );
}

interface VideoEditorWorkspaceProps {
  nodeId: string;
  onClose: () => void;
}

export function VideoEditorWorkspace({ nodeId, onClose }: VideoEditorWorkspaceProps) {
  const [isPinned, setIsPinned] = useState(false);
  const [selectedTrackType, setSelectedTrackType] = useState<'video' | 'image' | 'audio' | 'text' | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);

  // Click Outside Auto-Close logic (respects isPinned)
  useEffect(() => {
    const handlePointerDownOutside = (e: PointerEvent) => {
      if (isPinned) return;
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('pointerdown', handlePointerDownOutside);
    return () => window.removeEventListener('pointerdown', handlePointerDownOutside);
  }, [isPinned, onClose]);

  // Fetch node data dynamically from canvasEngine or scan canvas for all video nodes
  const targetNode = nodeId !== 'global' ? canvasEngine.getNode(nodeId) : null;
  const rawNodeData = (targetNode?.data || {}) as VideoEditorData;

  // Auto-scan canvas nodes if opened globally or if clips are empty
  const [scannedClips, setScannedClips] = useState<VideoClipItem[]>([]);
  useEffect(() => {
    if (!targetNode || !rawNodeData.clips || rawNodeData.clips.length === 0) {
      const allNodes = canvasEngine.getNodes();
      const videoNodes = allNodes.filter(
        (n) => n.data && (n.data.output || n.data.file || n.data.outputVideo)
      );

      const generatedClips: VideoClipItem[] = videoNodes.map((n, idx) => {
        const vUrl = (n.data.output || n.data.file || n.data.outputVideo) as string;
        return {
          id: `clip_${n.id}`,
          sourceNodeId: n.id,
          videoUrl: vUrl,
          thumbnailUrl: (n.data.thumbnailUrl as string) || '',
          durationSec: 5,
          order: idx + 1,
        };
      });
      setScannedClips(generatedClips);
    }
  }, [nodeId, targetNode]);

  const clips = (rawNodeData.clips && rawNodeData.clips.length > 0) ? rawNodeData.clips : scannedClips;
  const nodeData = targetNode ? rawNodeData : { ...rawNodeData, clips };
  const customNodeName = targetNode?.data?.nodeName as string;

  const [selectedClipId, setSelectedClipId] = useState<string>(clips[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Sync selectedClipId when clips change
  useEffect(() => {
    if (clips.length > 0 && !clips.some((c) => c.id === selectedClipId)) {
      setSelectedClipId(clips[0].id);
    }
  }, [clips, selectedClipId]);

  // Calculate global start/end times for clips
  let currentAccumulated = 0;
  const clipsWithTime = [...clips].sort((a, b) => a.order - b.order).map((c) => {
    const dur = c.durationSec || 5;
    const start = currentAccumulated;
    const end = start + dur;
    currentAccumulated = end;
    return { ...c, start, end };
  });

  // Total Duration is 0 when no video clips are present
  const totalDuration = clips.length > 0 ? Math.max(currentAccumulated, 1) : 0;

  // Active clip transform
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

  const playheadPercent = Math.max(0, Math.min(100, (currentTime / totalDuration) * 100));

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
  };

  // Playhead Sync Loop
  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      if (isPlaying) {
        const dt = (now - lastTime) / 1000;
        setCurrentTime((prev) => {
          const next = prev + dt;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }
      lastTime = now;
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, totalDuration]);

  // Determine active clip based on scrubber position
  const currentGlobalClip = clipsWithTime.find((c) => currentTime >= c.start && currentTime < c.end) || clipsWithTime[0];
  const activeVideoUrl = nodeData.output || currentGlobalClip?.videoUrl || '';
  const activeClip = clips.find((c) => c.id === selectedClipId);

  // Keyboard Shortcuts within Workspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.isContentEditable) {
        return;
      }

      if (e.code === 'Escape') {
        e.preventDefault();
        if (!isPinned) {
          onClose();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        handleSplitClip();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        if (activeClip) handleDuplicateClip(activeClip);
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault();
        if (selectedClipId) handleRemoveClip(selectedClipId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, activeClip, currentTime, isPinned]);

  const updateActiveTransform = (partial: Partial<ClipTransform>) => {
    if (!selectedClipId) return;
    const existingIndex = transforms.findIndex((t) => t.clipId === selectedClipId);
    let updatedTransforms: ClipTransform[];

    if (existingIndex >= 0) {
      updatedTransforms = [...transforms];
      updatedTransforms[existingIndex] = { ...updatedTransforms[existingIndex], ...partial };
    } else {
      updatedTransforms = [
        ...transforms,
        {
          clipId: selectedClipId,
          scale: 1.0,
          offsetX: 0,
          offsetY: 0,
          rotationDeg: 0,
          ...partial,
        },
      ];
    }
    canvasEngine.updateNodeData(nodeId, { clipTransforms: updatedTransforms });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = clips.findIndex((c) => c.id === active.id);
    const newIndex = clips.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(clips, oldIndex, newIndex).map((clip, idx) => ({
        ...clip,
        order: idx + 1,
      }));
      canvasEngine.updateNodeData(nodeId, { clips: reordered, output: null });
    }
  };

  const handleRemoveClip = (clipId: string) => {
    const updated = clips.filter((c) => c.id !== clipId).map((c, idx) => ({ ...c, order: idx + 1 }));
    canvasEngine.updateNodeData(nodeId, { clips: updated, output: null });
    if (selectedClipId === clipId) {
      setSelectedClipId(updated[0]?.id || '');
    }
  };

  const handleDuplicateClip = (clipToDup: VideoClipItem) => {
    const newId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newClip: VideoClipItem = {
      ...clipToDup,
      id: newId,
      order: clips.length + 1,
    };
    const updated = [...clips, newClip];
    canvasEngine.updateNodeData(nodeId, { clips: updated, output: null });
    setSelectedClipId(newId);
  };

  const handleSplitClip = () => {
    if (!currentGlobalClip) return;

    const splitLocalTime = Math.max(0.5, currentTime - currentGlobalClip.start);
    const origDuration = currentGlobalClip.durationSec || 5;

    if (splitLocalTime >= origDuration - 0.5) return;

    const firstHalfDuration = parseFloat(splitLocalTime.toFixed(1));
    const secondHalfDuration = parseFloat((origDuration - firstHalfDuration).toFixed(1));

    const newClipId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const updatedClips: VideoClipItem[] = [];
    clips.forEach((clip) => {
      if (clip.id === currentGlobalClip.id) {
        updatedClips.push({
          ...clip,
          durationSec: firstHalfDuration,
          trimEnd: (clip.trimStart || 0) + firstHalfDuration,
        });
        updatedClips.push({
          ...clip,
          id: newClipId,
          order: clip.order + 1,
          trimStart: (clip.trimStart || 0) + firstHalfDuration,
          durationSec: secondHalfDuration,
        });
      } else if (clip.order > currentGlobalClip.order) {
        updatedClips.push({
          ...clip,
          order: clip.order + 1,
        });
      } else {
        updatedClips.push(clip);
      }
    });

    canvasEngine.updateNodeData(nodeId, { clips: updatedClips, output: null });
    setSelectedClipId(newClipId);
  };

  const handleExtractVocals = async () => {
    if (!activeVideoUrl) return;
    canvasEngine.updateNodeData(nodeId, { isExtractingVocals: true, vocalSeparationEngine: undefined });

    try {
      const audioFetch = await fetch(activeVideoUrl);
      const audioBlob = await audioFetch.blob();
      const result = await separateVocalsAndInstrumental(audioBlob, (pct, status) => {
        console.log(`[Vocal Separation Progress] ${status}: ${pct.toFixed(0)}%`);
      });

      canvasEngine.updateNodeData(nodeId, {
        isExtractingVocals: false,
        vocalsAudioUrl: result.vocalsUrl,
        instrumentalAudioUrl: result.instrumentalUrl,
        vocalSeparationEngine: result.engineUsed,
      });
    } catch (err) {
      console.error('Failed to extract vocals:', err);
      canvasEngine.updateNodeData(nodeId, { isExtractingVocals: false });
    }
  };

  const handleRunConcat = async () => {
    if (clips.length === 0) return;
    canvasEngine.updateNodeData(nodeId, { isConcatting: true });

    try {
      const itemsToConcat = clipsWithTime
        .filter((c) => Boolean(c.videoUrl))
        .map((c) => {
          const t = transforms.find((trans) => trans.clipId === c.id);
          return {
            url: c.videoUrl || '',
            id: c.id,
            transform: t,
            volume: c.volume || 100,
          };
        });
      const concatResultUrl = await concatVideosWithFFmpeg(
        itemsToConcat,
        nodeData.resolution || '720p',
        canvasSettings.aspectRatio || '16:9',
        canvasSettings.backgroundFill || 'black'
      );
      const thumb = await extractVideoThumbnail(concatResultUrl);

      canvasEngine.updateNodeData(nodeId, {
        output: concatResultUrl,
        thumbnailUrl: thumb,
        isConcatting: false,
      });
    } catch (err) {
      console.error('Failed to concat videos:', err);
      canvasEngine.updateNodeData(nodeId, { isConcatting: false });
    }
  };

  const getClipLabel = (idx: number) => `#${idx + 1}`;

  const aspectBoxStyle: Record<string, string> = {
    '16:9': 'aspect-[16/9] w-full max-h-[190px]',
    '9:16': 'aspect-[9/16] h-[190px]',
    '1:1': 'aspect-square h-[190px]',
    '4:5': 'aspect-[4/5] h-[190px]',
  };

  return (
    <div
      ref={workspaceRef}
      className="fixed bottom-6 right-24 z-50 overflow-hidden rounded-2xl border border-border-subtle shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] origin-bottom-right"
      style={{
        width: '740px',
        height: '520px',
        background: 'rgba(8, 8, 12, 0.85)',
        backdropFilter: 'blur(20px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex h-full text-text-primary">
        {/* LEFT SIDEBAR COLUMN: Settings & Actions */}
        <div className="w-[200px] shrink-0 border-r border-border-subtle p-4 flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-accent-lime/20 text-accent-lime border border-accent-lime/40 flex items-center justify-center">
                  <Scissors size={15} />
                </div>
                <h2 className="text-sm font-bold text-white tracking-wide truncate">
                  {customNodeName || 'Video Editor'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-rose-500 text-text-muted hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X size={14} />
              </button>
            </div>

            {/* Pin / Unpin Button */}
            <button
              onClick={() => setIsPinned((prev) => !prev)}
              title={isPinned ? 'Đã ghim (ESC không đóng)' : 'Ghim cửa sổ'}
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isPinned
                  ? 'bg-accent-lime text-black shadow-[0_0_15px_rgba(198,241,53,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/10'
              }`}
            >
              {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
              <span>{isPinned ? 'Đã ghim' : 'Ghim cửa sổ'}</span>
            </button>

            {/* Aspect Ratio */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-border-subtle">
              <span className="text-[11px] font-semibold text-accent-lime uppercase tracking-wider">Tỉ lệ khung hình</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(['16:9', '9:16', '1:1', '4:5'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() =>
                      canvasEngine.updateNodeData(nodeId, {
                        canvas: { ...canvasSettings, aspectRatio: ratio },
                      })
                    }
                    className={`py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      canvasSettings.aspectRatio === ratio
                        ? 'bg-accent-lime text-black font-bold'
                        : 'bg-white/5 text-text-muted hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Summary */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1 text-[11px] font-mono text-text-muted">
              <div className="flex items-center justify-between">
                <span>Số clips:</span>
                <span className="text-white font-bold">{clips.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Thời lượng:</span>
                <span className="text-white font-bold">{totalDuration.toFixed(1)}s</span>
              </div>
            </div>
          </div>

          {/* Primary Action Button (Ghép & Xuất Video) */}
          <button
            onClick={handleRunConcat}
            disabled={Boolean(nodeData.isConcatting || clips.length === 0)}
            className="w-full py-2.5 bg-accent-lime hover:bg-[#b8e62d] disabled:opacity-40 text-black rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(198,241,53,0.3)] transition-all text-xs cursor-pointer"
          >
            {nodeData.isConcatting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : nodeData.output ? (
              <CheckCircle2 size={15} />
            ) : (
              <Play size={15} fill="currentColor" />
            )}
            <span>{nodeData.output ? 'Đã Xuất Video' : 'Ghép & Xuất Video'}</span>
          </button>
        </div>

        {/* RIGHT MAIN AREA: Preview + Timeline + Contextual Toolbox */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden min-h-0">
          {/* Video Preview Box & Controls */}
          <div className="w-full flex items-center justify-center shrink-0">
            <div className={`relative bg-black rounded-xl overflow-hidden border border-border-subtle flex items-center justify-center shadow-inner group transition-all duration-200 ${aspectBoxStyle[canvasSettings.aspectRatio || '16:9']}`}>
              {activeVideoUrl ? (
                <div
                  className="w-full h-full flex items-center justify-center overflow-hidden transition-transform duration-75"
                  style={{
                    transform: `scale(${activeTransform.scale}) translate(${activeTransform.offsetX}px, ${activeTransform.offsetY}px) rotate(${activeTransform.rotationDeg}deg)`,
                  }}
                >
                  <video
                    ref={videoRef}
                    src={activeVideoUrl}
                    className="max-w-full max-h-full object-contain"
                    autoPlay={isPlaying}
                    onEnded={() => {
                      if (nodeData.output) {
                        setIsPlaying(false);
                        setCurrentTime(0);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-text-muted">
                  <Video size={28} className="text-white/20 animate-pulse" />
                  <span className="text-[11px]">Xem trước Video Canvas</span>
                </div>
              )}
            </div>
          </div>

          {/* Player Controls & Scrubber */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-7 h-7 rounded-full bg-accent-lime hover:bg-[#b8e62d] text-black flex items-center justify-center shadow-md transition-all shrink-0 cursor-pointer"
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
            </button>

            <input
              type="range"
              min={0}
              max={totalDuration || 100}
              value={currentTime}
              step={0.1}
              onChange={(e) => {
                const t = parseFloat(e.target.value);
                setCurrentTime(t);
                if (videoRef.current && currentGlobalClip) {
                  let localTime = t;
                  if (!nodeData.output) {
                    localTime = Math.max(0, t - currentGlobalClip.start);
                  }
                  videoRef.current.currentTime = localTime;
                }
              }}
              className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-lime"
              style={{
                background: `linear-gradient(to right, #C6F135 ${(currentTime / (totalDuration || 100)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (totalDuration || 100)) * 100}%)`,
              }}
            />
            <span className="font-mono text-[10px] text-text-muted shrink-0 w-16 text-right">
              {currentTime.toFixed(1)}s / {(totalDuration || 0).toFixed(1)}s
            </span>
          </div>

          {/* Multi-track Timeline with 4 Input Tracks */}
          <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden bg-black/20 p-2.5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between text-[11px] shrink-0">
              <span className="text-white font-bold flex items-center gap-1">
                <Layers size={12} className="text-accent-lime" /> Multi-track Timeline (4 Tracks)
              </span>
              {selectedTrackType && (
                <button
                  onClick={() => setSelectedTrackType(null)}
                  className="text-[10px] text-accent-lime hover:underline"
                >
                  Bỏ chọn
                </button>
              )}
            </div>

            {/* Time Axis Container with Ruler & Playhead */}
            <div
              ref={timelineRef}
              className="flex flex-col gap-1 relative cursor-pointer flex-1 overflow-x-auto custom-scrollbar"
              onClick={(e) => handleRulerScrub(e.clientX)}
            >
              {/* TOP RULER */}
              <div className="relative h-4 w-full border-b border-white/10 flex items-end pb-0.5 bg-black/30 rounded shrink-0">
                {timeTicks.map((tick) => (
                  <div
                    key={tick.sec}
                    className="absolute bottom-0 flex flex-col items-center -translate-x-1/2"
                    style={{ left: `${(tick.sec / totalDuration) * 100}%` }}
                  >
                    <span className="text-[8px] font-mono text-text-muted select-none">{tick.label}</span>
                    <div className="w-0.5 h-1 bg-white/20 mt-0.5" />
                  </div>
                ))}
              </div>

              {/* PLAYHEAD NEEDLE */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-accent-lime z-30 pointer-events-none transition-all duration-75"
                style={{ left: `${playheadPercent}%` }}
              >
                <div
                  className="w-2.5 h-2.5 bg-accent-lime rounded-b-full -translate-x-1/2 cursor-col-resize shadow-[0_0_8px_rgba(198,241,53,0.8)] pointer-events-auto"
                  title="Kéo kim thời gian"
                />
              </div>

              {/* TRACK 1: VIDEO INPUT TRACK */}
              <div
                className={`flex flex-col gap-0.5 shrink-0 p-1 rounded-lg transition-colors ${
                  selectedTrackType === 'video' ? 'bg-rose-500/10 border border-rose-500/30' : ''
                }`}
                onClick={() => setSelectedTrackType('video')}
              >
                <div className="flex items-center justify-between text-[9px] text-text-muted px-0.5">
                  <span className="flex items-center gap-1 font-semibold text-rose-300">
                    <Video size={10} /> Video Track
                  </span>
                </div>
                <div className="relative h-10 w-full bg-black/40 rounded-lg border border-white/5 flex items-center p-1 overflow-x-auto custom-scrollbar">
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
                              label={getClipLabel(idx)}
                              isSelected={clip.id === selectedClipId}
                              onSelect={(id) => {
                                setSelectedClipId(id);
                                setSelectedTrackType('video');
                              }}
                              onRemove={handleRemoveClip}
                              onDuplicate={handleDuplicateClip}
                            />
                          ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>

              {/* TRACK 2: IMAGE INPUT TRACK */}
              <div
                className={`flex flex-col gap-0.5 shrink-0 p-1 rounded-lg transition-colors cursor-pointer ${
                  selectedTrackType === 'image' ? 'bg-amber-500/10 border border-amber-500/30' : ''
                }`}
                onClick={() => setSelectedTrackType('image')}
              >
                <div className="flex items-center justify-between text-[9px] text-text-muted px-0.5">
                  <span className="flex items-center gap-1 font-semibold text-amber-300">
                    <ImageIcon size={10} /> Image Track (Ảnh / Watermark)
                  </span>
                </div>
                <div className="h-7 w-full bg-black/40 rounded-lg border border-white/5 flex items-center px-2 shadow-inner">
                  <span className="text-[8px] text-white/30 italic">Nối node Image Input để tự hiện overlay ảnh</span>
                </div>
              </div>

              {/* TRACK 3: AUDIO INPUT TRACK */}
              <div
                className={`flex flex-col gap-0.5 shrink-0 p-1 rounded-lg transition-colors cursor-pointer ${
                  selectedTrackType === 'audio' ? 'bg-cyan-500/10 border border-cyan-500/30' : ''
                }`}
                onClick={() => setSelectedTrackType('audio')}
              >
                <div className="flex items-center justify-between text-[9px] text-text-muted px-0.5">
                  <span className="flex items-center gap-1 font-semibold text-cyan-300">
                    <AudioWaveform size={10} /> Audio Track (Voiceover / Stems)
                  </span>
                </div>
                <div className="h-7 w-full bg-black/40 rounded-lg border border-white/5 flex items-center px-2 shadow-inner">
                  {nodeData.vocalsAudioUrl ? (
                    <div className="w-full h-4 bg-cyan-500/20 border border-cyan-500/40 rounded flex items-center px-2 text-[8px] text-cyan-300 font-mono gap-1">
                      <AudioWaveform size={9} className="animate-pulse" />
                      <span>Audio Stems ({nodeData.vocalSeparationEngine === 'htdemucs_onnx' ? 'HTDemucs' : 'DSP'})</span>
                    </div>
                  ) : (
                    <span className="text-[8px] text-white/30 italic">Click chọn audio track</span>
                  )}
                </div>
              </div>

              {/* TRACK 4: TEXT INPUT TRACK */}
              <div
                className={`flex flex-col gap-0.5 shrink-0 p-1 rounded-lg transition-colors cursor-pointer ${
                  selectedTrackType === 'text' ? 'bg-emerald-500/10 border border-emerald-500/30' : ''
                }`}
                onClick={() => setSelectedTrackType('text')}
              >
                <div className="flex items-center justify-between text-[9px] text-text-muted px-0.5">
                  <span className="flex items-center gap-1 font-semibold text-emerald-300">
                    <Type size={10} /> Text Track (Phụ đề Auto-sub)
                  </span>
                </div>
                <div className="h-7 w-full bg-black/40 rounded-lg border border-white/5 flex items-center px-2 shadow-inner">
                  <span className="text-[8px] text-white/30 italic">Click chọn text/phụ đề track</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contextual Toolbox (Expandable) */}
          {selectedTrackType && (
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2 shrink-0 animate-fadeIn">
              <div className="flex items-center justify-between text-[11px] font-semibold text-accent-lime">
                <span className="flex items-center gap-1">
                  <Sliders size={12} />
                  {selectedTrackType === 'video' && 'Công Cụ Video Clip'}
                  {selectedTrackType === 'audio' && 'Công Cụ Audio Track'}
                  {selectedTrackType === 'text' && 'Cấu Hình Phụ Đề'}
                </span>
                <button onClick={() => setSelectedTrackType(null)} className="text-[10px] text-text-muted hover:text-white">✕</button>
              </div>

              {selectedTrackType === 'video' && (
                <div className="flex flex-col gap-2 text-[11px]">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleSplitClip}
                      className="py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Scissors size={12} className="text-accent-lime" /> Cắt Clip (S)
                    </button>

                    <button
                      onClick={handleExtractVocals}
                      disabled={Boolean(nodeData.isExtractingVocals || !activeVideoUrl)}
                      className="py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 rounded-lg font-medium flex items-center justify-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {nodeData.isExtractingVocals ? <Loader2 size={12} className="animate-spin" /> : <AudioWaveform size={12} />}
                      <span>Tách Giọng AI</span>
                    </button>
                  </div>

                  {/* Volume Slider */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-[10px] text-text-muted">
                      <span className="flex items-center gap-1">
                        <Volume2 size={11} /> Volume: {activeClip?.volume || 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={200}
                      value={activeClip?.volume || 100}
                      onChange={(e) => {
                        const vol = parseInt(e.target.value, 10);
                        const updated = clips.map((c) => (c.id === selectedClipId ? { ...c, volume: vol } : c));
                        canvasEngine.updateNodeData(nodeId, { clips: updated });
                      }}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-lime"
                    />
                  </div>

                  {/* Zoom & Rotation Sliders */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between text-[10px] text-text-muted">
                        <span>Zoom: {activeTransform.scale.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={3.0}
                        step={0.05}
                        value={activeTransform.scale}
                        onChange={(e) => updateActiveTransform({ scale: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between text-[10px] text-text-muted">
                        <span className="flex items-center gap-0.5">
                          <RotateCw size={10} /> Góc: {activeTransform.rotationDeg}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={5}
                        value={activeTransform.rotationDeg}
                        onChange={(e) => updateActiveTransform({ rotationDeg: parseInt(e.target.value, 10) })}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
