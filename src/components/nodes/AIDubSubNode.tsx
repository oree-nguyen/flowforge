import { type NodeProps } from '../NodeTypes';
import { getModelMetadata } from '../../store/modelCatalog';
import { useWorkflowStore } from '../../store/workflowStore';
import { Languages, Video, FileText, CheckCircle2, Loader2, UserCheck } from 'lucide-react';
import type { AIDubSubData } from '../../types/nodes';

export function AIDubSubNode({ id, data, selected, onConnectStart, onDisconnectStart }: NodeProps) {
  const nodeData = data as AIDubSubData;
  const modelId = nodeData.sttModel || 'openai/whisper';
  const fetchedModels = useWorkflowStore((state) => state.fetchedModels);
  const meta = getModelMetadata(modelId, fetchedModels);

  const displayName = meta?.name || modelId;
  const customNodeName = data.nodeName as string;

  const currentStep = nodeData.statusStep || 0;
  const isGenerating = nodeData.isGenerating;
  const isWaitingCasting = currentStep === 3;

  const steps = [
    'Tách audio',
    'Nhận diện & Speaker',
    'Casting giọng',
    'Dịch thuật',
    'Lồng tiếng (TTS)',
    'Canh thời gian',
    'Xuất Video/Sub',
  ];

  return (
    <div className="relative group">
      {/* Node Label above node */}
      <div className="absolute -top-6 left-0 label-micro text-text-primary flex items-center gap-1.5">
        <Languages size={14} className="text-[#6366F1]" /> Dub & Sub
      </div>

      {/* Main Node Card */}
      <div className={`w-[320px] flex rounded-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${selected ? 'border-accent-lime shadow-elev-node-selected' : 'border-defined shadow-elev-node'}`}>
        <div className="w-[3px] bg-[#6366F1] shrink-0 rounded-l-xl" />

        <div className="flex-1 flex flex-col bg-surface-1 rounded-r-xl overflow-hidden">
          {/* Node Header */}
          <div className="px-3 h-8 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="title-node text-text-primary truncate">
                {customNodeName || 'AI Dub & Sub'}
              </span>
            </div>
            <span className="label-micro px-1.5 py-0.5 bg-[#6366F1]/12 text-[#6366F1] rounded shrink-0">
              {nodeData.mode || 'Subtitle'} Mode
            </span>
          </div>

          {/* Node Content */}
          <div className="p-3 flex flex-col gap-3">
            {/* Target Languages Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-text-muted">Đích:</span>
              {(nodeData.targetLanguages || ['en']).map((lang) => (
                <span
                  key={lang}
                  className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300"
                >
                  {lang}
                </span>
              ))}
            </div>

            {/* Waiting for Casting Banner */}
            {isWaitingCasting && (
              <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-2.5 flex items-center gap-2 text-amber-300 text-xs animate-pulse">
                <UserCheck size={16} className="shrink-0 text-amber-400" />
                <div className="flex-1">
                  <div className="font-semibold">Bổ sung Casting giọng</div>
                  <div className="text-[10px] opacity-80">Mở panel bên phải để chọn giọng cho nhân vật</div>
                </div>
              </div>
            )}

            {/* Generating Progress State */}
            {isGenerating && !isWaitingCasting && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-indigo-300">
                  <span className="flex items-center gap-1.5 truncate">
                    <Loader2 size={12} className="animate-spin text-indigo-400" />
                    {nodeData.statusMessage || `Đang chạy bước ${currentStep}/7...`}
                  </span>
                  <span className="font-mono text-[10px]">{Math.round((currentStep / 7) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-canvas rounded-full overflow-hidden border border-border-subtle">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${(currentStep / 7) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Stepper overview */}
            <div className="grid grid-cols-7 gap-1 pt-1">
              {steps.map((stName, idx) => {
                const stepNum = idx + 1;
                const isDone = currentStep > stepNum;
                const isCurrent = currentStep === stepNum;

                return (
                  <div
                    key={stName}
                    title={`${stepNum}. ${stName}`}
                    className={`h-1.5 rounded-full transition-all ${
                      isDone
                        ? 'bg-indigo-500'
                        : isCurrent
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-white/10'
                    }`}
                  />
                );
              })}
            </div>

            {/* Output Preview */}
            {nodeData.outputVideo ? (
              <div className="bg-surface-3 border border-hairline rounded-md p-2.5 flex items-center justify-between">
                <span className="label-small text-state-success flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={14} /> Ready Output Video
                </span>
                <a
                  href={nodeData.outputVideo}
                  download="dubbed_video.webm"
                  className="label-micro px-2.5 py-1 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded transition-colors"
                >
                  Tải Video
                </a>
              </div>
            ) : !isGenerating && !isWaitingCasting && (
              <div className="body text-text-muted italic opacity-50 flex items-center justify-between">
                <span>Sẵn sàng chạy</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 border-t border-hairline bg-surface-1 flex items-center justify-between">
             <span className="label-small text-text-muted truncate">{modelId}</span>
          </div>
        </div>
      </div>

      {/* Input Ports (Left) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-2 pr-2.5 z-20">
        <div
          className="port-handle w-8 h-8 rounded-full border border-indigo-400/50 bg-panel flex items-center justify-center text-indigo-400 hover:text-indigo-300 hover:border-indigo-300 cursor-crosshair shadow-md"
          title="Video Input (video_in)"
          data-target={`${id}:video_in`}
          data-portid="video_in"
          onPointerDown={(e) => {
            e.stopPropagation();
            onDisconnectStart?.(e, id, 'video_in');
          }}
        >
          <Video size={14} />
        </div>
      </div>

      {/* Output Ports (Right) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-2 pl-2.5 z-20">
        <div
          className="port-handle w-8 h-8 rounded-full border border-emerald-400/50 bg-panel flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:border-emerald-300 cursor-crosshair shadow-md"
          title="Dubbed Video Output (video_out)"
          data-target={`${id}:video_out`}
          data-portid="video_out"
          onPointerDown={(e) => {
            e.stopPropagation();
            onConnectStart?.(e, id, 'out');
          }}
        >
          <Video size={14} />
        </div>

        <div
          className="port-handle w-8 h-8 rounded-full border border-purple-400/50 bg-panel flex items-center justify-center text-purple-400 hover:text-purple-300 hover:border-purple-300 cursor-crosshair shadow-md"
          title="Subtitle File Output (subtitle_out)"
          data-target={`${id}:subtitle_out`}
          data-portid="subtitle_out"
          onPointerDown={(e) => {
            e.stopPropagation();
            onConnectStart?.(e, id, 'out');
          }}
        >
          <FileText size={14} />
        </div>
      </div>

      {/* Node Mention Tag */}
      {customNodeName && (
        <div className="absolute -bottom-6 left-0 text-[10px] font-medium text-text-muted flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded-full bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center text-[#6366F1]">
            @
          </div>
          <span className="text-white font-mono">{customNodeName}</span>
        </div>
      )}
    </div>
  );
}
