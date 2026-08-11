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

// Known image-gen models on OpenRouter that support /api/v1/images endpoint
const OPENROUTER_IMAGE_GEN_MODELS = new Set([
  'black-forest-labs/flux-1-schnell',
  'black-forest-labs/flux-schnell',
  'black-forest-labs/flux-1-dev',
  'black-forest-labs/flux-1-pro',
  'black-forest-labs/flux-1.1-pro',
  'openai/dall-e-3',
  'openai/dall-e-2',
]);

// Generate image using Pollinations AI — fetches blob immediately (avoids double-fetch in workflowStore)
export async function generateImagePollinations(
  promptText: string,
  options?: { signal?: AbortSignal; width?: number; height?: number; seed?: number }
): Promise<{ url: string; dataUrl: string }> {
  const seed = options?.seed ?? Math.floor(Math.random() * 1000000);
  const width = options?.width || 1024;
  const height = options?.height || 1024;
  // Sanitize: strip formatting artifacts, collapse whitespace, truncate to 450 chars
  const rawPrompt = (promptText || '').trim();
  const cleanedPrompt = rawPrompt
    .replace(/=== Output từ node ".*?" ===/g, '')   // strip node output headers
    .replace(/---+/g, ' ')                           // strip markdown dividers
    .replace(/#{1,6} /g, '')                         // strip markdown headings
    .replace(/\s+/g, ' ')                            // collapse all whitespace
    .trim()
    .slice(0, 450);                                  // Pollinations URL safe limit
  const safePrompt = cleanedPrompt || 'cinematic professional photograph';
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(safePrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
  const res = await fetch(url, { signal: options?.signal });
  if (!res.ok) throw new Error(`Pollinations image generation failed (${res.status}): ${res.statusText}`);
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return { url, dataUrl };
}

// Procedural fallback Image generator using HTML5 Canvas (0% failure rate)
export async function generateProceduralImageBlob(
  promptText: string,
  width = 1024,
  height = 1024
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Dark cyber gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0F0F14');
    grad.addColorStop(0.5, '#181824');
    grad.addColorStop(1, '#0A0A0E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Glowing grid lines
    ctx.strokeStyle = 'rgba(198, 241, 53, 0.08)';
    ctx.lineWidth = 1;
    const step = 64;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Glowing center emblem
    ctx.save();
    ctx.shadowColor = '#C6F135';
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(198, 241, 53, 0.15)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 40, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Scene prompt text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AI GENERATED SCENE', width / 2, height / 2 - 40);

    const safeText = (promptText || 'Cinematic Film Scene').slice(0, 80);
    ctx.fillStyle = '#C6F135';
    ctx.font = '18px monospace';
    ctx.fillText(`"${safeText}"`, width / 2, height / 2 + 20);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '14px sans-serif';
    ctx.fillText('FlowForge Procedural Engine', width / 2, height / 2 + 60);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob || new Blob([])), 'image/png');
  });
}

// Procedural fallback Video generator using HTML5 Canvas & MediaRecorder (0% failure rate)
export async function generateProceduralVideoBlob(
  promptText: string,
  durationSec = 4,
  aspectRatio = '16:9'
): Promise<Blob> {
  const width = aspectRatio === '9:16' ? 720 : 1280;
  const height = aspectRatio === '9:16' ? 1280 : 720;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new Blob([], { type: 'video/webm' });

  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/mp4')
    ? 'video/mp4'
    : 'video/webm';

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, { mimeType });
  } catch {
    recorder = new MediaRecorder(stream);
  }

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  const safePrompt = (promptText || 'Cinematic Short Film').slice(0, 60);
  const startTime = performance.now();

  return new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
    };

    recorder.start();

    const renderLoop = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(elapsed / durationSec, 1);

      // Dark cyber background
      const grad = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, Math.max(width, height) / 1.2
      );
      grad.addColorStop(0, '#1A1D28');
      grad.addColorStop(0.5, '#0E1017');
      grad.addColorStop(1, '#06070A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Moving neon grid
      const offsetY = (elapsed * 40) % 40;
      ctx.strokeStyle = 'rgba(198, 241, 53, 0.1)';
      ctx.lineWidth = 1;
      for (let y = offsetY; y < height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Pulsing center glow
      const pulseRadius = 100 + Math.sin(elapsed * 4) * 20;
      ctx.save();
      ctx.shadowColor = '#C6F135';
      ctx.shadowBlur = 40;
      ctx.fillStyle = 'rgba(198, 241, 53, 0.2)';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2 - 30, pulseRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Film frame border
      ctx.strokeStyle = '#C6F135';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // Scene Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AI CINEMATIC SCENE', width / 2, height / 2 - 30);

      ctx.fillStyle = '#C6F135';
      ctx.font = '20px monospace';
      ctx.fillText(`"${safePrompt}"`, width / 2, height / 2 + 20);

      // Progress bar at bottom
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(60, height - 80, width - 120, 8);
      ctx.fillStyle = '#C6F135';
      ctx.fillRect(60, height - 80, (width - 120) * progress, 8);

      if (progress < 1) {
        requestAnimationFrame(renderLoop);
      } else {
        recorder.stop();
      }
    };

    renderLoop();
  });
}



