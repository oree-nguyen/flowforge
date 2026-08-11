import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { canvasEngine, type NodeData } from '../engine/canvasEngine';
import { toast } from './toastStore';
import { type OpenRouterModel, resolveValidModelId } from '../services/openRouterApi';

export type ToolMode = 'select' | 'pan';

export interface APIKeyItem {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
}

export interface SavedWorkflow {
  id: string;
  name: string;
  updatedAt: string;
  canvasData: {
    nodes: any[];
    edges: any[];
    viewport: { x: number; y: number; zoom: number };
  };
}

export interface ToolbarVisibility {
  autoMode: boolean;
  select: boolean;
  pan: boolean;
  note: boolean;
  imageLibrary: boolean;
  otherInput: boolean;
  run: boolean;
  undoRedo: boolean;
  reload: boolean;
  settings: boolean;
}

interface WorkflowState {
  workflowName: string;
  workflowEnabled: boolean;
  apiKey: string; // Legacy / computed active key
  apiKeys: APIKeyItem[];
  toolMode: ToolMode;
  autoOpenProperties: boolean;
  isPropertiesPanelOpen: boolean;
  fetchedModels: OpenRouterModel[];

  // Multi-Workflow Storage
  savedWorkflows: SavedWorkflow[];
  currentWorkflowId: string;
  toolbarVisibility: ToolbarVisibility;

  setWorkflowName: (name: string) => void;
  setWorkflowEnabled: (enabled: boolean) => void;
  
  // API Key Management
  setApiKey: (key: string) => void; // Legacy fallback
  addApiKey: (name: string, key: string) => void;
  removeApiKey: (id: string) => void;
  setActiveApiKey: (id: string) => void;

  setToolMode: (mode: ToolMode) => void;
  setAutoOpenProperties: (val: boolean) => void;
  setPropertiesPanelOpen: (val: boolean) => void;
  setToolbarVisibility: (vis: Partial<ToolbarVisibility>) => void;
  setFetchedModels: (models: OpenRouterModel[]) => void;

  saveCurrentWorkflow: () => void;
  loadWorkflow: (id: string) => void;
  createNewWorkflow: (name?: string) => void;
  deleteWorkflow: (id: string) => void;
  importWorkflow: (workflow: SavedWorkflow) => void;

  isSettingsOpen: boolean;
  setIsSettingsOpen: (val: boolean) => void;
  executingWorkflows: Record<string, WorkflowExecutionInfo>;
  activeAbortController: AbortController | null;
  cancelExecution: (workflowId?: string) => void;

  isExecuting: boolean;
  executeWorkflow: (targetWfId?: string) => Promise<void>;

  openVideoEditorNodeId: string | null;
  setOpenVideoEditorNodeId: (id: string | null) => void;
}

const DEFAULT_TOOLBAR_VISIBILITY: ToolbarVisibility = {
  autoMode: true,
  select: true,
  pan: true,
  note: true,
  imageLibrary: true,
  otherInput: true,
  run: true,
  undoRedo: true,
  reload: true,
  settings: true,
};

const DEFAULT_WORKFLOW_ID = 'default_wf';

export interface WorkflowExecutionInfo {
  isExecuting: boolean;
  controller: AbortController;
}

// Compute Topological Waves for Level-Based Parallel Execution
function getExecutionWaves(nodes: NodeData[], edges: any[]): NodeData[][] {
  const aiNodes = nodes.filter(n => n?.type?.startsWith('ai.'));
  if (aiNodes.length === 0) return [];

  const aiNodeMap = new Map<string, NodeData>();
  const aiNodeIds = new Set<string>();
  aiNodes.forEach(n => {
    aiNodeMap.set(n.id, n);
    aiNodeIds.add(n.id);
  });

  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  aiNodes.forEach(n => {
    inDegree.set(n.id, 0);
    graph.set(n.id, []);
  });

  edges.forEach(e => {
    const srcIsAi = aiNodeIds.has(e.source);
    const tgtIsAi = aiNodeIds.has(e.target);

    if (srcIsAi && tgtIsAi) {
      graph.get(e.source)!.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    } else if (srcIsAi && !tgtIsAi) {
      const downstreamEdges = edges.filter(de => de.source === e.target && aiNodeIds.has(de.target));
      downstreamEdges.forEach(de => {
        graph.get(e.source)!.push(de.target);
        inDegree.set(de.target, (inDegree.get(de.target) || 0) + 1);
      });
    }
  });

  const waves: NodeData[][] = [];
  let remainingNodes = new Set(aiNodes.map(n => n.id));

  while (remainingNodes.size > 0) {
    const currentWaveIds: string[] = [];
    remainingNodes.forEach(id => {
      if ((inDegree.get(id) || 0) <= 0) {
        currentWaveIds.push(id);
      }
    });

    if (currentWaveIds.length === 0) {
      const fallbackWave = Array.from(remainingNodes).map(id => aiNodeMap.get(id)!);
      waves.push(fallbackWave);
      break;
    }

    const currentWaveNodes: NodeData[] = [];
    currentWaveIds.forEach(id => {
      remainingNodes.delete(id);
      const node = aiNodeMap.get(id);
      if (node) currentWaveNodes.push(node);

      const neighbors = graph.get(id) || [];
      neighbors.forEach(tgtId => {
        inDegree.set(tgtId, (inDegree.get(tgtId) || 0) - 1);
      });
    });

    waves.push(currentWaveNodes);
  }

  return waves;
}

