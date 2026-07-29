// Removed @xyflow/react dependency

export type NodeType = 
  | 'input.text'
  | 'input.image'
  | 'ai.textGen'
  | 'ai.imageGen'
  | 'ai.videoGen'
  | 'ai.audioGen'
  | 'ai.transcription'
  | 'ai.dubSub'
  | 'util.videoEditor'
  | 'util.download'
  | 'note'
  | 'noteFrame';

// Data interfaces
export interface InputTextData {
  text: string;
  [key: string]: unknown;
}

export interface VideoClipItem {
  id: string;
  sourceNodeId: string;
  order: number;
  thumbnailUrl: string;
  durationSec?: number;
  videoUrl?: string;
}

export interface VideoEditorData {
  clips: VideoClipItem[];
  aspectRatio?: '16:9' | '9:16' | '1:1';
  resolution?: '720p' | '1080p';
  output?: string;
  isConcatting?: boolean;
  progressPercent?: number;
  progressMessage?: string;
  [key: string]: unknown;
}

export interface SpeakerCasting {
  speakerId: string;
  label: string;
  sampleAudioUrl: string;
  voiceIdPerLanguage: Record<string, string>;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speakerId: string;
  translations: Record<string, string>;
}

export interface AIDubSubData {
  mode: 'subtitle' | 'dub' | 'both';
  sourceLanguage: string;
  targetLanguages: string[];
  sttModel: string;
  translateModel: string;
  ttsModel: string;
  speakers: SpeakerCasting[];
  segments?: TranscriptSegment[];
  burnSubtitle: boolean;
  mixOriginalAudio: boolean;
  includeSpeakerName?: boolean;
  statusStep?: number; // 0: Idle, 1: Audio Extract, 2: Diarization, 3: Casting Wait, 4: Translate, 5: Dubbing, 6: Align, 7: Muxing/Done
  statusMessage?: string;
  outputVideo?: string;
  outputSubtitles?: Record<string, string>; // lang -> srt content
  isGenerating?: boolean;
  costEstimate?: number;
  actualCost?: number;
  [key: string]: unknown;
}

export interface InputImageData {
  file: string | null;
  [key: string]: unknown;
}

export interface AITextGenData {
  model: string;
  systemPrompt?: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  responseFormat?: 'text' | 'json';
  output?: string;
  costEstimate?: number;
  actualCost?: number;
  [key: string]: unknown;
}

export interface AIImageGenData {
  model: string;
  aspectRatio: string;
  quality?: string;
  n: number;
  seed?: number;
  outputFormat?: 'png' | 'webp' | 'jpeg';
  background?: 'transparent' | 'opaque';
  output?: string[];
  costEstimate?: number;
  actualCost?: number;
  [key: string]: unknown;
}

export interface AIVideoGenData {
  model: string;
  duration: number;
  aspectRatio: string;
  resolution?: string;
  seed?: number;
  fps?: number;
  output?: string;
  costEstimate?: number;
  actualCost?: number;
  [key: string]: unknown;
}

export interface NoteData {
  text: string;
  color?: string;
  [key: string]: unknown;
}

export interface NoteFrameData {
  label: string;
  color?: string;
  [key: string]: unknown;
}

// Full Node types for @xyflow/react v12+
export type BaseNode = {
  id: string;
  type: string;
  data: Record<string, unknown>;
};
export type InputTextNode = BaseNode & { type: 'input.text'; data: InputTextData };
export type InputImageNode = BaseNode & { type: 'input.image'; data: InputImageData };
export type AITextGenNode = BaseNode & { type: 'ai.textGen'; data: AITextGenData };
export type AIImageGenNode = BaseNode & { type: 'ai.imageGen'; data: AIImageGenData };
export type AIVideoGenNode = BaseNode & { type: 'ai.videoGen'; data: AIVideoGenData };
export type AIDubSubNodeType = BaseNode & { type: 'ai.dubSub'; data: AIDubSubData };
export type VideoEditorNodeType = BaseNode & { type: 'util.videoEditor'; data: VideoEditorData };
export type NoteNodeType = BaseNode & { type: 'note'; data: NoteData };
export type NoteFrameNodeType = BaseNode & { type: 'noteFrame'; data: NoteFrameData };
