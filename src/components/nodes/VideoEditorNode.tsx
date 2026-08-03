import { useEffect } from 'react';
import { type NodeProps } from '../NodeTypes';
import { canvasEngine, type EdgeData } from '../../engine/canvasEngine';
import type { VideoEditorData, VideoClipItem } from '../../types/nodes';
import { useWorkflowStore } from '../../store/workflowStore';
import {
  Scissors,
  Video,
  AudioWaveform,
  Camera,
  Type,
  Maximize2
} from 'lucide-react';

export function VideoEditorNode({ id, data, selected, onConnectStart, onDisconnectStart }: NodeProps) {
  const nodeData = data as VideoEditorData;
  const clips = nodeData.clips || [];
  const customNodeName = data.nodeName as string;
  const setOpenVideoEditorNodeId = useWorkflowStore((state) => state.setOpenVideoEditorNodeId);

  // Calculate total duration for compact summary
  let currentAccumulated = 0;
  clips.forEach((c) => {
    const dur = c.durationSec || 5;
    currentAccumulated += dur;
  });
  const totalDuration = Math.max(currentAccumulated, 0);

  // Edge scanner to collect incoming video clips automatically
  useEffect(() => {
    const allEdges = canvasEngine.getEdges();
    const videoInEdges = allEdges.filter(
      (e: EdgeData) => e.target === id && (e.targetHandle === 'video_in' || !e.targetHandle)
    );

    if (videoInEdges.length === 0) return;

    const sourceNodes = videoInEdges
      .map((e: EdgeData) => canvasEngine.getNode(e.source))
      .filter((n: any) => n && n.data && (n.data.output || n.data.file));

    if (sourceNodes.length === 0) return;

    const newClips: VideoClipItem[] = [];
    const sourceCountMap = new Map<string, number>();

    sourceNodes.forEach((srcNode: any) => {
      const srcId = srcNode.id;
      const count = (sourceCountMap.get(srcId) || 0) + 1;
      sourceCountMap.set(srcId, count);

      const videoUrl = srcNode.data.output || srcNode.data.file;
      const clipId = count === 1 ? `clip_${srcId}` : `clip_${srcId}_${count}`;

      newClips.push({
        id: clipId,
        sourceNodeId: srcId,
        videoUrl: videoUrl,
        thumbnailUrl: srcNode.data.thumbnailUrl || undefined,
        durationSec: 5,
        order: newClips.length + 1,
      });
    });

    // Check if clips changed meaningfully
    const existingClipIds = clips.map((c) => c.id).join(',');
    const newClipIds = newClips.map((c) => c.id).join(',');

    if (existingClipIds !== newClipIds) {
      canvasEngine.updateNodeData(id, { clips: newClips, output: null });
    }
  }, [id, clips]);

  return (
    <div
      className={`w-[270px] bg-node rounded-2xl shadow-xl border ${
        selected ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-border-subtle hover:border-white/20'
      } transition-all relative select-none`}
    >
      {/* Node Header */}
      <div className="px-4 py-3 bg-white/5 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <Scissors size={13} />
          </div>
          <span className="text-xs font-bold text-text-primary truncate">
            {customNodeName || 'Video Editor'}
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/20 rounded text-rose-400 shrink-0">
          {clips.length} Clips
        </span>
      </div>

      {/* Node Body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Info summary */}
        <div className="flex items-center justify-between text-[11px] text-text-muted bg-canvas/60 px-3 py-2 rounded-xl border border-white/5 font-mono">
          <span>Thời lượng:</span>
          <span className="text-white font-bold">{totalDuration.toFixed(1)}s</span>
        </div>

        {/* Primary Action Button to Open Workspace */}
        <button
          onClick={() => setOpenVideoEditorNodeId(id)}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-all text-xs cursor-pointer"
        >
          <Maximize2 size={14} />
          <span>Mở Video Editor</span>
        </button>
      </div>

      {/* Input Ports (Left) - 3 Separate Ports */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-2 pr-2.5 z-20">
        {/* Port 1: Video */}
        <div
          className="port-handle w-7 h-7 rounded-full border border-[#C6F135]/60 bg-panel flex items-center justify-center text-[#C6F135] hover:border-[#C6F135] cursor-crosshair shadow-md"
          title="Video Input (video_in)"
          data-target={`${id}:video_in`}
          data-portid="video_in"
          onPointerDown={(e) => {
            e.stopPropagation();
            onDisconnectStart?.(e, id, 'video_in');
          }}
        >
          <Camera size={13} />
        </div>

        {/* Port 2: Audio */}
        <div
          className="port-handle w-7 h-7 rounded-full border border-[#38BDF8]/60 bg-panel flex items-center justify-center text-[#38BDF8] hover:border-[#38BDF8] cursor-crosshair shadow-md"
          title="Audio Input (audio_in)"
          data-target={`${id}:audio_in`}
          data-portid="audio_in"
          onPointerDown={(e) => {
            e.stopPropagation();
            onDisconnectStart?.(e, id, 'audio_in');
          }}
        >
          <AudioWaveform size={13} />
        </div>

        {/* Port 3: Subtitle/Text */}
        <div
          className="port-handle w-7 h-7 rounded-full border border-[#F59E0B]/60 bg-panel flex items-center justify-center text-[#F59E0B] hover:border-[#F59E0B] cursor-crosshair shadow-md"
          title="Text/Subtitle Input (subtitle_in)"
          data-target={`${id}:subtitle_in`}
          data-portid="subtitle_in"
          onPointerDown={(e) => {
            e.stopPropagation();
            onDisconnectStart?.(e, id, 'subtitle_in');
          }}
        >
          <Type size={13} />
        </div>
      </div>

      {/* Output Port (Right) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-2 pl-2.5 z-20">
        <div
          className="port-handle w-7 h-7 rounded-full border border-emerald-400/60 bg-panel flex items-center justify-center text-emerald-400 hover:border-emerald-300 cursor-crosshair shadow-md"
          title="Concatenated Video Output (video_out)"
          data-target={`${id}:video_out`}
          data-portid="video_out"
          onPointerDown={(e) => {
            e.stopPropagation();
            onConnectStart?.(e, id, 'out');
          }}
        >
          <Video size={13} />
        </div>
      </div>

      {/* Mention Tag */}
      {customNodeName && (
        <div className="absolute -bottom-5 left-0 text-[10px] font-medium text-text-muted flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-[9px]">
            @
          </div>
          <span className="text-white font-mono">{customNodeName}</span>
        </div>
      )}
    </div>
  );
}
