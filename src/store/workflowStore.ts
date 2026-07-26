import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { canvasEngine, type NodeData } from '../engine/canvasEngine';
import { toast } from './toastStore';
import { type OpenRouterModel } from '../services/openRouterApi';

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

  isExecuting: boolean;
  executeWorkflow: () => Promise<void>;
}

const DEFAULT_TOOLBAR_VISIBILITY: ToolbarVisibility = {
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

// Topological Sort function for Execution Order
function getExecutionOrder(nodes: NodeData[], edges: any[]): NodeData[] {
  const nodeMap = new Map<string, NodeData>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    graph.set(n.id, []);
  });

  edges.forEach(e => {
    if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
      graph.get(e.source)!.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  const queue: string[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  const sorted: NodeData[] = [];
  while (queue.length > 0) {
    const currId = queue.shift()!;
    const currNode = nodeMap.get(currId);
    if (currNode) sorted.push(currNode);

    const neighbors = graph.get(currId) || [];
    for (const neighbor of neighbors) {
      const newDeg = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // Fallback if graph has cycles or disconnected nodes
  if (sorted.length < nodes.length) {
    nodes.forEach(n => {
      if (!sorted.includes(n)) sorted.push(n);
    });
  }

  return sorted;
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
      isExecuting: false,
      fetchedModels: [],

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
        if (apiKeys.length === 0) {
          set({ apiKeys: [{ id: Date.now().toString(), name: 'Default', key, isActive: true }], apiKey: key });
        } else {
          set({ apiKey: key });
        }
      },
      addApiKey: (name, key) => {
        const { apiKeys } = get();
        const isFirst = apiKeys.length === 0;
        const newKeys = [...apiKeys, { id: Date.now().toString(), name, key, isActive: isFirst }];
        set({ apiKeys: newKeys, ...(isFirst ? { apiKey: key } : {}) });
      },
      removeApiKey: (id) => {
        const { apiKeys } = get();
        const filtered = apiKeys.filter(k => k.id !== id);
        // If we removed the active one, activate the first available
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

      importWorkflow: (workflow: SavedWorkflow) => {
        const { currentWorkflowId, savedWorkflows } = get();
        if (currentWorkflowId) {
          get().saveCurrentWorkflow();
        }

        // Ensure unique ID to avoid conflicts
        const importedWf = { ...workflow, id: `wf_imported_${Date.now()}` };

        set({
          savedWorkflows: [...savedWorkflows, importedWf],
          currentWorkflowId: importedWf.id,
          workflowName: importedWf.name,
        });

        if (importedWf.canvasData) {
          canvasEngine.deserialize(importedWf.canvasData);
        } else {
          canvasEngine.deserialize({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
        }
      },

      deleteWorkflow: (id: string) => {
        const { savedWorkflows, currentWorkflowId } = get();
        if (savedWorkflows.length <= 1) return;

        const filtered = savedWorkflows.filter(w => w.id !== id);
        
        if (currentWorkflowId === id) {
          // Manually load the first available workflow to avoid triggering saveCurrentWorkflow on the deleted ID
          const target = filtered[0];
          set({ 
            savedWorkflows: filtered,
            currentWorkflowId: target.id,
            workflowName: target.name,
          });
          if (target.canvasData) {
            canvasEngine.deserialize(target.canvasData);
          } else {
            canvasEngine.deserialize({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
          }
        } else {
          set({ savedWorkflows: filtered });
        }
      },

      executeWorkflow: async () => {
        const { apiKey } = get();
        if (!apiKey) {
          toast.warning('Please set your OpenRouter API key in Settings first.');
          return;
        }

        set({ isExecuting: true });

        try {
          const allNodes = canvasEngine.getNodes();
          const allEdges = canvasEngine.getEdges();

          // Compute topological order so source nodes run BEFORE target nodes
          const orderedNodes = getExecutionOrder(allNodes, allEdges);
          const aiNodes = orderedNodes.filter(n => n?.type?.startsWith('ai.'));

          console.log('[FlowForge Engine] Starting execution in topological order:', aiNodes.map(n => `${n.data?.label || n.type} (${n.id})`));

          for (const node of aiNodes) {
            const data = node.data || {};
            if (!data.model) continue;

            // 1. Gather all incoming edges to this node
            const incomingEdges = allEdges.filter(e => e.target === node.id);

            // Separate into text/general handles vs file handle
            const textOrGeneralEdges = incomingEdges.filter(e => e.targetHandle === 'text' || !e.targetHandle || e.targetHandle === 'image');
            const fileEdges = incomingEdges.filter(e => e.targetHandle === 'file');

            // Check if any source node is missing output
            for (const inEdge of incomingEdges) {
              const srcNode = canvasEngine.getNode(inEdge.source);
              if (!srcNode) continue;
              if (srcNode.type?.startsWith('ai.')) {
                if (srcNode.data?.output === undefined || srcNode.data?.output === 'Generating...') {
                  throw new Error(`Node "${data.label || node.id}" đang chờ output từ node nguồn "${srcNode.data?.label || srcNode.id}". Node nguồn chưa chạy xong!`);
                }
              }
            }

            // 2. Build combined prompt from static user text + ALL connected source nodes
            const promptParts: string[] = [];

            // Add static prompt if available
            if (data.useOwnPrompt !== false && data.prompt) {
              promptParts.push(data.prompt as string);
            }

            // Iterate over all connected source nodes for text/general handles
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
              continue;
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

                // Build user message content parts (supports text + file)
                const contentParts: any[] = [];

                if (promptText) {
                  contentParts.push({ type: 'text', text: promptText });
                }

                // Collect file content from input.file nodes connected via 'file' handle
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

                console.log(`[FlowForge Request Payload] Node "${data.label || node.id}" (${data.model}):`, JSON.stringify(messages, null, 2));

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

                console.log(`[FlowForge Request API Params] Node "${data.label || node.id}":`, requestParams);

                const response = await chatCompletion(apiKey, data.model as string, messages, requestParams);

                const choiceMessage = response.choices?.[0]?.message || {};
                console.log(`[FlowForge Response Raw Message] Node "${data.label || node.id}":`, choiceMessage);

                let rawContent = choiceMessage.content || '';
                let reasoningTrace = choiceMessage.reasoning || choiceMessage.reasoning_content || '';

                // Handle models that embed reasoning trace directly inside content with <think>...</think> or similar tags
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

                console.log(`[FlowForge Extracted Output] Node "${data.label || node.id}":`, finalOutput);

                canvasEngine.updateNodeData(node.id, { 
                  output: finalOutput, 
                  rawContent: rawContent,
                  debugReasoning: reasoningTrace,
                  isGenerating: false 
                });

                // Auto Download Text Output
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

                // Propagate text output to downstream input.text nodes
                const allOutEdgesText = allEdges.filter(e => e.source === node.id);
                for (const outEdge of allOutEdgesText) {
                  const targetNode = canvasEngine.getNode(outEdge.target);
                  if (targetNode?.type === 'input.text') {
                    canvasEngine.updateNodeData(outEdge.target, { text: rawContent || finalOutput, filledByAI: true });
                  }
                }

              } else if (node.type === 'ai.imageGen' || node.type === 'ai.videoGen') {
                canvasEngine.updateNodeData(node.id, { output: { previewUrl: null, status: 'Generating...' } });

                let blob: Blob;
                if (node.type === 'ai.imageGen') {
                  console.log(`[FlowForge Request Payload] Node "${data.label || node.id}" (${data.model}) prompt:`, promptText);
                  const response = await generateImage(apiKey, data.model as string, promptText);
                  let imageUrl = '';
                  const content = response.choices?.[0]?.message?.content || '';
                  const match = content.match(/!\[.*?\]\((.*?)\)/) || content.match(/(https?:\/\/[^\s]+)/);
                  if (match && match[1]) {
                    imageUrl = match[1];
                  } else {
                    imageUrl = content;
                  }
                  
                  if (imageUrl.startsWith('http')) {
                    const imgRes = await fetch(imageUrl);
                    blob = await imgRes.blob();
                  } else {
                    throw new Error('Could not parse image URL from response: ' + content);
                  }
                } else {
                  blob = new Blob(['dummy video'], { type: 'video/mp4' });
                }

                const runId = Date.now().toString();
                const workflowId = get().currentWorkflowId || 'current_workflow';
                const indexedDbKey = `${workflowId}:${node.id}:${runId}`;
                await saveMediaBlob(indexedDbKey, blob, node.type === 'ai.imageGen' ? 'image' : 'video', workflowId, node.id);

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

                // Auto Download Media Output
                if (data.autoDownload) {
                  const a = document.createElement('a');
                  a.href = previewUrl;
                  const ext = node.type === 'ai.imageGen' ? 'png' : 'mp4';
                  a.download = `media_${node.id}_${Date.now()}.${ext}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }

                // Propagate image/video output to downstream input.image nodes
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
              canvasEngine.updateNodeData(node.id, { output: { error: err.message }, isGenerating: false });
              throw err;
            }
          }
        } catch (error: any) {
          toast.error('Workflow Execution error: ' + error.message);
        } finally {
          set({ isExecuting: false });
        }
      },
    }),
    {
      name: 'flowforge-workflow-storage',
      partialize: (state) => ({
        workflowName: state.workflowName,
        workflowEnabled: state.workflowEnabled,
        apiKey: state.apiKey,
        autoOpenProperties: state.autoOpenProperties,
        savedWorkflows: state.savedWorkflows,
        currentWorkflowId: state.currentWorkflowId,
        toolbarVisibility: state.toolbarVisibility,
        fetchedModels: state.fetchedModels,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        try {
          const { savedWorkflows, currentWorkflowId } = state;
          if (!savedWorkflows || savedWorkflows.length === 0) return;
          const current = savedWorkflows.find(w => w.id === currentWorkflowId) || savedWorkflows[0];
          if (current?.canvasData?.nodes?.length > 0) {
            canvasEngine.deserialize({
              nodes: current.canvasData.nodes,
              edges: current.canvasData.edges || [],
              viewport: current.canvasData.viewport || { x: 0, y: 0, zoom: 1 },
            });
          }
        } catch (e) {
          console.error('[FlowForge] Rehydration restore failed:', e);
        }
      },
    }
  )
);
