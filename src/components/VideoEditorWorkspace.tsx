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
  Maximize2,
  Camera,
  Type,
  Copy,
  X,
  Pin,
  PinOff,
  Sliders,
  Globe
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
      className={`relative group cursor-grab active:cursor-grabbing rounded-[10px] overflow-hidden border transition-all shrink-0 w-24 h-11 bg-black/80 flex flex-col justify-between p-1.5 ${
        isSelected
          ? 'border-rose-500 ring-2 ring-rose-500/50 shadow-xl'
          : isDragging
          ? 'border-rose-500 ring-2 ring-rose-500/50 shadow-xl'
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
          title="Nhân bản clip (Lặp)"
        >
          <Copy size={9} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(clip.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-rose-600/90 hover:bg-rose-600 text-white transition-opacity shadow-md"
          title="Xóa clip này"
        >
          <Trash2 size={9} />
        </button>
      </div>

      {/* Selection Trim Handles */}
      {isSelected && (
        <>
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-white cursor-col-resize hover:scale-x-150 transition-transform origin-left rounded-l-[10px]" title="Kéo để cắt đầu" />
          <div className="absolute top-0 bottom-0 right-0 w-1.5 bg-white cursor-col-resize hover:scale-x-150 transition-transform origin-right rounded-r-[10px]" title="Kéo để cắt đuôi" />
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
  const [selectedTrackType, setSelectedTrackType] = useState<'video' | 'audio' | 'text' | null>(null);

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

  const totalDuration = Math.max(currentAccumulated, 30);

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

  return (
    <div
      className="fixed top-0 right-0 bottom-0 z-[200] w-[32vw] min-w-[380px] max-w-[500px] bg-panel/95 backdrop-blur-2xl border-l border-border-subtle shadow-2xl flex flex-col overflow-hidden text-text-primary transition-transform duration-200 translate-x-0"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-black/40 border-b border-white/10 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Scissors size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
              {customNodeName || 'Video Editor Workstation'}
            </h2>
            <p className="text-[10px] text-text-muted">{clips.length} Clips • {totalDuration.toFixed(1)}s</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pin / Unpin Toggle Button */}
          <button
            onClick={() => setIsPinned((prev) => !prev)}
            title={isPinned ? 'Đã ghim panel (ESC không đóng)' : 'Ghim panel'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
              isPinned
                ? 'bg-[#C6F135] text-black ring-2 ring-white/80 shadow-[0_0_10px_rgba(198,241,53,0.5)] font-bold'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
            <span>{isPinned ? 'Đã ghim' : 'Ghim'}</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            title="Đóng panel"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Panel Content Body (Single Vertical Scroll Column) */}
      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar min-h-0">
        {/* --- SECTION 1: PREVIEW & CONTROLS --- */}
        <div className="flex flex-col gap-3 bg-black/30 p-3.5 rounded-2xl border border-white/10 shrink-0">
          {/* Aspect Ratio Pills */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-muted font-medium flex items-center gap-1">
              <Maximize2 size={12} className="text-rose-400" /> Aspect Ratio:
            </span>
            <div className="flex items-center gap-1">
              {(['16:9', '9:16', '1:1', '4:5'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() =>
                    canvasEngine.updateNodeData(nodeId, {
                      canvas: { ...canvasSettings, aspectRatio: ratio },
                    })
                  }
                  className={`px-2 py-0.5 rounded font-mono text-[10px] transition-all cursor-pointer ${
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

          {/* Video Preview Box */}
          <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden border border-white/10 flex items-center justify-center shadow-inner group">
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
                <Video size={32} className="text-white/20 animate-pulse" />
                <span className="text-[11px]">Xem trước Video Canvas</span>
              </div>
            )}
          </div>

          {/* Player Controls & Scrubber */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-all shrink-0 cursor-pointer"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
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
              className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:shadow-md"
              style={{
                background: `linear-gradient(to right, #f43f5e ${(currentTime / (totalDuration || 100)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (totalDuration || 100)) * 100}%)`,
              }}
            />
            <span className="font-mono text-[11px] text-text-muted shrink-0 w-16 text-right">
              {currentTime.toFixed(1)}s / {(totalDuration || 0).toFixed(1)}s
            </span>
          </div>
        </div>

        {/* --- SECTION 2: MULTI-TRACK TIMELINE --- */}
        <div className="flex flex-col gap-2.5 bg-black/30 p-3.5 rounded-2xl border border-white/10 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-primary font-bold flex items-center gap-1.5">
              <Layers size={13} className="text-rose-400" /> Multi-track Timeline
            </span>
            {selectedTrackType && (
              <button
                onClick={() => setSelectedTrackType(null)}
                className="text-[10px] text-rose-400 hover:underline"
              >
                Bỏ chọn track
              </button>
            )}
          </div>

          {/* Time Axis Container with Ruler & Playhead */}
          <div
            ref={timelineRef}
            className="flex flex-col gap-2 relative cursor-pointer"
            onClick={(e) => {
              handleRulerScrub(e.clientX);
            }}
          >
            {/* 1. TOP RULER (Thước thời gian) */}
            <div className="relative h-5 w-full border-b border-white/10 flex items-end pb-0.5 bg-black/20 rounded-t-lg shrink-0 overflow-hidden">
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

            {/* 2. PLAYHEAD NEEDLE (Kim thời gian) */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none transition-all duration-75"
              style={{ left: `${playheadPercent}%` }}
            >
              <div
                className="w-3 h-3 bg-rose-500 rounded-b-full -translate-x-1/2 cursor-col-resize shadow-[0_0_8px_rgba(244,63,94,0.8)] pointer-events-auto"
                title="Kéo kim thời gian"
              />
            </div>

            {/* TRACK 1: VIDEO TRACK */}
            <div
              className={`flex flex-col gap-1 shrink-0 p-1.5 rounded-xl transition-colors ${
                selectedTrackType === 'video' ? 'bg-rose-500/10 border border-rose-500/30' : ''
              }`}
              onClick={() => setSelectedTrackType('video')}
            >
              <div className="flex items-center justify-between text-[10px] text-text-muted px-0.5">
                <span className="flex items-center gap-1 font-semibold text-rose-300">
                  <Camera size={11} /> Video Track (Kéo thả clip)
                </span>
              </div>
              <div className="relative h-12 w-full bg-black/40 rounded-xl border border-white/5 flex items-center p-1 overflow-x-auto custom-scrollbar">
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

            {/* TRACK 2: AUDIO TRACK */}
            <div
              className={`flex flex-col gap-1 shrink-0 p-1.5 rounded-xl transition-colors cursor-pointer ${
                selectedTrackType === 'audio' ? 'bg-cyan-500/10 border border-cyan-500/30' : ''
              }`}
              onClick={() => setSelectedTrackType('audio')}
            >
              <div className="flex items-center justify-between text-[10px] text-text-muted px-0.5">
                <span className="flex items-center gap-1 font-semibold text-cyan-300">
                  <AudioWaveform size={11} /> Audio Track (Voiceover / Nhạc nền)
                </span>
              </div>
              <div className="h-9 w-full bg-black/40 rounded-xl border border-white/5 flex items-center px-2.5 shadow-inner">
                {nodeData.vocalsAudioUrl ? (
                  <div className="w-full h-5 bg-cyan-500/20 border border-cyan-500/40 rounded flex items-center px-2 text-[9px] text-cyan-300 font-mono gap-1">
                    <AudioWaveform size={11} className="animate-pulse" />
                    <span>Audio đã tách AI ({nodeData.vocalSeparationEngine === 'htdemucs_onnx' ? 'HTDemucs' : 'DSP'})</span>
                  </div>
                ) : (
                  <span className="text-[9px] text-white/30 italic">Chưa chọn audio (Click chọn để chỉnh volume)</span>
                )}
              </div>
            </div>

            {/* TRACK 3: TEXT TRACK */}
            <div
              className={`flex flex-col gap-1 shrink-0 p-1.5 rounded-xl transition-colors cursor-pointer ${
                selectedTrackType === 'text' ? 'bg-amber-500/10 border border-amber-500/30' : ''
              }`}
              onClick={() => setSelectedTrackType('text')}
            >
              <div className="flex items-center justify-between text-[10px] text-text-muted px-0.5">
                <span className="flex items-center gap-1 font-semibold text-amber-300">
                  <Type size={11} /> Text Track (Phụ đề Subtitle)
                </span>
              </div>
              <div className="h-9 w-full bg-black/40 rounded-xl border border-white/5 flex items-center px-2.5 shadow-inner">
                <span className="text-[9px] text-white/30 italic">Click chọn để cài đặt hiển thị phụ đề</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION 3: CONTEXTUAL TOOLBOX (Only shown when a track is selected) --- */}
        <div
          className={`transition-all duration-200 ease-in-out border border-white/10 rounded-2xl bg-black/40 ${
            selectedTrackType ? 'max-h-[500px] opacity-100 p-3.5 flex flex-col gap-3' : 'max-h-0 opacity-0 p-0 overflow-hidden border-none'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={13} className="text-rose-400" />
              {selectedTrackType === 'video' && 'Công Cụ Video Clip'}
              {selectedTrackType === 'audio' && 'Công Cụ Audio Track'}
              {selectedTrackType === 'text' && 'Cấu Hình Phụ Đề Text'}
            </h3>
            <button
              onClick={() => setSelectedTrackType(null)}
              className="text-[10px] text-text-muted hover:text-white"
            >
              ✕ Ẩn
            </button>
          </div>

          {/* VIDEO TOOLBOX CONTENT */}
          {selectedTrackType === 'video' && (
            <div className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSplitClip}
                  className="py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Cắt clip tại kim thời gian (Phím S)"
                >
                  <Scissors size={13} className="text-rose-400" /> Cắt Clip (S)
                </button>

                <button
                  onClick={handleExtractVocals}
                  disabled={Boolean(nodeData.isExtractingVocals || !activeVideoUrl)}
                  className="py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {nodeData.isExtractingVocals ? <Loader2 size={13} className="animate-spin" /> : <AudioWaveform size={13} />}
                  <span>Tách Giọng AI</span>
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex items-center justify-between text-[11px] text-white/70">
                  <span className="flex items-center gap-1">
                    <Volume2 size={12} /> Volume Clip
                  </span>
                  <span className="font-mono text-white/90 bg-white/10 px-1.5 py-0.2 rounded text-[10px]">
                    {activeClip?.volume || 100}%
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
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>

              {/* Scale & Rotate Sliders */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] text-white/70">
                    <span>Zoom</span>
                    <span className="font-mono text-[9px]">{activeTransform.scale.toFixed(2)}x</span>
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

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] text-white/70">
                    <span className="flex items-center gap-1">
                      <RotateCw size={10} /> Góc
                    </span>
                    <span className="font-mono text-[9px]">{activeTransform.rotationDeg}°</span>
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

          {/* AUDIO TOOLBOX CONTENT */}
          {selectedTrackType === 'audio' && (
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] text-white/70">
                  <span className="flex items-center gap-1">
                    <Volume2 size={12} /> Âm lượng Vocals / Audio
                  </span>
                  <span className="font-mono text-white/90 bg-white/10 px-1.5 py-0.2 rounded text-[10px]">100%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  defaultValue={100}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                />
              </div>
            </div>
          )}

          {/* TEXT TOOLBOX CONTENT */}
          {selectedTrackType === 'text' && (
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between text-[11px] text-white/80">
                <span className="flex items-center gap-1">
                  <Globe size={12} className="text-amber-400" /> In Phụ Đề Vào Video (Burn Sub)
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(nodeData.burnSubtitle)}
                  onChange={(e) => canvasEngine.updateNodeData(nodeId, { burnSubtitle: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-black text-rose-500 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* --- SECTION 4: PRIMARY ACTION (Ghép & Xuất Video) --- */}
        <div className="mt-auto pt-2 shrink-0">
          <button
            onClick={handleRunConcat}
            disabled={Boolean(nodeData.isConcatting || clips.length === 0)}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-white/5 disabled:text-white/40 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(225,29,72,0.6)] disabled:shadow-none transition-all text-xs cursor-pointer"
          >
            {nodeData.isConcatting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : nodeData.output ? (
              <CheckCircle2 size={15} />
            ) : (
              <Play size={15} fill="currentColor" />
            )}
            <span>{nodeData.output ? 'Đã Xuất Video (FFmpeg)' : 'Ghép & Xuất Video'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
