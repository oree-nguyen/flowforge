import { getModelInputCapabilities, type OpenRouterModel } from '../services/openRouterApi';

export type ModelModality = 'text' | 'image' | 'video' | 'audio' | 'embeddings' | 'rerank' | 'speech' | 'transcription';
export type InputModality = 'text' | 'image' | 'video' | 'file' | 'audio';

export interface ModelMetadata {
  id: string;
  name: string;
  free: boolean;
  inputs: InputModality[];
  pricingPrompt?: string;
  pricingCompletion?: string;
  provider?: string;
}

export const TEXT_MODELS: ModelMetadata[] = [
  // DeepSeek
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', free: false, inputs: ['text'] },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', free: false, inputs: ['text'] },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', free: true, inputs: ['text'] },

  // Free Models
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', free: true, inputs: ['text'] },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B (Free)', free: true, inputs: ['text'] },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Exp (Free)', free: true, inputs: ['text', 'image', 'video', 'file'] },

  // Paid Models
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', free: false, inputs: ['text', 'image', 'video', 'file'] },
  { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro', free: false, inputs: ['text', 'image', 'video', 'file'] },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', free: false, inputs: ['text', 'image', 'file'] },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', free: false, inputs: ['text', 'image', 'file'] },
  { id: 'openai/gpt-4o', name: 'GPT-4o', free: false, inputs: ['text', 'image', 'file'] },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', free: false, inputs: ['text', 'image', 'file'] },
  { id: 'openai/o3-mini', name: 'o3-mini', free: false, inputs: ['text'] },
  { id: 'openai/o1', name: 'o1', free: false, inputs: ['text', 'image', 'file'] },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', free: false, inputs: ['text'] },
];

export const IMAGE_MODELS: ModelMetadata[] = [
  // === TRUE IMAGE GENERATION MODELS (use OpenRouter /images endpoint) ===
  // These models actually generate/create images from text prompts
  { id: 'black-forest-labs/flux-1-schnell', name: 'FLUX.1 Schnell (Fast, via OpenRouter)', free: true, inputs: ['text'] },
  { id: 'black-forest-labs/flux-1-dev', name: 'FLUX.1 Dev (Quality, via OpenRouter)', free: false, inputs: ['text'] },
  { id: 'black-forest-labs/flux-1-pro', name: 'FLUX.1 Pro (Premium, via OpenRouter)', free: false, inputs: ['text'] },
  { id: 'black-forest-labs/flux-1.1-pro', name: 'FLUX 1.1 Pro (Latest, via OpenRouter)', free: false, inputs: ['text'] },
  { id: 'openai/dall-e-3', name: 'DALL·E 3 (OpenAI)', free: false, inputs: ['text'] },

  // === MULTIMODAL VISION MODELS (can analyse images, NOT generate them) ===
  // Selecting these will route to Pollinations AI automatically for actual generation
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (Vision → auto Pollinations)', free: false, inputs: ['text', 'image'] },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Exp Free (Vision → auto Pollinations)', free: true, inputs: ['text', 'image'] },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (Vision → auto Pollinations)', free: false, inputs: ['text', 'image'] },
];

export const VIDEO_MODELS: ModelMetadata[] = [
  { id: 'minimax/video-01', name: 'MiniMax Video-01', free: false, inputs: ['text', 'image'] },
  { id: 'luma/ray-2', name: 'Luma Ray 2', free: false, inputs: ['text', 'image'] },
  { id: 'luma/dream-machine', name: 'Luma Dream Machine', free: false, inputs: ['text', 'image'] },
];

export const AUDIO_MODELS: ModelMetadata[] = [
  { id: 'openai/tts-1', name: 'OpenAI TTS-1', free: false, inputs: ['text'] },
  { id: 'openai/tts-1-hd', name: 'OpenAI TTS-1 HD', free: false, inputs: ['text'] },
  { id: 'elevenlabs/multilingual-v2', name: 'ElevenLabs Multilingual v2', free: false, inputs: ['text'] },
];