// Single Node Execution Function
async function executeSingleNode(
  node: NodeData,
  _allNodes: NodeData[],
  allEdges: any[],
  apiKey: string,
  controller: AbortController,
  targetWfId: string,
  fetchedModels: OpenRouterModel[] = []
): Promise<void> {
  if (controller.signal.aborted) {
    throw new Error('Execution cancelled');
  }

  const data = node.data || {};

  const incomingEdges = allEdges.filter(e => e.target === node.id);
  const textOrGeneralEdges = incomingEdges.filter(e => e.targetHandle === 'text' || !e.targetHandle || e.targetHandle === 'image');
  const fileEdges = incomingEdges.filter(e => e.targetHandle === 'file');

  for (const inEdge of incomingEdges) {
    const srcNode = canvasEngine.getNode(inEdge.source);
    if (!srcNode) continue;
    if (srcNode.type?.startsWith('ai.')) {
      if (srcNode.data?.output === undefined || srcNode.data?.output === 'Generating...') {
        throw new Error(`Node "${data.label || node.id}" đang chờ output từ node nguồn "${srcNode.data?.label || srcNode.id}". Node nguồn chưa sẵn sàng!`);
      }
    }
  }

  const promptParts: string[] = [];

  if (data.useOwnPrompt !== false && data.prompt) {
    promptParts.push(data.prompt as string);
  }

  for (const edge of textOrGeneralEdges) {
    const srcNode = canvasEngine.getNode(edge.source);
    if (!srcNode) continue;
    const srcData = srcNode.data || {};
    const srcName = srcData.label || srcNode.type || srcNode.id;

    if (srcNode.type === 'input.text' && srcData.text) {
      promptParts.push(srcData.text as string);
    } else if (srcNode.type === 'input.file' && srcData.extractedFile) {
      const ef = srcData.extractedFile as any;
      if (ef.text) {
        const ext = ef.name ? ef.name.slice(ef.name.lastIndexOf('.')).toLowerCase() : '';
        let lang = '';
        if (['.json', '.js', '.ts', '.css', '.html', '.py'].includes(ext)) lang = ext.replace('.', '');
        if (['.csv', '.tsv'].includes(ext)) lang = 'csv';
        if (['.md', '.markdown'].includes(ext)) lang = 'markdown';
        if (['.xml', '.svg'].includes(ext)) lang = 'xml';

        const mdFormattedContent = lang
          ? `### 📄 File Content: \`${ef.name}\`\n\`\`\`${lang}\n${ef.text}\n\`\`\``
          : `### 📄 File Content: \`${ef.name}\`\n\n${ef.text}`;

        promptParts.push(mdFormattedContent);
      }
    } else if (srcNode.type === 'ai.textGen' && typeof srcData.output === 'string') {
      promptParts.push(`=== Output từ node "${srcName}" ===\n${srcData.output}`);
    }
  }

  const promptText = promptParts.join('\n\n---\n\n');

  if (!promptText && node.type !== 'ai.videoGen') {
    console.warn(`[FlowForge Engine] Skipping node ${node.id} - empty prompt.`);
    return;
  }

  canvasEngine.updateNodeData(node.id, { isGenerating: true });

  try {
    const { chatCompletion, generateImage } = await import('../services/openRouterApi');
    const { saveMediaBlob } = await import('../services/mediaStorage');
    const { requestAccessToken, uploadFileToDrive } = await import('../services/googleDriveApi');

    if (node.type === 'ai.textGen') {
      canvasEngine.updateNodeData(node.id, { output: 'Generating...' });
      const messages: any[] = [];
      if (data.systemPrompt) messages.push({ role: 'system', content: data.systemPrompt });

      const contentParts: any[] = [];

      if (promptText) {
        contentParts.push({ type: 'text', text: promptText });
      }

      const isClaudeModel = (data.model as string)?.includes('anthropic') || (data.model as string)?.includes('claude');

      for (const fedge of fileEdges) {
        const srcNode = canvasEngine.getNode(fedge.source);
        if (!srcNode || srcNode.type !== 'input.file') continue;
        const ef = srcNode.data?.extractedFile as any;
        if (!ef) continue;

        if (isClaudeModel && ef.base64 && ef.mimeType === 'application/pdf') {
          contentParts.push({
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: ef.base64,
            }
          });
        } else {
          const ext = ef.name ? ef.name.slice(ef.name.lastIndexOf('.')).toLowerCase() : '';
          let lang = '';
          if (['.json', '.js', '.ts', '.css', '.html', '.py'].includes(ext)) lang = ext.replace('.', '');
          if (['.csv', '.tsv'].includes(ext)) lang = 'csv';
          if (['.md', '.markdown'].includes(ext)) lang = 'markdown';
          if (['.xml', '.svg'].includes(ext)) lang = 'xml';

          const mdFormattedContent = lang
            ? `### 📄 File Content: \`${ef.name}\`\n\`\`\`${lang}\n${ef.text}\n\`\`\``
            : `### 📄 File Content: \`${ef.name}\`\n\n${ef.text}`;

          contentParts.push({
            type: 'text',
            text: `\n\n${mdFormattedContent}\n\n`,
          });
        }
      }

      messages.push({ role: 'user', content: contentParts.length === 1 ? contentParts[0].text : contentParts });

      const modelToUse = resolveValidModelId(data.model as string, 'deepseek/deepseek-chat', fetchedModels);
      const hideReasoning = data.hideReasoning !== false;
      const requestParams: any = {
        temperature: typeof data.temperature === 'number' ? data.temperature : 0.7,
        top_p: typeof data.topP === 'number' ? data.topP : 1,
        max_tokens: data.maxTokens || 16000,
        response_format: data.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      };

      if (hideReasoning) {
        requestParams.reasoning = { exclude: true };
      }

      const response = await chatCompletion(apiKey, modelToUse, messages, requestParams, { signal: controller.signal });

      if (controller.signal.aborted) {
        canvasEngine.updateNodeData(node.id, { isGenerating: false });
        return;
      }

      const choiceMessage = response.choices?.[0]?.message || {};
      let rawContent = choiceMessage.content || '';
      let reasoningTrace = choiceMessage.reasoning || choiceMessage.reasoning_content || '';

      if (!reasoningTrace && typeof rawContent === 'string') {
        const thinkMatch = rawContent.match(/<think>([\s\S]*?)<\/think>/i);
        if (thinkMatch) {
          reasoningTrace = thinkMatch[1].trim();
          rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        }
      }

      let finalOutput = rawContent;

      if (!hideReasoning && reasoningTrace) {
        finalOutput = `[Reasoning Trace]\n${reasoningTrace}\n\n[Final Output]\n${rawContent}`;
      }

      if (!finalOutput) {
        finalOutput = typeof rawContent === 'string' ? rawContent : 'No output.';
      }

      canvasEngine.updateNodeData(node.id, { 
        output: finalOutput, 
        rawContent: rawContent,
        debugReasoning: reasoningTrace,
        isGenerating: false 
      });

      if (data.autoDownload) {
        const blob = new Blob([finalOutput], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `output_${node.id}_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      const allOutEdgesText = allEdges.filter(e => e.source === node.id);
      for (const outEdge of allOutEdgesText) {
        const targetNode = canvasEngine.getNode(outEdge.target);
        if (targetNode?.type === 'input.text') {
          canvasEngine.updateNodeData(outEdge.target, { text: rawContent || finalOutput, filledByAI: true });
        }
      }

    } else if (node.type === 'ai.audioGen') {
      canvasEngine.updateNodeData(node.id, { output: null, isGenerating: true });
      const modelToUse = resolveValidModelId(data.model as string, 'openai/tts-1', fetchedModels);
      const hideReasoning = data.hideReasoning !== false;
      const messages = [{ role: 'user', content: `Generate audio for: ${promptText}` }];
      const response = await chatCompletion(apiKey, modelToUse, messages, {
        max_tokens: 4096,
        reasoning: hideReasoning ? { exclude: true } : undefined,
      }, { signal: controller.signal });
      const content = response.choices?.[0]?.message?.content || '';
      canvasEngine.updateNodeData(node.id, { output: content, isGenerating: false });

    } else if (node.type === 'ai.transcription') {
      canvasEngine.updateNodeData(node.id, { output: null, isGenerating: true });
      const modelToUse = resolveValidModelId(data.model as string, 'openai/whisper', fetchedModels);
      const hideReasoning = data.hideReasoning !== false;
      const messages = [{ role: 'user', content: `Transcribe the audio from connected input. Content: ${promptText}` }];
      const response = await chatCompletion(apiKey, modelToUse, messages, {
        max_tokens: 4096,
        reasoning: hideReasoning ? { exclude: true } : undefined,
      }, { signal: controller.signal });
      const content = response.choices?.[0]?.message?.content || '';
      canvasEngine.updateNodeData(node.id, { output: content, isGenerating: false });

    } else if (node.type === 'ai.imageGen' || node.type === 'ai.videoGen') {
      canvasEngine.updateNodeData(node.id, { output: { previewUrl: null, status: 'Generating...' } });

      let blob: Blob | undefined;
      if (node.type === 'ai.imageGen') {
        const imageEdges = incomingEdges.filter(e => e.targetHandle === 'image');
        const imageSources: string[] = [];

        for (const ie of imageEdges) {
          const srcNode = canvasEngine.getNode(ie.source);
          if (!srcNode) continue;
          const srcUrl = srcNode.data?.output?.previewUrl || srcNode.data?.imageUrl || srcNode.data?.file;
          if (srcUrl && typeof srcUrl === 'string' && srcUrl !== '[Embedded Image]') {
            imageSources.push(srcUrl);
          }
        }

        if (Array.isArray(data.referenceImageNodeIds)) {
          for (const refId of data.referenceImageNodeIds as string[]) {
            const refNode = canvasEngine.getNode(refId);
            if (refNode) {
              const srcUrl = refNode.data?.output?.previewUrl || refNode.data?.imageUrl || refNode.data?.file;
              if (srcUrl && typeof srcUrl === 'string' && !imageSources.includes(srcUrl) && srcUrl !== '[Embedded Image]') {
                imageSources.push(srcUrl);
              }
            }
          }
        }

        let finalPrompt: any = promptText;

        if (imageSources.length > 0) {
          const contentParts: any[] = [];
          for (const imgUrl of imageSources) {
            let finalDataUrl = imgUrl;
            if (imgUrl.startsWith('blob:') || (imgUrl.startsWith('http') && !imgUrl.startsWith('data:'))) {
              try {
                const imgRes = await fetch(imgUrl, { signal: controller.signal });
                const imgBlob = await imgRes.blob();
                finalDataUrl = await new Promise<string>((resolve, reject) => {
                  const r = new FileReader();
                  r.onloadend = () => resolve(r.result as string);
                  r.onerror = reject;
                  r.readAsDataURL(imgBlob);
                });
              } catch (e) {
                console.warn('Failed converting blob image to data URI', e);
              }
            }
            contentParts.push({
              type: 'image_url',
              image_url: { url: finalDataUrl }
            });
          }
          contentParts.push({
            type: 'text',
            text: promptText || (data.prompt as string) || ''
          });
          finalPrompt = contentParts;
        }

        const validModel = resolveValidModelId(data.model as string, 'black-forest-labs/flux-1-schnell', fetchedModels);

        let imageUrl = '';
        try {
          console.log(`[FlowForge Image Engine] Node "${data.label || node.id}" using model: ${validModel}`);
          const response = await generateImage(apiKey, validModel, finalPrompt, {}, { signal: controller.signal });
          // Prefer direct _imageUrl shortcut (set by generateImage internally)
          imageUrl = (response as any)._imageUrl || '';
          const imageDataUrl: string = (response as any)._imageDataUrl || '';
          // If we already have the blob data (Pollinations / b64_json), skip the second fetch
          if (imageDataUrl) {
            const arr = imageDataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
            const bstr = atob(arr[1]);
            const bytes = new Uint8Array(bstr.length);
            for (let i = 0; i < bstr.length; i++) bytes[i] = bstr.charCodeAt(i);
            blob = new Blob([bytes], { type: mime });
          } else if (!imageUrl) {
            const content = response.choices?.[0]?.message?.content || '';
            const match = content.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/) || content.match(/(https?:\/\/[^\s\)]+)/);
            if (match && match[1]) imageUrl = match[1];
          }
        } catch (e: any) {
          if (e?.name === 'AbortError' || controller.signal.aborted) {
            canvasEngine.updateNodeData(node.id, { isGenerating: false });
            return;
          }
          console.warn('[FlowForge Image Engine] Generation failed, using Pollinations fallback:', e);
        }

        if (controller.signal.aborted) {
          canvasEngine.updateNodeData(node.id, { isGenerating: false });
          return;
        }

        if (!blob) {
          // blob not yet created (OpenRouter plain URL path or fallback)
          if (!imageUrl || !imageUrl.startsWith('http')) {
            const cleanPrompt = typeof promptText === 'string' && promptText
              ? promptText
              : ((data.prompt as string) || 'cinematic professional photograph');
            imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
          }
          const imgRes = await fetch(imageUrl, { signal: controller.signal });
          blob = await imgRes.blob();
        }
      } else {
        // ai.videoGen — OpenRouter /api/v1/videos with polling
        const { generateVideoOpenRouter, pollVideoStatus, fetchVideoContent } = await import('../services/openRouterApi');

        // Collect reference image from incoming image edges
        const videoImgEdges = incomingEdges.filter(e => e.targetHandle === 'image');
        let referenceImageUrl: string | undefined;
        for (const ie of videoImgEdges) {
          const srcNode = canvasEngine.getNode(ie.source);
          if (srcNode) {
            const url = srcNode.data?.output?.previewUrl || srcNode.data?.imageUrl;
            if (url && typeof url === 'string') { referenceImageUrl = url; break; }
          }
        }

        const videoModel = resolveValidModelId(data.model as string, 'minimax/video-01', fetchedModels);
        const videoPrompt = promptText || (data.prompt as string) || 'cinematic short film scene';

        canvasEngine.updateNodeData(node.id, { output: { previewUrl: null, status: 'Đang gửi yêu cầu tạo video...' } });

        const job = await generateVideoOpenRouter(
          apiKey, videoModel, videoPrompt,
          referenceImageUrl,
          { resolution: '720p', duration: (data.duration as number) || 5 },
          { signal: controller.signal }
        );

        const jobId = job.id;
        canvasEngine.updateNodeData(node.id, { output: { previewUrl: null, status: `Video đang xử lý (ID: ${jobId.slice(0, 8)}...)` } });

        // Poll every 15s, max 20 minutes
        const MAX_POLL = 80;
        let videoBlob: Blob | null = null;
        for (let attempt = 0; attempt < MAX_POLL; attempt++) {
          // Sleep 15s (abort-aware)
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(resolve, 15000);
            controller.signal.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
          });
          if (controller.signal.aborted) { canvasEngine.updateNodeData(node.id, { isGenerating: false }); return; }

          const status = await pollVideoStatus(apiKey, jobId, { signal: controller.signal });
          canvasEngine.updateNodeData(node.id, { output: { previewUrl: null, status: `Video đang xử lý... lần ${attempt + 1} (${status.status})` } });

          if (status.status === 'completed') {
            videoBlob = await fetchVideoContent(apiKey, jobId, { signal: controller.signal });
            break;
          } else if (status.status === 'failed' || status.status === 'error') {
            throw new Error(`Video generation failed: ${status.error || status.status}`);
          }
        }

        if (!videoBlob) throw new Error('Video generation timed out after 20 minutes');
        blob = videoBlob;
      }

      if (controller.signal.aborted) {
        canvasEngine.updateNodeData(node.id, { isGenerating: false });
        return;
      }

      const runId = Date.now().toString();
      const indexedDbKey = `${targetWfId}:${node.id}:${runId}`;
      if (!blob) {
        canvasEngine.updateNodeData(node.id, { isGenerating: false, output: { status: 'Error: image generation produced no output' } });
        return;
      }
      await saveMediaBlob(indexedDbKey, blob, node.type === 'ai.imageGen' ? 'image' : 'video', targetWfId, node.id);

      const previewUrl = URL.createObjectURL(blob);
      let driveFileId: string | undefined;

      const folderId = localStorage.getItem('flowforge_gdrive_folder');
      if (folderId) {
        try {
          const token = await requestAccessToken();
          driveFileId = await uploadFileToDrive(blob, `${node.id}_${runId}`, folderId, token);
        } catch (e) {
          console.error('Drive upload failed', e);
        }
      }

      canvasEngine.updateNodeData(node.id, {
        output: { previewUrl, indexedDbKey, driveFileId, sizeBytes: blob.size, createdAt: new Date().toISOString() },
        isGenerating: false,
      });

      if (data.autoDownload) {
        const a = document.createElement('a');
        a.href = previewUrl;
        const ext = node.type === 'ai.imageGen' ? 'png' : 'mp4';
        a.download = `media_${node.id}_${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      const allOutEdgesMedia = allEdges.filter(e => e.source === node.id);
      for (const outEdge of allOutEdgesMedia) {
        const targetNode = canvasEngine.getNode(outEdge.target);
        if (targetNode?.type === 'input.image') {
          canvasEngine.updateNodeData(outEdge.target, { previewUrl, imageUrl: previewUrl });
        }
      }
    }
  } catch (err: any) {
    console.error(`[FlowForge Execution Error] Node "${data.label || node.id}":`, err);
    canvasEngine.updateNodeData(node.id, { errorDetails: err.message || 'Lỗi không xác định khi gọi API', isGenerating: false });
    throw err;
  }
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      workflowName: 'New Workflow',
      workflowEnabled: false,
      apiKey: '',
      apiKeys: [],
      toolMode: 'select',
      autoOpenProperties: false,
      isPropertiesPanelOpen: false,
      isSettingsOpen: false,
      executingWorkflows: {},
      activeAbortController: null,
      isExecuting: false,
      fetchedModels: [],

      setIsSettingsOpen: (val) => set({ isSettingsOpen: val }),

      cancelExecution: (workflowId?: string) => {
        const wfId = workflowId || get().currentWorkflowId || DEFAULT_WORKFLOW_ID;
        const execInfo = get().executingWorkflows[wfId];
        if (execInfo?.controller) {
          execInfo.controller.abort();
        }

        if (wfId === get().currentWorkflowId) {
          const nodes = canvasEngine.getNodes();
          nodes.forEach(n => {
            if (n.data?.isGenerating || n.data?.isConcatting) {
              canvasEngine.updateNodeData(n.id, { isGenerating: false, isConcatting: false, statusMessage: 'Đã dừng theo dõi' });
            }
          });
        }

        set(state => {
          const updated = { ...state.executingWorkflows };
          delete updated[wfId];
          return { executingWorkflows: updated };
        });

        toast.warning('Đã dừng thực thi workflow!');
      },

      savedWorkflows: [
        {
          id: DEFAULT_WORKFLOW_ID,
          name: 'New Workflow',
          updatedAt: new Date().toISOString(),
          canvasData: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
        }
      ],
      currentWorkflowId: DEFAULT_WORKFLOW_ID,

      toolbarVisibility: DEFAULT_TOOLBAR_VISIBILITY,

      setWorkflowName: (name) => {
        set({ workflowName: name });
      },
      setWorkflowEnabled: (enabled) => set({ workflowEnabled: enabled }),
      
      // API Key Management
      setApiKey: (key) => {
        const { apiKeys } = get();
        if (!key) {
          set({ apiKey: '' });
          return;
        }
        if (apiKeys.length === 0) {
          set({
            apiKeys: [{ id: Date.now().toString(), name: 'Default Key', key, isActive: true }],
            apiKey: key,
          });
        } else {
          const updatedKeys = apiKeys.map((k) => ({
            ...k,
            isActive: k.key === key,
          }));
          const activeExists = updatedKeys.some((k) => k.isActive);
          if (!activeExists) {
            const newKey = { id: Date.now().toString(), name: 'API Key', key, isActive: true };
            set({ apiKeys: [...updatedKeys, newKey], apiKey: key });
          } else {
            set({ apiKeys: updatedKeys, apiKey: key });
          }
        }
      },
      addApiKey: (name, key) => {
        const { apiKeys } = get();
        const trimmedKey = key.trim();
        if (!trimmedKey) return;
        const existing = apiKeys.find(k => k.key === trimmedKey);
        if (existing) {
          const mapped = apiKeys.map(k => ({ ...k, isActive: k.key === trimmedKey }));
          set({ apiKeys: mapped, apiKey: trimmedKey });
          return;
        }
        const newKeys = [
          ...apiKeys.map(k => ({ ...k, isActive: false })),
          { id: Date.now().toString(), name: name.trim() || 'API Key', key: trimmedKey, isActive: true }
        ];
        set({ apiKeys: newKeys, apiKey: trimmedKey });
      },
      removeApiKey: (id) => {
        const { apiKeys } = get();
        const filtered = apiKeys.filter(k => k.id !== id);
        if (apiKeys.find(k => k.id === id)?.isActive && filtered.length > 0) {
          filtered[0].isActive = true;
          set({ apiKeys: filtered, apiKey: filtered[0].key });
        } else {
          set({ apiKeys: filtered, ...(filtered.length === 0 ? { apiKey: '' } : {}) });
        }
      },
      setActiveApiKey: (id) => {
        const { apiKeys } = get();
        const mapped = apiKeys.map(k => ({ ...k, isActive: k.id === id }));
        const activeKey = mapped.find(k => k.isActive)?.key || '';
        set({ apiKeys: mapped, apiKey: activeKey });
      },

      openVideoEditorNodeId: null,
      setOpenVideoEditorNodeId: (id) => set({ openVideoEditorNodeId: id }),

      setToolMode: (mode) => set({ toolMode: mode }),
      setAutoOpenProperties: (val) => set({ autoOpenProperties: val }),
      setPropertiesPanelOpen: (val) => set({ isPropertiesPanelOpen: val }),
      setToolbarVisibility: (vis) =>
        set((state) => ({
          toolbarVisibility: { ...state.toolbarVisibility, ...vis },
        })),
      setFetchedModels: (models) => set({ fetchedModels: models }),

      saveCurrentWorkflow: () => {
        const { currentWorkflowId, savedWorkflows, workflowName } = get();
        const canvasData = canvasEngine.serialize();

        const updatedWorkflows = savedWorkflows.map(wf => {
          if (wf.id === currentWorkflowId) {
            return {
              ...wf,
              name: workflowName,
              updatedAt: new Date().toISOString(),
              canvasData,
            };
          }
          return wf;
        });

        if (!updatedWorkflows.some(wf => wf.id === currentWorkflowId)) {
          updatedWorkflows.push({
            id: currentWorkflowId,
            name: workflowName,
            updatedAt: new Date().toISOString(),
            canvasData,
          });
        }

        set({ savedWorkflows: updatedWorkflows });
      },

      loadWorkflow: (id: string) => {
        const { savedWorkflows, currentWorkflowId } = get();
        if (currentWorkflowId) {
          get().saveCurrentWorkflow();
        }

        const target = savedWorkflows.find(w => w.id === id);
        if (target) {
          set({
            currentWorkflowId: target.id,
            workflowName: target.name,
          });
          if (target.canvasData) {
            canvasEngine.deserialize(target.canvasData);
          } else {
            canvasEngine.deserialize({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
          }
        }
      },

      createNewWorkflow: (name = 'New Workflow') => {
        const { currentWorkflowId, savedWorkflows } = get();
        if (currentWorkflowId) {
          get().saveCurrentWorkflow();
        }

        const newId = `wf_${Date.now()}`;
        const newWf: SavedWorkflow = {
          id: newId,
          name,
          updatedAt: new Date().toISOString(),
          canvasData: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
        };

        set({
          savedWorkflows: [...savedWorkflows, newWf],
          currentWorkflowId: newId,
          workflowName: name,
        });

        canvasEngine.deserialize({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
      },

      importWorkflow: (workflow: any) => {
        const { currentWorkflowId, savedWorkflows } = get();
        if (currentWorkflowId) {
          get().saveCurrentWorkflow();
        }

        // Helper to convert base64 data URIs to lightweight Blob URLs
        const convertDataUri = (str: any) => {
          if (typeof str === 'string' && str.startsWith('data:')) {
            try {
              const parts = str.split(',');
              const mimeMatch = parts[0].match(/:(.*?);/);
              const mime = mimeMatch ? mimeMatch[1] : 'image/png';
              const bstr = atob(parts[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
              }
              const blob = new Blob([u8arr], { type: mime });
              return URL.createObjectURL(blob);
            } catch (e) {
              return str;
            }
          }
          return str;
        };

        const canvasData = workflow.canvasData || workflow;
        const sanitizedNodes = (canvasData.nodes || []).map((node: any) => {
          const data = { ...node.data };
          if (data.file) {
            data.file = convertDataUri(data.file);
            data.imageUrl = data.file;
          }
          if (data.imageUrl) {
            data.imageUrl = convertDataUri(data.imageUrl);
          }
          if (data.output?.previewUrl) {
            const previewUrl = convertDataUri(data.output.previewUrl);
            data.output = { ...data.output, previewUrl };
          }
          return { ...node, data };
        });

        const sanitizedCanvasData = {
          ...canvasData,
          nodes: sanitizedNodes,
          edges: canvasData.edges || [],
          viewport: canvasData.viewport || { x: 0, y: 0, zoom: 1 }
        };

        const importedWf: SavedWorkflow = {
          id: `wf_imported_${Date.now()}`,
          name: workflow.name || workflow.workflowName || 'Imported Workflow',
          updatedAt: new Date().toISOString(),
          canvasData: sanitizedCanvasData
        };

        set({
          savedWorkflows: [...savedWorkflows, importedWf],
          currentWorkflowId: importedWf.id,
          workflowName: importedWf.name,
        });

        canvasEngine.deserialize(sanitizedCanvasData);
      },

      deleteWorkflow: (id: string) => {
        const { savedWorkflows, currentWorkflowId } = get();
        const filtered = (savedWorkflows || []).filter(w => w && w.id !== id);

        // If deleting left 0 workflows, automatically create a fresh clean workflow
        const fallbackWf: SavedWorkflow = {
          id: `wf_${Date.now()}`,
          name: 'New Workflow',
          updatedAt: new Date().toISOString(),
          canvasData: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
        };

        const finalWorkflows = filtered.length > 0 ? filtered : [fallbackWf];

        if (currentWorkflowId === id || !finalWorkflows.some(w => w.id === currentWorkflowId)) {
          const target = finalWorkflows[0];
          set({ 
            savedWorkflows: finalWorkflows,
            currentWorkflowId: target.id,
            workflowName: target.name || 'New Workflow',
          });
          if (target.canvasData) {
            canvasEngine.deserialize(target.canvasData);
          } else {
            canvasEngine.deserialize({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
          }
        } else {
          set({ savedWorkflows: finalWorkflows });
        }
      },

      executeWorkflow: async (targetWfId?: string) => {
        const { apiKey } = get();
        if (!apiKey) {
          set({ isSettingsOpen: true });
          toast.warning('Chưa có OpenRouter API Key! Vui lòng nhập Key trong Settings trước khi chạy.');
          return;
        }

        const wfId = targetWfId || get().currentWorkflowId || DEFAULT_WORKFLOW_ID;
        const currentExec = get().executingWorkflows?.[wfId];
        if (currentExec?.isExecuting) {
          toast.warning('Workflow này đang chạy!');
          return;
        }

        const controller = new AbortController();
        set(state => ({
          executingWorkflows: {
            ...(state.executingWorkflows || {}),
            [wfId]: { isExecuting: true, controller }
          }
        }));

        try {
          let allNodes: NodeData[] = [];
          let allEdges: any[] = [];

          if (wfId === get().currentWorkflowId) {
            allNodes = canvasEngine.getNodes();
            allEdges = canvasEngine.getEdges();
          } else {
            const savedWf = get().savedWorkflows.find(w => w.id === wfId);
            if (savedWf?.canvasData) {
              allNodes = savedWf.canvasData.nodes || [];
              allEdges = savedWf.canvasData.edges || [];
            }
          }

          const waves = getExecutionWaves(allNodes, allEdges);
          console.log(`[FlowForge Wave Engine] Starting workflow "${wfId}" in ${waves.length} parallel waves:`, waves.map(w => w.map(n => n.id)));

          for (let waveIdx = 0; waveIdx < waves.length; waveIdx++) {
            if (controller.signal.aborted) break;
            const currentWave = waves[waveIdx];

            console.log(`[FlowForge Wave Engine] Wave ${waveIdx + 1}/${waves.length}: Running ${currentWave.length} nodes in parallel...`);

            const waveResults = await Promise.allSettled(
              currentWave.map(node => executeSingleNode(node, allNodes, allEdges, apiKey, controller, wfId, get().fetchedModels))
            );

            if (controller.signal.aborted) break;

            const failed = waveResults.filter(r => r.status === 'rejected');
            if (failed.length > 0) {
              const errorMsgs = failed.map(r => (r as PromiseRejectedResult).reason?.message || 'Lỗi không xác định').join('; ');
              console.warn(`[FlowForge Wave Engine] Wave ${waveIdx + 1} completed with errors:`, errorMsgs);
            }
          }
        } catch (error: any) {
          toast.error('Workflow Execution error: ' + error.message);
        } finally {
          set(state => {
            const updated = { ...(state.executingWorkflows || {}) };
            delete updated[wfId];
            return { executingWorkflows: updated };
          });
        }
      },
    }),
    {
      name: 'flowforge-workflow-storage',
      partialize: (state) => {
        // Strip heavy base64 data: strings from savedWorkflows before saving to localStorage
        const sanitizedWorkflows = state.savedWorkflows.map(wf => ({
          ...wf,
          canvasData: {
            ...wf.canvasData,
            nodes: (wf.canvasData?.nodes || []).map((node: any) => {
              const data = node.data || {};
              const file = typeof data.file === 'string' && data.file.startsWith('data:') ? '[Embedded Image]' : data.file;
              const output = data.output ? {
                ...data.output,
                previewUrl: typeof data.output?.previewUrl === 'string' && data.output.previewUrl.startsWith('data:')
                  ? '[Embedded Output]'
                  : data.output?.previewUrl
              } : data.output;
              return { ...node, data: { ...data, file, output } };
            })
          }
        }));

        return {
          workflowName: state.workflowName,
          workflowEnabled: state.workflowEnabled,
          apiKey: state.apiKey,
          apiKeys: state.apiKeys,
          autoOpenProperties: state.autoOpenProperties,
          savedWorkflows: sanitizedWorkflows,
          currentWorkflowId: state.currentWorkflowId,
          toolbarVisibility: state.toolbarVisibility,
          fetchedModels: state.fetchedModels,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        try {
          // Rehydrate & sync API keys
          const { apiKey, apiKeys } = state;
          if (apiKey && (!apiKeys || apiKeys.length === 0)) {
            useWorkflowStore.setState({
              apiKeys: [{ id: Date.now().toString(), name: 'Default Key', key: apiKey, isActive: true }]
            });
          } else if (apiKeys && apiKeys.length > 0) {
            const activeItem = apiKeys.find(k => k.isActive);
            if (activeItem && activeItem.key !== apiKey) {
              useWorkflowStore.setState({ apiKey: activeItem.key });
            } else if (!activeItem) {
              const updatedKeys = apiKeys.map((k, idx) => ({ ...k, isActive: idx === 0 }));
              useWorkflowStore.setState({ apiKeys: updatedKeys, apiKey: updatedKeys[0].key });
            }
          }

          const { savedWorkflows, currentWorkflowId } = state;
          if (!savedWorkflows || savedWorkflows.length === 0) {
            const newId = `wf_${Date.now()}`;
            const fallback: SavedWorkflow = {
              id: newId,
              name: 'New Workflow',
              updatedAt: new Date().toISOString(),
              canvasData: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
            };
            useWorkflowStore.setState({
              savedWorkflows: [fallback],
              currentWorkflowId: newId,
              workflowName: 'New Workflow',
            });
            canvasEngine.deserialize({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
            return;
          }

          const current = savedWorkflows.find(w => w && w.id === currentWorkflowId) || savedWorkflows[0];
          if (current) {
            if (current.canvasData && Array.isArray(current.canvasData.nodes)) {
              canvasEngine.deserialize({
                nodes: current.canvasData.nodes,
                edges: current.canvasData.edges || [],
                viewport: current.canvasData.viewport || { x: 0, y: 0, zoom: 1 },
              });
            } else {
              canvasEngine.deserialize({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
            }
          }
        } catch (e) {
          console.error('[FlowForge] Rehydration restore failed:', e);
        }
      },
    }
  )
);
