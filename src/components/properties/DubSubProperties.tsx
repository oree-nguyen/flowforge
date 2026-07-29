import { useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { canvasEngine, type NodeData, type EdgeData } from '../../engine/canvasEngine';
import { groupModelsByProviderAndModality } from '../../services/openRouterApi';
import {
  extractAudioFromVideo,
  performSTTWithDiarization,
  cutSpeakerSample,
  translateSegments,
  exportSubtitle,
  generateDubbedAudio,
  muxAudioWithVideo,
} from '../../services/dubSubEngine';
import type { AIDubSubData, SpeakerCasting } from '../../types/nodes';
import {
  Play,
  UserCheck,
  Languages,
  CheckCircle2,
  Sparkles,
  DollarSign,
  Loader2,
  Mic,
  Video,
  FileText,
} from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt' },
  { code: 'ja', flag: '🇯🇵', name: 'Japanese' },
  { code: 'ko', flag: '🇰🇷', name: 'Korean' },
  { code: 'zh', flag: '🇨🇳', name: 'Chinese' },
  { code: 'fr', flag: '🇫🇷', name: 'French' },
  { code: 'ru', flag: '🇷🇺', name: 'Russian' },
];

const TTS_VOICE_OPTIONS = [
  { id: 'alloy', name: 'Alloy (Nam/Nữ - Trung tính)' },
  { id: 'echo', name: 'Echo (Nam - Trầm)' },
  { id: 'fable', name: 'Fable (Nam - Ấm áp)' },
  { id: 'onyx', name: 'Onyx (Nam - Quyền lực)' },
  { id: 'nova', name: 'Nova (Nữ - Sáng)' },
  { id: 'shimmer', name: 'Shimmer (Nữ - Nhẹ nhàng)' },
];

const KNOWN_DIARIZATION_MODELS = [
  'x-ai/grok-2-vision-1212',
  'openai/whisper-large-v3',
  'openai/whisper',
];

