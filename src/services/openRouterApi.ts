export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: string;
    completion: string;
    image: string;
    request: string;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type: string | null;
  };
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

export async function fetchModels(apiKey: string): Promise<OpenRouterModel[]> {
  if (!apiKey) throw new Error("API Key is missing");

  const response = await fetch(`${OPENROUTER_API_URL}/models`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://oree-nguyen.github.io/flowforge',
      'X-Title': 'FlowForge',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch models: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

export type ExpandedModality = 'text' | 'image' | 'video' | 'audio' | 'embeddings' | 'rerank' | 'speech' | 'transcription';

// Grouping logic for all modalities
export function groupModelsByProviderAndModality(models: OpenRouterModel[]) {
  const categories: ExpandedModality[] = ['text', 'image', 'video', 'audio', 'embeddings', 'rerank', 'speech', 'transcription'];
  const grouped: Record<string, Record<string, OpenRouterModel[]>> = {};

  categories.forEach(cat => {
    grouped[cat] = {};
  });

  models.forEach(model => {
    const provider = model.id.split('/')[0] || 'other';
    const modality = (model.architecture?.modality || 'text->text').toLowerCase();
    
    let type: ExpandedModality = 'text';
    if (modality.includes('image') || model.id.includes('flux') || model.id.includes('dall-e')) {
      type = 'image';
    } else if (modality.includes('video') || model.id.includes('luma') || model.id.includes('runway') || model.id.includes('minimax')) {
      type = 'video';
    } else if (modality.includes('embedding') || model.id.includes('embed')) {
      type = 'embeddings';
    } else if (modality.includes('rerank')) {
      type = 'rerank';
    } else if (modality.includes('speech') || model.id.includes('tts')) {
      type = 'speech';
    } else if (modality.includes('transcription') || model.id.includes('whisper')) {
      type = 'transcription';
    } else if (modality.includes('audio')) {
      type = 'audio';
    }
    
    if (!grouped[type]) {
      grouped[type] = {};
    }
    if (!grouped[type][provider]) {
      grouped[type][provider] = [];
    }
    grouped[type][provider].push(model);
  });

  return grouped;
}

export function getModelInputCapabilities(modelId: string, modelObj?: OpenRouterModel): ('text' | 'image' | 'video' | 'file' | 'audio')[] {
  const inputs: ('text' | 'image' | 'video' | 'file' | 'audio')[] = ['text'];
  const idLower = modelId.toLowerCase();
  const modality = (modelObj?.architecture?.modality || '').toLowerCase();

  // Image input
  if (
    modality.includes('image') || 
    modality.includes('+image') || 
    idLower.includes('gpt-4o') || 
    idLower.includes('claude-3') || 
    idLower.includes('gemini') || 
    idLower.includes('vision')
  ) {
    inputs.push('image');
  }

  // File input (PDF / DOCX) for multimodal models
  if (
    idLower.includes('claude') || 
    idLower.includes('gpt-4') || 
    idLower.includes('gemini') || 
    idLower.includes('o1')
  ) {
    inputs.push('file');
  }

  // Video input
  if (modality.includes('video') || idLower.includes('gemini-1.5') || idLower.includes('gemini-2.0')) {
    inputs.push('video');
  }

  // Audio input
  if (modality.includes('audio') || idLower.includes('whisper') || idLower.includes('gemini')) {
    inputs.push('audio');
  }

  return Array.from(new Set(inputs));
}

export async function chatCompletion(
  apiKey: string,
  model: string,
  messages: any[],
  params: any = {},
  options?: { signal?: AbortSignal }
) {
  const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://oree-nguyen.github.io/flowforge',
      'X-Title': 'FlowForge',
    },
    body: JSON.stringify({
      model,
      messages,
      ...params
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to generate text: ${response.statusText}`);
  }

  return response.json();
}

export async function generateImage(
  apiKey: string,
  model: string,
  prompt: string | any[],
  params: any = {},
  options?: { signal?: AbortSignal }
) {
  const content = prompt;
  const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://oree-nguyen.github.io/flowforge',
      'X-Title': 'FlowForge',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content }],
      ...params
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to generate image: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchVideoContent(apiKey: string, generationId: string): Promise<Blob> {
  const response = await fetch(`${OPENROUTER_API_URL}/videos/${generationId}/content?index=0`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://oree-nguyen.github.io/flowforge',
      'X-Title': 'FlowForge',
    },
  });

  if (!response.ok) throw new Error('Failed to fetch video content');
  return response.blob();
}

export async function transcribeAudio(
  apiKey: string,
  model: string,
  audioFile: Blob | File,
  language?: string
) {
  const formData = new FormData();
  formData.append('file', audioFile, 'audio.wav');
  formData.append('model', model);
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');
  if (language && language !== 'auto') {
    formData.append('language', language);
  }

  const response = await fetch(`${OPENROUTER_API_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://oree-nguyen.github.io/flowforge',
      'X-Title': 'FlowForge',
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || err.message || `Transcription failed: ${response.statusText}`);
  }

  return response.json();
}

export async function generateSpeech(
  apiKey: string,
  model: string,
  input: string,
  voice: string = 'alloy'
): Promise<Blob> {
  const response = await fetch(`${OPENROUTER_API_URL}/audio/speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://oree-nguyen.github.io/flowforge',
      'X-Title': 'FlowForge',
    },
    body: JSON.stringify({
      model,
      input,
      voice,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || err.message || `Speech generation failed: ${response.statusText}`);
  }

  return response.blob();
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: mimeType });
}

export function resolveValidModelId(
  requestedModel: string | undefined,
  defaultFallback: string = 'google/gemini-2.0-flash-001',
  fetchedModels: OpenRouterModel[] = []
): string {
  if (!requestedModel) return defaultFallback;

  if (fetchedModels && fetchedModels.length > 0) {
    if (fetchedModels.some(m => m.id === requestedModel)) {
      return requestedModel;
    }
  }

  const KNOWN_VALID = new Set([
    'google/gemini-2.0-flash-001',
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-1.5-flash',
    'google/gemini-1.5-pro',
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'openai/o3-mini',
    'openai/o1',
    'deepseek/deepseek-chat',
    'deepseek/deepseek-r1',
    'deepseek/deepseek-r1:free',
    'meta-llama/llama-3.3-70b-instruct',
    'meta-llama/llama-3.3-70b-instruct:free',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3.7-sonnet',
    'mistralai/mistral-nemo:free',
    'google/gemma-2-9b-it:free',
    'minimax/video-01',
  ]);

  if (KNOWN_VALID.has(requestedModel)) {
    return requestedModel;
  }

  return defaultFallback;
}