export const TRANSCRIPTION_MODELS: ModelMetadata[] = [
  { id: 'openai/whisper', name: 'OpenAI Whisper', free: false, inputs: ['audio'] },
  { id: 'openai/whisper-large-v3', name: 'Whisper Large v3', free: false, inputs: ['audio'] },
];

export function getModelCatalog(type: ModelModality, fetchedModels: OpenRouterModel[] = []): ModelMetadata[] {
  let staticList: ModelMetadata[] = [];
  switch (type) {
    case 'text': staticList = TEXT_MODELS; break;
    case 'image': staticList = IMAGE_MODELS; break;
    case 'video': staticList = VIDEO_MODELS; break;
    case 'audio': staticList = AUDIO_MODELS; break;
    case 'transcription': staticList = TRANSCRIPTION_MODELS; break;
    default: staticList = []; break;
  }

  if (!fetchedModels || fetchedModels.length === 0) {
    return staticList;
  }

  // Convert fetched models matching type
  const dynamicList: ModelMetadata[] = fetchedModels
    .filter(m => {
      const modality = (m.architecture?.modality || '').toLowerCase();
      if (type === 'image') return modality.includes('image') || m.id.includes('flux') || m.id.includes('dall-e');
      if (type === 'video') return modality.includes('video') || m.id.includes('luma') || m.id.includes('minimax');
      if (type === 'audio') return modality.includes('audio') || m.id.includes('tts');
      if (type === 'embeddings') return modality.includes('embedding') || m.id.includes('embed');
      if (type === 'rerank') return modality.includes('rerank');
      if (type === 'speech') return modality.includes('speech') || m.id.includes('tts');
      if (type === 'transcription') return modality.includes('transcription') || m.id.includes('whisper');
      return !modality.includes('image') && !modality.includes('video') && !modality.includes('embedding') && !modality.includes('audio');
    })
    .map(m => {
      const isFree = m.id.includes(':free') || m.pricing?.prompt === '0';
      const provider = m.id.split('/')[0] || '';
      return {
        id: m.id,
        name: m.name || m.id,
        free: isFree,
        inputs: getModelInputCapabilities(m.id, m),
        pricingPrompt: m.pricing?.prompt,
        pricingCompletion: m.pricing?.completion,
        provider,
      };
    });

  // Merge dynamic and static models, removing duplicates by id
  const idSet = new Set<string>();
  const merged: ModelMetadata[] = [];

  dynamicList.forEach(m => {
    idSet.add(m.id);
    merged.push(m);
  });

  staticList.forEach(m => {
    if (!idSet.has(m.id)) {
      idSet.add(m.id);
      merged.push(m);
    }
  });

  return merged;
}

export function getModelMetadata(modelId: string, fetchedModels: OpenRouterModel[] = []): ModelMetadata | undefined {
  if (!modelId) return undefined;
  
  if (fetchedModels && fetchedModels.length > 0) {
    const foundObj = fetchedModels.find(m => m.id === modelId);
    if (foundObj) {
      const isFree = foundObj.id.includes(':free') || foundObj.pricing?.prompt === '0';
      return {
        id: foundObj.id,
        name: foundObj.name || foundObj.id,
        free: isFree,
        inputs: getModelInputCapabilities(foundObj.id, foundObj),
      };
    }
  }

  const allStatic = [...TEXT_MODELS, ...IMAGE_MODELS, ...VIDEO_MODELS, ...AUDIO_MODELS, ...TRANSCRIPTION_MODELS];
  const staticFound = allStatic.find(m => m.id === modelId);
  if (staticFound) return staticFound;

  // Fallback metadata if not found in catalog
  return {
    id: modelId,
    name: modelId.split('/').pop() || modelId,
    free: modelId.includes(':free'),
    inputs: getModelInputCapabilities(modelId),
  };
}