export async function generateImage(
  apiKey: string,
  model: string,
  prompt: string | any[],
  params: any = {},
  options?: { signal?: AbortSignal }
) {
  // Extract text prompt from multimodal content if needed
  const promptText: string = typeof prompt === 'string'
    ? prompt
    : (prompt as any[]).find((p: any) => p.type === 'text')?.text || '';

  // Use OpenRouter dedicated /images endpoint only for known image-gen models
  if (OPENROUTER_IMAGE_GEN_MODELS.has(model)) {
    const response = await fetch(`${OPENROUTER_API_URL}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://oree-nguyen.github.io/flowforge',
        'X-Title': 'FlowForge',
      },
      body: JSON.stringify({
        model,
        prompt: promptText || 'cinematic professional photograph',
        ...params,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to generate image via OpenRouter: ${response.statusText}`);
    }

    const result = await response.json();
    // OpenRouter /images returns { data: [{ url: '...' }] } or { data: [{ b64_json: '...' }] }
    const rawUrl: string = result.data?.[0]?.url || '';
    const rawB64: string = result.data?.[0]?.b64_json || '';

    if (!rawUrl && !rawB64) throw new Error('No image data in OpenRouter /images response');

    if (rawB64) {
      // b64_json: convert to data URL directly — no second fetch needed
      const dataUrl = `data:image/png;base64,${rawB64}`;
      return { choices: [{ message: { content: `![image](openrouter-b64)` } }], _imageUrl: rawUrl || 'openrouter-b64', _imageDataUrl: dataUrl };
    }

    // Plain URL from OpenRouter — return it (workflowStore will fetch it once)
    return { choices: [{ message: { content: `![image](${rawUrl})` } }], _imageUrl: rawUrl };
  }

  // For vision-only models (Gemini, GPT-4o etc.): route to Pollinations AI
  // generateImagePollinations fetches blob immediately → returns dataUrl to avoid second fetch
  const pollinationsResult = await generateImagePollinations(promptText, {
    signal: options?.signal,
    seed: Math.floor(Math.random() * 1000000),
  });
  return {
    choices: [{ message: { content: `![image](${pollinationsResult.url})` } }],
    _imageUrl: pollinationsResult.url,
    _imageDataUrl: pollinationsResult.dataUrl,
  };
}


export async function generateVideoOpenRouter(
  apiKey: string,
  model: string,
  prompt: string,
  referenceImageUrl?: string,
  params: { resolution?: string; duration?: number } = {},
  options?: { signal?: AbortSignal }
): Promise<{ id: string; polling_url?: string }> {
  const body: Record<string, any> = {
    model,
    prompt: prompt || 'cinematic short film scene',
    ...params,
  };
  if (referenceImageUrl) body.image_url = referenceImageUrl;

  const response = await fetch(`${OPENROUTER_API_URL}/videos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://oree-nguyen.github.io/flowforge',
      'X-Title': 'FlowForge',
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Video generation submit failed: ${response.statusText}`);
  }

  return response.json();
}

export async function pollVideoStatus(
  apiKey: string,
  jobId: string,
  options?: { signal?: AbortSignal }
): Promise<{ status: string; id: string; error?: string }> {
  const response = await fetch(`${OPENROUTER_API_URL}/videos/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://oree-nguyen.github.io/flowforge',
      'X-Title': 'FlowForge',
    },
    signal: options?.signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Video status check failed: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchVideoContent(apiKey: string, generationId: string, options?: { signal?: AbortSignal }): Promise<Blob> {
  const response = await fetch(`${OPENROUTER_API_URL}/videos/${generationId}/content?index=0`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://oree-nguyen.github.io/flowforge',
      'X-Title': 'FlowForge',
    },
    signal: options?.signal,
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
