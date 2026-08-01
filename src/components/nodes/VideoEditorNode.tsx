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
  Trash2,
  AudioWaveform,
  Volume2,
  Layers,
  Sliders,
  RotateCw,
  Maximize2,
  Music,
  Camera,
  Type,
  VolumeX,
  Settings,
  Copy
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

export function VideoEditorNode({ id, data, selected, onConnectStart, onDisconnectStart }: NodeProps) {
  const nodeData = data as VideoEditorData;
  const clips = nodeData.clips || [];
  const customNodeName = data.nodeName as string;

  const [selectedClipId, setSelectedClipId] = useState<string>(clips[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Calculate global start/end times for clips
  let currentAccumulated = 0;
  const clipsWithTime = [...clips].sort((a,b) => a.order - b.order).map(c => {
     // use 5s default if durationSec is missing to make previewing easier
     const dur = c.durationSec || 5; 
     const start = currentAccumulated;
     const end = start + dur;
     currentAccumulated = end;
     return { ...c, start, end };
  });
  
  // Update total duration
  const totalDuration = Math.max(currentAccumulated, 30);

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
  const isDraggingClipRef = useRef(false);
  const isDraggingPlayheadRef = useRef(false);

  useEffect(() => {
    isDraggingPlayheadRef.current = isDraggingPlayhead;
  }, [isDraggingPlayhead]);

  // Click-outside listener to turn off Edit Mode safely when mouseup occurs outside node
  useEffect(() => {
    if (!isEditMode) return;

    const handleWindowMouseUp = (e: MouseEvent) => {
      // Lock exit if currently dragging clip or playhead
      if (isDraggingClipRef.current || isDraggingPlayheadRef.current) {
        return;
      }

      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsEditMode(false);
      }
    };

    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, [isEditMode]);

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
  };

  // Playhead Sync Loop
  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();
    
    const loop = (time: number) => {
      if (isPlaying) {
        const delta = (time - lastTime) / 1000;
        setCurrentTime(prev => {
          let next = prev + delta;
          if (next >= totalDuration) {
             next = 0; // Loop around
          }
          return next;
        });
      }
      lastTime = time;
      rafId = requestAnimationFrame(loop);
    };

    if (isPlaying) {
       rafId = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, totalDuration]);

  // Sync selected clip with playhead
  useEffect(() => {
     if (!nodeData.output && isPlaying) {
        const c = clipsWithTime.find(x => currentTime >= x.start && currentTime < x.end);
        if (c && c.id !== selectedClipId) {
           setSelectedClipId(c.id);
        }
     }
  }, [currentTime, isPlaying, clipsWithTime, selectedClipId, nodeData.output]);

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

    const inputEdges = edges.filter((e: EdgeData) => e.target === id && ['videos_in', 'video_in', 'audio_in', 'subtitle_in'].includes(e.targetHandle || ''));
    let hasChanged = false;
    const currentClips = [...clips];

    // Filter out removed edges for VIDEO track, but keep duplicated clips (same sourceNodeId)
    const videoEdges = inputEdges.filter(e => e.targetHandle === 'videos_in' || e.targetHandle === 'video_in');
    const validClips = currentClips.filter((c) => videoEdges.some((e: EdgeData) => e.source === c.sourceNodeId));
    if (validClips.length !== currentClips.length) {
      hasChanged = true;
    }

    // Add new connected edges & check for Dubbing/Sub node connections
    let subtitleTrack: any[] = [];
    let dubAudioTrack: any[] = [];

    inputEdges.forEach((edge: EdgeData) => {
      const sourceNode = nodes.find((n: NodeData) => n.id === edge.source);
      const sourceOutput = sourceNode?.data?.output || sourceNode?.data?.outputVideo || sourceNode?.data?.file || sourceNode?.data?.url;

      // Process AI DubSub specifically to extract rich segments
      if (sourceNode?.type === 'ai.dubSub' && edge.targetHandle === 'subtitle_in') {
        const segments = sourceNode.data?.segments as any[];
        if (segments && Array.isArray(segments)) {
          subtitleTrack = segments.map((s) => ({
            start: s.start,
            end: s.end,
            text: s.text,
          }));
        }
      }
      if (sourceNode?.type === 'ai.dubSub' && edge.targetHandle === 'audio_in') {
        if (sourceNode.data?.outputVideo) {
          const segments = sourceNode.data?.segments as any[];
          dubAudioTrack.push({
            start: 0,
            end: Math.max(10, (segments?.[segments.length - 1]?.end || 10)),
            audioUrl: sourceNode.data.outputVideo,
          });
        }
      } else if (edge.targetHandle === 'audio_in' && sourceOutput && sourceNode?.type !== 'ai.dubSub') {
         dubAudioTrack.push({ start: 0, end: 10, audioUrl: String(sourceOutput) });
         hasChanged = true; // Force trigger changes if new generic audio is added
      } else if (edge.targetHandle === 'subtitle_in' && sourceOutput && sourceNode?.type !== 'ai.dubSub') {
         subtitleTrack.push({ start: 0, end: 10, text: String(sourceOutput) });
         hasChanged = true; // Force trigger changes if new generic text is added
      }

      // Process Video Track additions
      const isVideoPort = edge.targetHandle === 'videos_in' || edge.targetHandle === 'video_in';
      if (isVideoPort) {
        const existing = validClips.find((c) => c.id === edge.id);
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

  const handleDragStart = () => {
    isDraggingClipRef.current = true;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    isDraggingClipRef.current = false;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = clips.findIndex((c) => c.id === active.id);
      const newIndex = clips.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(clips, oldIndex, newIndex).map((c, idx) => ({ ...c, order: idx }));
      canvasEngine.updateNodeData(id, { clips: reordered });
    }
  };

  const handleDragCancel = () => {
    isDraggingClipRef.current = false;
  };

  const handleRemoveClip = (clipId: string) => {
    const filtered = clips.filter((c) => c.id !== clipId).map((c, idx) => ({ ...c, order: idx }));
    canvasEngine.updateNodeData(id, { clips: filtered });
    if (selectedClipId === clipId) {
      setSelectedClipId(filtered[0]?.id || '');
    }
  };

  const handleDuplicateClip = (clip: VideoClipItem) => {
    const newClipId = `clip_copy_${Date.now()}`;
    const newClip: VideoClipItem = {
      ...clip,
      id: newClipId,
      order: clip.order + 1,
    };
    const newClips = [...clips];
    newClips.splice(clip.order + 1, 0, newClip);
    const reordered = newClips.map((c, idx) => ({ ...c, order: idx }));
    canvasEngine.updateNodeData(id, { clips: reordered });
    setSelectedClipId(newClipId);
  };

  // Split Clip at current playhead
  const handleSplitClip = () => {
    let newClips = [...clips].sort((a,b) => a.order - b.order);
    let hasChanges = false;
    
    // Split Video
    const targetClipIndex = clipsWithTime.findIndex(c => currentTime > c.start + 0.1 && currentTime < c.end - 0.1); 
    if (targetClipIndex !== -1) {
       const targetClip = clipsWithTime[targetClipIndex];
       const localSplitTime = currentTime - targetClip.start;
       
       const newClipId = `clip_split_${Date.now()}`;
       const secondHalf: VideoClipItem = {
         ...targetClip,
         id: newClipId,
         trimStart: (targetClip.trimStart || 0) + localSplitTime,
       };
       
       newClips[targetClipIndex] = {
         ...newClips[targetClipIndex],
         trimEnd: (targetClip.trimStart || 0) + localSplitTime,
         durationSec: localSplitTime,
       };
       
       secondHalf.durationSec = (targetClip.durationSec || 5) - localSplitTime;
       newClips.splice(targetClipIndex + 1, 0, secondHalf);
       hasChanges = true;
    }
    
    // Split Audio
    let newAudio = [...(nodeData.dubAudioTrack || [])];
    let audioChanges = false;
    for (let i = newAudio.length - 1; i >= 0; i--) {
       const a = newAudio[i];
       if (currentTime > a.start + 0.1 && currentTime < a.end - 0.1) {
          const secondHalf = { ...a, start: currentTime };
          newAudio[i] = { ...a, end: currentTime };
          newAudio.splice(i + 1, 0, secondHalf);
          audioChanges = true;
       }
    }
    
    // Split Subtitle
    let newSub = [...(nodeData.subtitleTrack || [])];
    let subChanges = false;
    for (let i = newSub.length - 1; i >= 0; i--) {
       const s = newSub[i];
       if (currentTime > s.start + 0.1 && currentTime < s.end - 0.1) {
          const secondHalf = { ...s, start: currentTime };
          newSub[i] = { ...s, end: currentTime };
          newSub.splice(i + 1, 0, secondHalf);
          subChanges = true;
       }
    }
    
    if (hasChanges || audioChanges || subChanges) {
       canvasEngine.updateNodeData(id, {
          clips: newClips.map((c, idx) => ({...c, order: idx})),
          dubAudioTrack: newAudio,
          subtitleTrack: newSub
       });
    }
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

  const currentGlobalClip = clipsWithTime.find(c => currentTime >= c.start && currentTime < c.end) || clipsWithTime[0];
  const activeVideoUrl = nodeData.output || currentGlobalClip?.videoUrl;
  
  const getClipLabel = (index: number) => {
     const c = clips[index];
     if (!c) return `#${index + 1}`;
     let count = 0;
     for (let i = 0; i <= index; i++) {
        if (clips[i].sourceNodeId === c.sourceNodeId) count++;
     }
     const uniqueSources = Array.from(new Set(clips.map(x => x.sourceNodeId)));
     const baseIndex = uniqueSources.indexOf(c.sourceNodeId) + 1;
     return count === 1 ? `#${baseIndex}` : `#${baseIndex}.${count - 1}`;
  };

  const activeClip = clips.find((c) => c.id === selectedClipId) || clips[0];

  const handleKeyDown = (e: React.KeyboardEvent) => {
     if (!isEditMode) return;
     
     // Stop propagation so CanvasEngine doesn't trigger global shortcuts
     e.stopPropagation();
     
     switch(e.key.toLowerCase()) {
        case 'escape': 
           setIsEditMode(false); 
           containerRef.current?.blur();
           break;
        case ' ': // Space
           e.preventDefault(); // prevent scrolling
           if (videoRef.current) {
              if (isPlaying) videoRef.current.pause();
              else videoRef.current.play();
              setIsPlaying(!isPlaying);
           }
           break;
        case 's': // Split
           e.preventDefault();
           handleSplitClip();
           break;
        case 'c': // Duplicate
           e.preventDefault();
           if (selectedClipId) {
              const activeC = clips.find(c => c.id === selectedClipId);
              if (activeC) handleDuplicateClip(activeC);
           }
           break;
        case 'delete':
        case 'backspace':
           e.preventDefault();
           if (selectedClipId) handleRemoveClip(selectedClipId);
           break;
        case 'arrowleft':
           e.preventDefault();
           setCurrentTime(prev => {
              const t = Math.max(0, prev - 1);
              if (videoRef.current) {
                 let localTime = t;
                 if (!nodeData.output && currentGlobalClip) {
                    localTime = Math.max(0, t - currentGlobalClip.start);
                 }
                 videoRef.current.currentTime = localTime;
              }
              return t;
           });
           break;
        case 'arrowright':
           e.preventDefault();
           setCurrentTime(prev => {
              const t = Math.min(totalDuration, prev + 1);
              if (videoRef.current) {
                 let localTime = t;
                 if (!nodeData.output && currentGlobalClip) {
                    localTime = Math.max(0, t - currentGlobalClip.start);
                 }
                 videoRef.current.currentTime = localTime;
              }
              return t;
           });
           break;
     }
  };

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={(e) => {
         if (!isEditMode) {
            setIsEditMode(true);
            containerRef.current?.focus();
         } else {
            // Stop propagation to prevent node dragging or canvas panning when in edit mode
            e.stopPropagation();
         }
      }}
      className={`relative group select-none outline-none transition-all ${
         isEditMode ? 'ring-1 ring-white/30 rounded-[24px]' : ''
      }`}
    >
      {/* Visual Indicator for Edit Mode */}
      {isEditMode && (
         <div className="absolute -top-10 right-0 bg-black/80 backdrop-blur-md text-white text-[10px] font-mono font-medium px-3 py-1 rounded-full shadow-lg border border-white/20 flex items-center gap-1.5 z-50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            EDIT MODE (Nhấn ESC hoặc Click ra ngoài để thoát)
         </div>
      )}

      {/* Node Label above node */}
      <div className="absolute -top-6 left-0 text-xs font-medium text-text-primary flex items-center gap-2">
        <Scissors size={14} className="text-rose-400" /> CapCut Workstation (3 Khung & Tách Giọng)
      </div>

      {/* Floating Header Bar */}
      <div className="mb-4 px-4 py-3 bg-black/40 backdrop-blur-md rounded-[20px] border border-white/10 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Scissors size={16} />
          </div>
          <span className="text-sm font-bold text-white tracking-wide truncate">
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

      <div className="flex gap-4 items-stretch relative">
        {/* LEFT COLUMN: BOX 1 (Preview + Timeline combined) */}
        <div
          className={`w-[470px] bg-[#0c0c0e]/95 backdrop-blur-xl rounded-[24px] p-4 border shadow-2xl flex flex-col gap-4 transition-all ${
            selected ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-white/10 hover:border-white/20'
          }`}
        >
          {/* --- Nửa trên: Preview --- */}
          <div className="flex flex-col gap-3 border-b border-white/10 pb-4">
            {/* Aspect Ratio Pills */}
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-text-muted font-medium flex items-center gap-1">
                <Maximize2 size={11} className="text-rose-400" /> Frame Ratio:
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
            <div className="w-full aspect-video bg-black rounded-xl relative flex items-center justify-center overflow-hidden border border-white/10 shadow-inner group/canvas">
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
                    autoPlay={isPlaying}
                    onEnded={() => {
                       if (!nodeData.output) {
                          // Allow the RAF loop to naturally push currentTime forward, 
                          // which will switch activeVideoUrl and autoPlay the next clip
                       } else {
                          setIsPlaying(false);
                          setCurrentTime(0);
                       }
                    }}
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
            <div className="flex items-center gap-3 pt-2 text-[11px]">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    if (isPlaying) videoRef.current.pause();
                    else videoRef.current.play();
                    setIsPlaying(!isPlaying);
                  }
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all shrink-0"
              >
                {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
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
                  
                  // Optional: sync local video time if scrubbing
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
                  background: `linear-gradient(to right, #f43f5e ${(currentTime / (totalDuration || 100)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (totalDuration || 100)) * 100}%)`
                }}
              />
              <span className="font-mono text-[10px] text-text-muted shrink-0 w-16 text-right">
                {currentTime.toFixed(1)}s / {(totalDuration || 0).toFixed(1)}s
              </span>
            </div>
          </div>

          {/* --- Nửa dưới: Timeline --- */}
          <div className="flex flex-col gap-3 pt-1">
            {/* Timeline Title Bar */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-primary font-bold flex items-center gap-1.5">
                <Layers size={13} className="text-rose-400" /> Multi-track Timeline
              </span>
              <span className="text-[10px] font-mono text-text-muted">
                {clips.length} clips • {totalDuration.toFixed(1)}s
              </span>
            </div>

            {/* Time Axis Container with Ruler & Playhead */}
            <div
              ref={timelineRef}
              className="relative overflow-x-auto custom-scrollbar pb-3 flex flex-col gap-2.5 min-w-full cursor-pointer"
              onPointerDown={(e) => handleRulerScrub(e.clientX)}
            >
            {/* 1. TOP RULER (Thước thời gian) */}
            <div className="relative h-6 w-full min-w-[420px] border-b border-white/10 flex items-end pb-1 bg-black/20 rounded-t-xl">
              {timeTicks.map((tick) => (
                <div
                  key={tick.sec}
                  className="absolute bottom-0 flex flex-col items-center transform -translate-x-1/2"
                  style={{ left: `${(tick.sec / totalDuration) * 100}%` }}
                >
                  <span className="text-[8px] font-mono text-text-muted/60 mb-0.5">{tick.label}</span>
                  <div className="w-[1px] h-1.5 bg-white/10" />
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

            {/* 3. TRACKS CONTAINER (3 Track xếp chồng: Video -> Audio -> Text) */}
            <div className="relative flex flex-col gap-2.5 w-full min-w-[420px]">
              {/* --- TRACK 1: VIDEO CLIPS (Black Box) --- */}
              {clips.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[9px] font-mono text-white/50 tracking-wider pl-1 pr-2">
                    <span className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation();
                          const updated = clips.map(c => ({ ...c, isMuted: !c.isMuted }));
                          canvasEngine.updateNodeData(id, { clips: updated });
                        }}
                        className="hover:text-white transition-colors"
                        title={clips.some(c => c.isMuted) ? 'Bật âm thanh Track Video' : 'Tắt âm thanh Track Video'}
                      >
                        {clips.some(c => c.isMuted) ? <VolumeX size={11} className="text-rose-400" /> : <Volume2 size={11} />}
                      </button>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/80" /> VIDEO
                    </span>
                  </div>
                  <div className="relative h-14 w-full bg-black/40 rounded-xl border border-white/5 flex items-center p-1.5 shadow-inner">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
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
              )}

              {/* --- TRACK 2: AUDIO / DUBBING (Sky Blue #38BDF8) --- */}
              {nodeData.dubAudioTrack && nodeData.dubAudioTrack.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[9px] font-mono text-[#38BDF8]/60 tracking-wider pl-1 pr-2">
                    <span className="flex items-center gap-2">
                      <button className="hover:text-[#38BDF8] transition-colors">
                        <Volume2 size={11} />
                      </button>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" /> AUDIO
                    </span>
                  </div>
                  <div className="relative h-8 w-full bg-black/40 rounded-xl border border-white/5 flex items-center px-1 shadow-inner">
                    {nodeData.dubAudioTrack.map((dub, idx) => {
                      const leftPct = (dub.start / totalDuration) * 100;
                      const widthPct = Math.max(8, ((dub.end - dub.start) / totalDuration) * 100);
                      return (
                        <div
                          key={idx}
                          className="absolute top-1 bottom-1 bg-gradient-to-r from-[#38BDF8]/20 to-[#38BDF8]/40 border border-[#38BDF8]/50 text-white font-medium rounded-lg px-2 flex items-center gap-1.5 shadow-sm text-[10px] truncate group/dub hover:brightness-125 cursor-pointer backdrop-blur-sm transition-all"
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                          }}
                          title={`Audio ${idx + 1}`}
                        >
                          <Music size={11} className="shrink-0 text-[#38BDF8]" />
                          <span className="truncate text-[9px]">Audio {idx + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- TRACK 3: SUBTITLE / TEXT (Purple #A855F7) --- */}
              {nodeData.subtitleTrack && nodeData.subtitleTrack.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[9px] font-mono text-[#A855F7]/60 tracking-wider pl-1 pr-2">
                    <span className="flex items-center gap-2">
                      <button className="hover:text-[#A855F7] transition-colors">
                        <Type size={11} />
                      </button>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" /> SUBTITLE
                    </span>
                  </div>
                  <div className="relative h-8 w-full bg-black/40 rounded-xl border border-white/5 flex items-center px-1 shadow-inner">
                    {nodeData.subtitleTrack.map((sub, idx) => {
                      const leftPct = (sub.start / totalDuration) * 100;
                      const widthPct = Math.max(6, ((sub.end - sub.start) / totalDuration) * 100);
                      return (
                        <div
                          key={idx}
                          className="absolute top-1 bottom-1 bg-gradient-to-r from-[#A855F7]/20 to-[#A855F7]/40 border border-[#A855F7]/50 text-white font-medium rounded-lg px-2 flex items-center gap-1.5 shadow-sm text-[10px] truncate group/sub hover:brightness-125 cursor-pointer backdrop-blur-sm transition-all"
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          title={`[${sub.start.toFixed(1)}s - ${sub.end.toFixed(1)}s]: ${sub.text}`}
                        >
                          <span className="font-serif font-black text-[10px] shrink-0 text-[#d8b4fe]">S{idx + 1}</span>
                          <span className="truncate text-[9px] font-normal">{sub.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state when NO tracks exist */}
              {clips.length === 0 && (!nodeData.dubAudioTrack || nodeData.dubAudioTrack.length === 0) && (!nodeData.subtitleTrack || nodeData.subtitleTrack.length === 0) && (
                <div className="h-20 w-full rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-white/30 text-[10px] italic">
                   <Settings size={16} className="opacity-50" />
                   <span>Kéo dây nối từ các node khác vào các port bên trái để hiển thị Track</span>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* RIGHT COLUMN: BOX 2 (Toolbox) */}
        <div
          className={`w-[240px] shrink-0 bg-[#0c0c0e]/95 backdrop-blur-xl rounded-[24px] p-4 border shadow-2xl flex flex-col gap-4 transition-all ${
            selected ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-white/10 hover:border-white/20'
          }`}
        >
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-2">
            <Sliders size={14} className="text-rose-400" /> Toolbox
          </span>

          {/* Split Clip Button */}
          <button
            onClick={handleSplitClip}
            disabled={!selectedClipId}
            className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 rounded-xl text-[11px] text-white font-medium flex items-center gap-2 transition-all shadow-sm"
          >
            <Scissors size={14} className="text-rose-400" /> Cắt Clip tại Playhead
          </button>

          {/* Extract Audio Button */}
          <button
            onClick={handleExtractAudio}
            disabled={nodeData.isSeparatingAudio}
            className="w-full py-2 px-3 bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 rounded-xl text-[11px] font-medium flex items-center gap-2 transition-all shadow-sm"
          >
            <AudioWaveform size={14} className="text-[#38BDF8]" /> Tách Giọng Nói (Stem)
          </button>

          {/* Volume Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-white/70">
              <span className="flex items-center gap-1.5">
                <Volume2 size={12} /> Volume
              </span>
              <span className="font-mono text-white/90 bg-white/10 px-1.5 py-0.5 rounded-md">{activeClip?.volume || 100}%</span>
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
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:shadow-md"
              style={{
                background: `linear-gradient(to right, #f43f5e ${(activeClip?.volume || 100) / 2}%, rgba(255,255,255,0.1) ${(activeClip?.volume || 100) / 2}%)`
              }}
            />
          </div>

          {/* Transform Adjustment (Scale & Rotation) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-[11px] text-white/70">
              <span>Zoom</span>
              <span className="font-mono text-white/90 bg-white/10 px-1.5 py-0.5 rounded-md">{activeTransform.scale.toFixed(2)}x</span>
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
                background: `linear-gradient(to right, #f43f5e ${((activeTransform.scale - 0.5) / 2.5) * 100}%, rgba(255,255,255,0.1) ${((activeTransform.scale - 0.5) / 2.5) * 100}%)`
              }}
            />

            <div className="flex items-center justify-between text-[11px] text-white/70 mt-1">
              <span className="flex items-center gap-1.5">
                <RotateCw size={12} /> Xoay Góc
              </span>
              <span className="font-mono text-white/90 bg-white/10 px-1.5 py-0.5 rounded-md">{activeTransform.rotationDeg}°</span>
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
                background: `linear-gradient(to right, #f43f5e ${((activeTransform.rotationDeg + 180) / 360) * 100}%, rgba(255,255,255,0.1) ${((activeTransform.rotationDeg + 180) / 360) * 100}%)`
              }}
            />
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={handleRunConcat}
            disabled={nodeData.isConcatting || clips.length === 0}
            className="w-full mt-auto py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-white/5 disabled:text-white/40 text-white rounded-[14px] font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(225,29,72,0.6)] disabled:shadow-none transition-all text-xs"
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

      {/* Input Ports (Left) - 3 Separate Type-specific Ports */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-2 pr-2.5 z-20">
        {/* Port 1: Video */}
        <div
          className="port-handle w-8 h-8 rounded-full border border-[#C6F135]/50 bg-panel flex items-center justify-center text-[#C6F135] hover:text-[#C6F135] hover:border-[#C6F135] cursor-crosshair shadow-md"
          title="Video Input (video_in)"
          data-target={`${id}:video_in`}
          data-portid="video_in"
          onPointerDown={(e) => {
            e.stopPropagation();
            onDisconnectStart?.(e, id, 'video_in');
          }}
        >
          <Camera size={14} />
        </div>
        
        {/* Port 2: Audio */}
        <div
          className="port-handle w-8 h-8 rounded-full border border-[#38BDF8]/50 bg-panel flex items-center justify-center text-[#38BDF8] hover:text-[#38BDF8] hover:border-[#38BDF8] cursor-crosshair shadow-md"
          title="Audio Input (audio_in)"
          data-target={`${id}:audio_in`}
          data-portid="audio_in"
          onPointerDown={(e) => {
            e.stopPropagation();
            onDisconnectStart?.(e, id, 'audio_in');
          }}
        >
          <AudioWaveform size={14} />
        </div>
        
        {/* Port 3: Subtitle/Text */}
        <div
          className="port-handle w-8 h-8 rounded-full border border-[#F59E0B]/50 bg-panel flex items-center justify-center text-[#F59E0B] hover:text-[#F59E0B] hover:border-[#F59E0B] cursor-crosshair shadow-md"
          title="Text/Subtitle Input (subtitle_in)"
          data-target={`${id}:subtitle_in`}
          data-portid="subtitle_in"
          onPointerDown={(e) => {
            e.stopPropagation();
            onDisconnectStart?.(e, id, 'subtitle_in');
          }}
        >
          <Type size={14} />
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
