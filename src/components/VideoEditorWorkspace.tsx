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
  PinOff
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
      onClick={() => onSelect(clip.id)}
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

  // Fetch node data dynamically from canvasEngine
  const targetNode = canvasEngine.getNode(nodeId);
  const nodeData = (targetNode?.data || {}) as VideoEditorData;
  const clips = nodeData.clips || [];
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
        onClose();
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
  }, [selectedClipId, activeClip, currentTime]);

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
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={() => {
        if (!isPinned) onClose();
      }}
    >
      {/* Main Workspace Panel */}
      <div
        className="w-[92vw] max-w-[1280px] h-[88vh] max-h-[860px] bg-[#0c0c0e]/95 backdrop-blur-2xl rounded-[28px] border border-white/15 shadow-2xl flex flex-col overflow-hidden text-text-primary transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-black/40 border-b border-white/10 flex items-center justify-between shadow-lg shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Scissors size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                {customNodeName || 'CapCut Video Workstation'}
                <span className="text-xs font-normal text-text-muted">(ID: {nodeId})</span>
              </h2>
              <p className="text-[11px] text-text-muted">Chỉnh sửa đa khung hình, cắt clip & tách giọng AI</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* AI vs DSP Badge */}
            {nodeData.vocalSeparationEngine && (
              <span
                className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border ${
                  nodeData.vocalSeparationEngine === 'htdemucs_onnx'
                    ? 'bg-accent-lime/20 border-accent-lime/40 text-accent-lime'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                }`}
              >
                {nodeData.vocalSeparationEngine === 'htdemucs_onnx' ? '✨ AI HTDemucs' : '⚡ DSP Filter'}
              </span>
            )}

            <span className="text-xs font-mono px-3 py-1 bg-rose-500/20 rounded-full text-rose-400 border border-rose-500/30">
              {clips.length} Clips • {totalDuration.toFixed(1)}s
            </span>

            {/* Pin / Unpin Toggle Button */}
            <button
              onClick={() => setIsPinned((prev) => !prev)}
              title={isPinned ? 'Đã ghim cửa sổ (Click nền ngoài không đóng)' : 'Ghim cửa sổ nổi'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isPinned
                  ? 'bg-[#C6F135] text-black ring-2 ring-white/80 shadow-[0_0_12px_rgba(198,241,53,0.6)] font-bold'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
              <span>{isPinned ? 'Đã ghim' : 'Ghim'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Đóng (ESC)"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Workspace Body: 2 Columns (Left: Preview + Timeline, Right: Toolbox) */}
        <div className="flex-1 p-6 flex gap-6 items-stretch overflow-hidden min-h-0">
          {/* LEFT COLUMN: BOX 1 & BOX 2 (Preview + Timeline combined) */}
          <div className="flex-1 bg-[#0c0c0e]/80 rounded-[24px] p-5 border border-white/10 shadow-2xl flex flex-col gap-4 overflow-hidden min-h-0">
            {/* --- Nửa trên: Preview --- */}
            <div className="flex flex-col gap-3 border-b border-white/10 pb-4 shrink-0">
              {/* Aspect Ratio Pills */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted font-medium flex items-center gap-1">
                  <Maximize2 size={12} className="text-rose-400" /> Frame Ratio:
                </span>
                <div className="flex items-center gap-1.5">
                  {(['16:9', '9:16', '1:1', '4:5'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() =>
                        canvasEngine.updateNodeData(nodeId, {
                          canvas: { ...canvasSettings, aspectRatio: ratio },
                        })
                      }
                      className={`px-2 py-0.5 rounded-md font-mono text-xs transition-all cursor-pointer ${
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
              <div className="relative aspect-video max-h-[300px] bg-black rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center shadow-inner group">
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
                    <Video size={36} className="text-white/20 animate-pulse" />
                    <span className="text-xs">Xem trước Canvas CapCut</span>
                  </div>
                )}
              </div>

              {/* Player Controls & Scrubber */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-all shrink-0 cursor-pointer"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
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
                  className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:shadow-md"
                  style={{
                    background: `linear-gradient(to right, #f43f5e ${(currentTime / (totalDuration || 100)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (totalDuration || 100)) * 100}%)`,
                  }}
                />
                <span className="font-mono text-xs text-text-muted shrink-0 w-20 text-right">
                  {currentTime.toFixed(1)}s / {(totalDuration || 0).toFixed(1)}s
                </span>
              </div>
            </div>

            {/* --- Nửa dưới: Multi-track Timeline --- */}
            <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between text-xs shrink-0">
                <span className="text-text-primary font-bold flex items-center gap-1.5">
                  <Layers size={14} className="text-rose-400" /> Multi-track Timeline
                </span>
                <span className="text-[11px] font-mono text-text-muted">
                  {clips.length} clips • {totalDuration.toFixed(1)}s
                </span>
              </div>

              {/* Time Axis Container with Ruler & Playhead */}
              <div
                ref={timelineRef}
                className="flex-1 overflow-x-auto custom-scrollbar flex flex-col gap-2.5 min-w-full cursor-pointer relative"
                onClick={(e) => handleRulerScrub(e.clientX)}
              >
                {/* 1. TOP RULER (Thước thời gian) */}
                <div className="relative h-6 w-full min-w-[500px] border-b border-white/10 flex items-end pb-1 bg-black/20 rounded-t-xl shrink-0">
                  {timeTicks.map((tick) => (
                    <div
                      key={tick.sec}
                      className="absolute bottom-0 flex flex-col items-center -translate-x-1/2"
                      style={{ left: `${(tick.sec / totalDuration) * 100}%` }}
                    >
                      <span className="text-[9px] font-mono text-text-muted select-none">{tick.label}</span>
                      <div className="w-0.5 h-1.5 bg-white/20 mt-0.5" />
                    </div>
                  ))}
                </div>

                {/* 2. PLAYHEAD NEEDLE (Kim thời gian) */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none transition-all duration-75"
                  style={{ left: `${playheadPercent}%` }}
                >
                  <div
                    className="w-3.5 h-3.5 bg-rose-500 rounded-b-full -translate-x-1/2 cursor-col-resize shadow-[0_0_8px_rgba(244,63,94,0.8)] pointer-events-auto"
                    title="Kéo kim thời gian"
                  />
                </div>

                {/* TRACK 1: VIDEO TRACK */}
                <div className="flex flex-col gap-1 shrink-0">
                  <div className="flex items-center justify-between text-[10px] text-text-muted px-1">
                    <span className="flex items-center gap-1 font-semibold text-rose-300">
                      <Camera size={11} /> Video Track (Kéo thả sắp xếp)
                    </span>
                  </div>
                  <div className="relative h-14 w-full bg-black/40 rounded-xl border border-white/5 flex items-center p-1.5 shadow-inner">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={clips.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                        <div className="flex items-center gap-1.5 w-full h-full">
                          {clips
                            .sort((a, b) => a.order - b.order)
                            .map((clip, idx) => (
                              <SortableClipCard
                                key={clip.id}
                                clip={clip}
                                index={idx}
                                label={getClipLabel(idx)}
                                isSelected={clip.id === selectedClipId}
                                onSelect={setSelectedClipId}
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
                <div className="flex flex-col gap-1 shrink-0">
                  <div className="flex items-center justify-between text-[10px] text-text-muted px-1">
                    <span className="flex items-center gap-1 font-semibold text-cyan-300">
                      <AudioWaveform size={11} /> Audio Track (Voiceover / Nhạc nền)
                    </span>
                  </div>
                  <div className="h-10 w-full bg-black/40 rounded-xl border border-white/5 flex items-center px-3 shadow-inner">
                    {nodeData.vocalsAudioUrl ? (
                      <div className="w-full h-6 bg-cyan-500/20 border border-cyan-500/40 rounded-lg flex items-center px-2 text-[10px] text-cyan-300 font-mono gap-1.5">
                        <AudioWaveform size={12} className="animate-pulse" />
                        <span>Giọng nói đã tách AI ({nodeData.vocalSeparationEngine === 'htdemucs_onnx' ? 'HTDemucs' : 'DSP'})</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-white/30 italic">Chưa có audio rời (Tùy chọn tách giọng AI)</span>
                    )}
                  </div>
                </div>

                {/* TRACK 3: TEXT TRACK */}
                <div className="flex flex-col gap-1 shrink-0">
                  <div className="flex items-center justify-between text-[10px] text-text-muted px-1">
                    <span className="flex items-center gap-1 font-semibold text-amber-300">
                      <Type size={11} /> Text Track (Phụ đề Auto-sub)
                    </span>
                  </div>
                  <div className="h-10 w-full bg-black/40 rounded-xl border border-white/5 flex items-center px-3 shadow-inner">
                    <span className="text-[10px] text-white/30 italic">Kết nối cổng Subtitle Input để tự hiển thị phụ đề</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: BOX 3 (Toolbox & Properties) */}
          <div className="w-[300px] bg-[#0c0c0e]/80 rounded-[24px] p-5 border border-white/10 shadow-2xl flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-bold text-text-primary tracking-wider uppercase border-b border-white/10 pb-2 flex items-center gap-2">
              <Scissors size={14} className="text-rose-400" /> Toolbox & Thuộc tính
            </h3>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSplitClip}
                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Cắt clip tại kim thời gian (Phím S)"
              >
                <Scissors size={14} className="text-rose-400" /> Cắt Clip tại Playhead (S)
              </button>

              <button
                onClick={handleExtractVocals}
                disabled={Boolean(nodeData.isExtractingVocals || !activeVideoUrl)}
                className="w-full py-2 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {nodeData.isExtractingVocals ? <Loader2 size={14} className="animate-spin" /> : <AudioWaveform size={14} />}
                <span>Tách Giọng Nói (Stem)</span>
              </button>
            </div>

            {/* Volume Slider */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span className="flex items-center gap-1.5">
                  <Volume2 size={13} /> Volume
                </span>
                <span className="font-mono text-white/90 bg-white/10 px-2 py-0.5 rounded text-[11px]">{activeClip?.volume || 100}%</span>
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
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:shadow-md"
                style={{
                  background: `linear-gradient(to right, #f43f5e ${(activeClip?.volume || 100) / 2}%, rgba(255,255,255,0.1) ${(activeClip?.volume || 100) / 2}%)`,
                }}
              />
            </div>

            {/* Transform Adjustment (Scale & Rotation) */}
            <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>Zoom Layer</span>
                  <span className="font-mono text-white/90 bg-white/10 px-2 py-0.5 rounded text-[11px]">{activeTransform.scale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={3.0}
                  step={0.05}
                  value={activeTransform.scale}
                  onChange={(e) => updateActiveTransform({ scale: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:shadow-md"
                  style={{
                    background: `linear-gradient(to right, #f43f5e ${((activeTransform.scale - 0.5) / 2.5) * 100}%, rgba(255,255,255,0.1) ${((activeTransform.scale - 0.5) / 2.5) * 100}%)`,
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span className="flex items-center gap-1.5">
                    <RotateCw size={13} /> Xoay Góc
                  </span>
                  <span className="font-mono text-white/90 bg-white/10 px-2 py-0.5 rounded text-[11px]">{activeTransform.rotationDeg}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={5}
                  value={activeTransform.rotationDeg}
                  onChange={(e) => updateActiveTransform({ rotationDeg: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:shadow-md"
                  style={{
                    background: `linear-gradient(to right, #f43f5e ${((activeTransform.rotationDeg + 180) / 360) * 100}%, rgba(255,255,255,0.1) ${((activeTransform.rotationDeg + 180) / 360) * 100}%)`,
                  }}
                />
              </div>
            </div>

            {/* Action Trigger Button */}
            <button
              onClick={handleRunConcat}
              disabled={nodeData.isConcatting || clips.length === 0}
              className="w-full mt-auto py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-white/5 disabled:text-white/40 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(225,29,72,0.6)] disabled:shadow-none transition-all text-xs cursor-pointer"
            >
              {nodeData.isConcatting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : nodeData.output ? (
                <CheckCircle2 size={16} />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
              <span>{nodeData.output ? 'Đã Xuất Video (FFmpeg)' : 'Ghép & Xuất Video'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