export function DubSubProperties({ id, data }: { id: string; data: AIDubSubData }) {
  const fetchedModels = useWorkflowStore((state) => state.fetchedModels);
  const apiKey = useWorkflowStore((state) => state.apiKey);

  const grouped = groupModelsByProviderAndModality(fetchedModels || []);

  const sttModels = Object.values(grouped['transcription'] || {}).flat();
  const textModels = Object.values(grouped['text'] || {}).flat();
  const ttsModels = Object.values(grouped['speech'] || {}).flat();

  // Selected config values
  const mode = data.mode || 'both';
  const sourceLang = data.sourceLanguage || 'auto';
  const targetLangs = data.targetLanguages || ['en'];
  const sttModel = data.sttModel || 'openai/whisper';
  const translateModel = data.translateModel || 'openai/gpt-4o-mini';
  const ttsModel = data.ttsModel || 'openai/tts-1';
  const speakers = data.speakers || [];
  const burnSub = !!data.burnSubtitle;
  const mixAudio = data.mixOriginalAudio !== false;
  const includeSpeaker = !!data.includeSpeakerName;

  const [playingSample, setPlayingSample] = useState<string | null>(null);

  const updateNodeData = (update: Partial<AIDubSubData>) => {
    canvasEngine.updateNodeData(id, update);
  };

  const toggleLanguage = (langCode: string) => {
    let next: string[];
    if (targetLangs.includes(langCode)) {
      if (targetLangs.length === 1) return; // Must keep at least one
      next = targetLangs.filter((l) => l !== langCode);
    } else {
      next = [...targetLangs, langCode];
    }
    updateNodeData({ targetLanguages: next });
  };

  const updateSpeakerCasting = (
    speakerId: string,
    field: 'label' | 'voice',
    value: string,
    langCode?: string
  ) => {
    const updated = speakers.map((sp) => {
      if (sp.speakerId !== speakerId) return sp;
      if (field === 'label') {
        return { ...sp, label: value };
      } else if (field === 'voice' && langCode) {
        return {
          ...sp,
          voiceIdPerLanguage: {
            ...sp.voiceIdPerLanguage,
            [langCode]: value,
          },
        };
      }
      return sp;
    });

    updateNodeData({ speakers: updated });
  };

  const playAudioSample = (url: string) => {
    if (!url) return;
    const audio = new Audio(url);
    setPlayingSample(url);
    audio.play();
    audio.onended = () => setPlayingSample(null);
  };

  // Run initial Phase 1 & 2 (Audio extract + STT + Speaker Diarization + Sample generation)
  const handleStartPipeline = async () => {
    if (!apiKey) {
      alert('Vui lòng nhập API Key OpenRouter trong Settings trước khi chạy.');
      return;
    }

    // Find input video node / data
    const nodes = canvasEngine.getNodes();
    const edges = canvasEngine.getEdges();

    const inputEdge = edges.find((e: EdgeData) => e.target === id && e.targetHandle === 'video_in');
    let videoSource: any = null;

    if (inputEdge) {
      const sourceNode = nodes.find((n: NodeData) => n.id === inputEdge.source);
      if (sourceNode?.data) {
        videoSource = sourceNode.data.output || sourceNode.data.file || sourceNode.data.url;
      }
    }

    if (!videoSource) {
      alert('Chưa kết nối Input Video node! Vui lòng nối Video Input vào port video_in của node này.');
      return;
    }

    try {
      updateNodeData({ isGenerating: true, statusStep: 1, statusMessage: 'Đang tách audio WAV từ video...' });

      // Step 1: Extract Audio
      const { audioBlob, audioBuffer } = await extractAudioFromVideo(videoSource);

      // Step 2: STT + Diarization
      updateNodeData({ statusStep: 2, statusMessage: 'Đang chạy STT & Nhận diện giọng người nói...' });
      const segments = await performSTTWithDiarization(apiKey, sttModel, audioBlob, sourceLang);

      // Unique speakers
      const uniqueSpeakers = Array.from(new Set(segments.map((s) => s.speakerId)));

      // Cut speaker audio samples
      const createdSpeakers: SpeakerCasting[] = [];
      for (let i = 0; i < uniqueSpeakers.length; i++) {
        const spId = uniqueSpeakers[i];
        const spSegment = segments.find((s) => s.speakerId === spId) || segments[0];

        let sampleUrl = '';
        try {
          sampleUrl = await cutSpeakerSample(audioBuffer, spSegment.start, spSegment.end);
        } catch {
          sampleUrl = '';
        }

        const voiceMap: Record<string, string> = {};
        targetLangs.forEach((lang) => {
          voiceMap[lang] = TTS_VOICE_OPTIONS[i % TTS_VOICE_OPTIONS.length].id;
        });

        createdSpeakers.push({
          speakerId: spId,
          label: `Nhân vật ${String.fromCharCode(65 + i)}`,
          sampleAudioUrl: sampleUrl,
          voiceIdPerLanguage: voiceMap,
        });
      }

      // Step 3: Pause for User Casting confirmation
      updateNodeData({
        isGenerating: false,
        statusStep: 3,
        statusMessage: 'Chờ người dùng kiểm tra & chọn giọng Casting...',
        speakers: createdSpeakers,
        segments,
      });
    } catch (err: any) {
      console.error('Pipeline Error:', err);
      alert(`Lỗi chạy pipeline: ${err.message || err}`);
      updateNodeData({ isGenerating: false, statusStep: 0, statusMessage: '' });
    }
  };

  // Resume Phase 3 (Translate -> Dubbing TTS -> Align -> Mux)
  const handleConfirmCastingAndProceed = async () => {
    if (!data.segments || data.segments.length === 0) {
      alert('Không tìm thấy dữ liệu transcript. Vui lòng chạy lại từ đầu.');
      return;
    }

    const nodes = canvasEngine.getNodes();
    const edges = canvasEngine.getEdges();
    const inputEdge = edges.find((e: EdgeData) => e.target === id && e.targetHandle === 'video_in');
    let videoSource: any = null;

    if (inputEdge) {
      const sourceNode = nodes.find((n: NodeData) => n.id === inputEdge.source);
      if (sourceNode?.data) {
        videoSource = sourceNode.data.output || sourceNode.data.file || sourceNode.data.url;
      }
    }

    try {
      updateNodeData({ isGenerating: true, statusStep: 4, statusMessage: 'Đang dịch thuật transcript...' });

      // Step 4: Translate
      const translatedSegments = await translateSegments(
        apiKey,
        translateModel,
        data.segments,
        targetLangs
      );

      // Export Subtitles (.srt)
      const outputSubtitles: Record<string, string> = {};
      const speakersMap: Record<string, string> = {};
      (data.speakers || []).forEach((s) => {
        speakersMap[s.speakerId] = s.label;
      });

      targetLangs.forEach((lang) => {
        outputSubtitles[lang] = exportSubtitle(
          translatedSegments,
          lang,
          'srt',
          includeSpeaker,
          speakersMap
        );
      });

      let finalVideoUrl: string | undefined = undefined;

      if (mode === 'dub' || mode === 'both') {
        const primaryLang = targetLangs[0] || 'en';
        const totalDur = Math.max(...translatedSegments.map((s) => s.end), 10);

        updateNodeData({ statusStep: 5, statusMessage: `Đang lồng tiếng TTS (${primaryLang})...` });

        const dubbedAudioBlob = await generateDubbedAudio(
          apiKey,
          ttsModel,
          translatedSegments,
          data.speakers || [],
          primaryLang,
          totalDur,
          (curr, tot) => {
            updateNodeData({ statusMessage: `Đang lồng tiếng TTS đoạn ${curr}/${tot}...` });
          }
        );

        updateNodeData({ statusStep: 6, statusMessage: 'Đang canh thời gian audio (atempo)...' });

        if (videoSource) {
          updateNodeData({ statusStep: 7, statusMessage: 'Đang ghép video & xuất file final...' });
          finalVideoUrl = await muxAudioWithVideo(videoSource, dubbedAudioBlob, mixAudio);
        }
      }

      updateNodeData({
        isGenerating: false,
        statusStep: 7,
        statusMessage: 'Hoàn thành!',
        segments: translatedSegments,
        outputSubtitles,
        outputVideo: finalVideoUrl,
        output: finalVideoUrl || Object.values(outputSubtitles)[0],
      });
    } catch (err: any) {
      console.error('Phase 3 Error:', err);
      alert(`Lỗi lồng tiếng: ${err.message || err}`);
      updateNodeData({ isGenerating: false });
    }
  };

  // Estimated Cost calculation
  const totalSegs = data.segments?.length || 5;
  const estimatedCost = (totalSegs * 0.005 * targetLangs.length).toFixed(4);

  return (
    <div className="flex flex-col gap-5 p-4 text-xs text-text-primary">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
        <Languages size={18} className="text-indigo-400" />
        <div>
          <h3 className="font-semibold text-sm">Lồng Tiếng & Phụ Đề AI</h3>
          <p className="text-[10px] text-text-muted">Tự động dịch, lồng tiếng đa nhân vật qua OpenRouter</p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex flex-col gap-2">
        <label className="font-medium text-text-muted text-[11px] uppercase tracking-wider">
          Chế độ đầu ra (Mode)
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-canvas rounded-xl border border-border-subtle">
          {[
            { key: 'subtitle', label: 'Phụ đề', icon: <FileText size={14} /> },
            { key: 'dub', label: 'Lồng tiếng', icon: <Mic size={14} /> },
            { key: 'both', label: 'Cả hai', icon: <Video size={14} /> },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => updateNodeData({ mode: item.key as any })}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === item.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Languages Multi-select */}
      <div className="flex flex-col gap-2">
        <label className="font-medium text-text-muted text-[11px] uppercase tracking-wider">
          Ngôn ngữ đích (Target Languages)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = targetLangs.includes(lang.code);
            return (
              <button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-sm'
                    : 'bg-canvas border-border-subtle text-text-muted hover:border-white/20'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Models Configuration */}
      <div className="flex flex-col gap-3 p-3 bg-canvas/50 border border-border-subtle rounded-xl">
        <label className="font-medium text-indigo-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={12} /> Cấu hình Models AI
        </label>

        {/* STT Model */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-text-muted">Model STT & Diarization:</span>
            {KNOWN_DIARIZATION_MODELS.includes(sttModel) && (
              <span className="text-[10px] text-emerald-400 font-mono">✓ Diarization</span>
            )}
          </div>
          <select
            value={sttModel}
            onChange={(e) => updateNodeData({ sttModel: e.target.value })}
            className="w-full bg-canvas border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:border-indigo-500 focus:outline-none"
          >
            {sttModels.length > 0 ? (
              sttModels.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.id} {KNOWN_DIARIZATION_MODELS.includes(m.id) ? ' (Speaker Diarization)' : ''}
                </option>
              ))
            ) : (
              <option value="openai/whisper">OpenAI Whisper (Default)</option>
            )}
          </select>
        </div>

        {/* Translate Model */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-text-muted">Model Dịch thuật:</span>
          <select
            value={translateModel}
            onChange={(e) => updateNodeData({ translateModel: e.target.value })}
            className="w-full bg-canvas border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:border-indigo-500 focus:outline-none"
          >
            {textModels.length > 0 ? (
              textModels.slice(0, 30).map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.id}
                </option>
              ))
            ) : (
              <option value="openai/gpt-4o-mini">GPT-4o Mini (Default)</option>
            )}
          </select>
        </div>

        {/* TTS Model */}
        {(mode === 'dub' || mode === 'both') && (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-text-muted">Model TTS Lồng tiếng:</span>
            <select
              value={ttsModel}
              onChange={(e) => updateNodeData({ ttsModel: e.target.value })}
              className="w-full bg-canvas border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:border-indigo-500 focus:outline-none"
            >
              {ttsModels.length > 0 ? (
                ttsModels.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.id}
                  </option>
                ))
              ) : (
                <option value="openai/tts-1">OpenAI TTS-1 (Default)</option>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Speaker Casting Section (Step 3) */}
      {speakers.length > 0 && (
        <div className="flex flex-col gap-3 p-3 bg-indigo-950/30 border border-indigo-500/40 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-indigo-300 flex items-center gap-1.5 text-xs">
              <UserCheck size={14} /> Casting Giọng ({speakers.length} Nhân vật)
            </span>
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Cần xác nhận
            </span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
            {speakers.map((sp) => (
              <div key={sp.speakerId} className="p-2.5 bg-canvas/80 rounded-xl border border-border-subtle flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">{sp.speakerId}</span>

                  {sp.sampleAudioUrl && (
                    <button
                      onClick={() => playAudioSample(sp.sampleAudioUrl)}
                      className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-md text-[10px] flex items-center gap-1 transition-colors"
                    >
                      <Play size={10} /> {playingSample === sp.sampleAudioUrl ? 'Đang phát...' : 'Nghe mẫu'}
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-text-muted">Tên nhân vật:</span>
                  <input
                    type="text"
                    value={sp.label}
                    onChange={(e) => updateSpeakerCasting(sp.speakerId, 'label', e.target.value)}
                    className="w-full bg-panel border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-primary focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {targetLangs.map((lang) => (
                  <div key={lang} className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted w-10 uppercase font-mono">{lang}:</span>
                    <select
                      value={sp.voiceIdPerLanguage[lang] || 'alloy'}
                      onChange={(e) => updateSpeakerCasting(sp.speakerId, 'voice', e.target.value, lang)}
                      className="flex-1 bg-panel border border-border-subtle rounded-lg px-2 py-1 text-[11px] text-text-primary focus:border-indigo-500 focus:outline-none"
                    >
                      {TTS_VOICE_OPTIONS.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <button
            onClick={handleConfirmCastingAndProceed}
            disabled={data.isGenerating}
            className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-md transition-all text-xs"
          >
            {data.isGenerating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            Xác nhận Casting & Lồng tiếng (Bước 4-7)
          </button>
        </div>
      )}

      {/* Output Toggles */}
      <div className="flex flex-col gap-2 p-3 bg-canvas/40 border border-border-subtle rounded-xl">
        <label className="font-medium text-text-muted text-[11px] uppercase tracking-wider">
          Tùy chọn Xuất
        </label>

        <label className="flex items-center justify-between text-xs cursor-pointer">
          <span className="text-text-muted">In cứng phụ đề vào video</span>
          <input
            type="checkbox"
            checked={burnSub}
            onChange={(e) => updateNodeData({ burnSubtitle: e.target.checked })}
            className="rounded border-border-subtle bg-canvas text-indigo-600 focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between text-xs cursor-pointer">
          <span className="text-text-muted">Giữ âm thanh gốc (nhạc nền -20dB)</span>
          <input
            type="checkbox"
            checked={mixAudio}
            onChange={(e) => updateNodeData({ mixOriginalAudio: e.target.checked })}
            className="rounded border-border-subtle bg-canvas text-indigo-600 focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between text-xs cursor-pointer">
          <span className="text-text-muted">Hiển thị tên nhân vật trong phụ đề</span>
          <input
            type="checkbox"
            checked={includeSpeaker}
            onChange={(e) => updateNodeData({ includeSpeakerName: e.target.checked })}
            className="rounded border-border-subtle bg-canvas text-indigo-600 focus:ring-0"
          />
        </label>
      </div>

      {/* Pipeline Trigger Button (Step 1-3) */}
      {speakers.length === 0 && (
        <button
          onClick={handleStartPipeline}
          disabled={data.isGenerating}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all text-xs"
        >
          {data.isGenerating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Đang xử lý Bước {data.statusStep || 1}/7...</span>
            </>
          ) : (
            <>
              <Play size={14} />
              <span>Bắt đầu Pipeline (Tách audio & Diarization)</span>
            </>
          )}
        </button>
      )}

      {/* Cost Estimate Footer */}
      <div className="flex items-center justify-between px-2 text-[10px] text-text-muted border-t border-border-subtle pt-2">
        <span className="flex items-center gap-1">
          <DollarSign size={12} className="text-emerald-400" /> Ước tính chi phí:
        </span>
        <span className="font-mono text-emerald-400 font-semibold">${estimatedCost}</span>
      </div>
    </div>
  );
}
