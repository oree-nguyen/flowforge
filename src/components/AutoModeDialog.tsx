import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clapperboard, Sparkles, CheckCircle2, AlertTriangle, X, Play, Wand2 } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { generateAutoWorkflow, type AutoWorkflowProgress } from '../services/autoWorkflowOrchestrator';
import { canvasEngine } from '../engine/canvasEngine';
import { toast } from '../store/toastStore';

interface AutoModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXAMPLE_TOPICS = [
  'Trận chiến nảy lửa giữa Ninja Rồng và Chiến Binh Robot ở thành phố Cyberpunk neon, kết thúc tại đỉnh tháp ánh sáng',
  'Hành trình phiêu lưu của cậu bé cùng con rồng thần màu xanh ngọc qua vùng đất sa mạc huyền bí để tìm lại viên ngọc cổ',
  'Phim ngắn kinh dị viễn tưởng: Trạm không gian bỏ hoang bị sinh vật bóng tối xâm nhập, phi hành gia duy nhất tìm cách thoát thân',
];

export function AutoModeDialog({ isOpen, onClose }: AutoModeDialogProps) {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<AutoWorkflowProgress | null>(null);
  const [generatedResult, setGeneratedResult] = useState<{ nodesCount: number; edgesCount: number } | null>(null);

  const apiKey = useWorkflowStore(state => state.apiKey);
  const setIsSettingsOpen = useWorkflowStore(state => state.setIsSettingsOpen);

  if (!isOpen) return null;

  const handleStartAuto = async () => {
    if (!topic.trim()) {
      toast.warning('Vui lòng nhập chủ đề/ý tưởng phim!');
      return;
    }

    if (!apiKey) {
      toast.warning('Vui lòng nhập OpenRouter API Key trong Cài đặt trước khi dùng Chế độ Auto!');
      setIsSettingsOpen(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedResult(null);
    setProgress({ stage: 'call1_scene_analysis', message: 'Đang chuẩn bị khởi chạy AI Orchestrator...', percent: 5 });

    try {
      const { nodes, edges } = await generateAutoWorkflow(
        apiKey,
        topic.trim(),
        (prog) => setProgress(prog)
      );

      // Deserialise or append nodes to current workflow canvas
      if (nodes.length > 0) {
        const currentNodes = canvasEngine.getNodes();

        if (currentNodes.length === 0) {
          canvasEngine.deserialize({ nodes, edges, viewport: { x: 0, y: 0, zoom: 0.75 } });
        } else {
          nodes.forEach(n => canvasEngine.addNode(n));
          edges.forEach(e => canvasEngine.addEdge(e));
        }

        setGeneratedResult({ nodesCount: nodes.length, edgesCount: edges.length });
        toast.success(`Đã tự động tạo ${nodes.length} nodes & ${edges.length} kết nối!`);
      }
    } catch (err: any) {
      console.error('[AutoMode Error]:', err);
      toast.error('Lỗi khi tạo Workflow tự động: ' + (err.message || 'Không xác định'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyExample = (ex: string) => {
    setTopic(ex);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl bg-[#0E0E12] border border-accent-lime/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col gap-6"
      >
        {/* Glow ambient background inside dialog */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(198,241,53,0.2) 0%, transparent 70%)' }}
        />

        {/* Dialog Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-lime/10 border border-accent-lime/30 flex items-center justify-center text-accent-lime shadow-[0_0_15px_rgba(198,241,53,0.2)]">
              <Clapperboard size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Chế độ Auto — Tạo Workflow Phim bằng AI
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-accent-lime/20 text-accent-lime border border-accent-lime/30">
                  DEEPSEEK ORCHESTRATOR
                </span>
              </h2>
              <p className="text-xs text-text-muted">Nhập ý tưởng phim, AI sẽ tự động phân tích kịch bản & sinh toàn bộ DAG workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Body */}
        {!isGenerating && !generatedResult && (
          <div className="flex flex-col gap-5">
            {/* Input Form */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Wand2 size={14} className="text-accent-lime" /> Chủ đề / Ý tưởng phim
                </span>
                <span className="text-[11px] text-text-muted">Tiếng Việt hoặc Tiếng Anh</span>
              </label>

              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Ví dụ: Phim hành động ngắn kể về 2 robot đánh nhau ở thành phố tương lai, có cảnh rượt đuổi bằng xe bay..."
                rows={4}
                className="w-full bg-[#121216] border border-white/15 focus:border-accent-lime focus:bg-[#16161F] rounded-2xl p-4 text-xs text-white placeholder-text-muted/60 outline-none transition-all leading-relaxed resize-none shadow-inner"
              />
            </div>

            {/* Example Prompts */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium text-text-muted flex items-center gap-1">
                <Sparkles size={12} className="text-amber-400" /> Gợi ý chủ đề nhanh:
              </span>
              <div className="flex flex-col gap-1.5">
                {EXAMPLE_TOPICS.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyExample(ex)}
                    className="text-left text-[11px] text-text-muted hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 p-2.5 rounded-xl transition-all truncate"
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>

            {/* Config Info */}
            <div className="p-3.5 rounded-xl bg-canvas/40 border border-white/5 flex items-center justify-between text-[11px] text-text-muted">
              <span>Mô hình mặc định sinh ảnh & video:</span>
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded bg-white/10 text-accent-lime">FLUX.1 Schnell</span>
                <span>+</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-emerald-400">MiniMax Video-01</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleStartAuto}
              className="w-full py-4 rounded-2xl bg-accent-lime text-black font-extrabold text-sm shadow-[0_0_30px_rgba(198,241,53,0.4)] hover:shadow-[0_0_50px_rgba(198,241,53,0.7)] transition-all flex items-center justify-center gap-2 tracking-wide mt-2"
            >
              <Wand2 size={16} />
              TỰ ĐỘNG TẠO WORKFLOW PHIM
            </button>
          </div>
        )}

        {/* Loading Progress State */}
        {isGenerating && progress && (
          <div className="flex flex-col items-center justify-center py-8 gap-6 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-accent-lime/20 border-t-accent-lime animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Clapperboard size={24} className="text-accent-lime animate-pulse" />
              </div>
            </div>

            <div className="flex flex-col gap-2 max-w-md">
              <h3 className="text-sm font-bold text-white">AI đang xây dựng Workflow Phim...</h3>
              <p className="text-xs text-text-muted leading-relaxed">{progress.message}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md bg-canvas rounded-full h-2 overflow-hidden border border-white/10 p-0.5">
              <motion.div
                className="bg-accent-lime h-full rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress.percent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-[11px] font-mono text-accent-lime">{progress.percent}% Tiến độ</span>
          </div>
        )}

        {/* Completed State */}
        {generatedResult && (
          <div className="flex flex-col items-center justify-center py-6 gap-5 text-center">
            <div className="w-14 h-14 rounded-full bg-accent-lime/20 border border-accent-lime/50 flex items-center justify-center text-accent-lime shadow-[0_0_25px_rgba(198,241,53,0.4)]">
              <CheckCircle2 size={32} />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-white">Đã tạo xong Workflow Phim!</h3>
              <p className="text-xs text-text-muted">
                Đã thêm <span className="text-accent-lime font-bold">{generatedResult.nodesCount} nodes</span> và{' '}
                <span className="text-emerald-400 font-bold">{generatedResult.edgesCount} kết nối</span> trực tiếp lên Canvas.
              </p>
            </div>

            {progress?.partialError && (
              <div className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] text-left flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-1">Lưu ý một số cảnh bị lỗi (đã tự bỏ qua):</span>
                  <pre className="whitespace-pre-wrap font-mono text-[10px] opacity-80">{progress.partialError}</pre>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={() => {
                  setGeneratedResult(null);
                  setTopic('');
                }}
                className="flex-1 py-3 rounded-xl border border-white/20 hover:border-white/40 text-text-muted hover:text-white text-xs font-medium transition-colors"
              >
                Tạo Workflow khác
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-accent-lime text-black font-extrabold text-xs shadow-[0_0_20px_rgba(198,241,53,0.4)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
              >
                <Play size={14} fill="currentColor" />
                XEM TRÊN CANVAS
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
