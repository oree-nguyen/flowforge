import { chatCompletion } from './openRouterApi';
import type { NodeData, EdgeData } from '../engine/canvasEngine';

export interface AutoWorkflowProgress {
  stage: 'call1_scene_analysis' | 'call2_scene_nodes' | 'merging' | 'validating' | 'done' | 'error';
  message: string;
  percent: number; // 0 - 100
  partialError?: string;
}

export type ProgressCallback = (p: AutoWorkflowProgress) => void;

export interface AssetRegistryItem {
  asset_id: string;
  asset_type: 'character' | 'variant' | 'object' | 'environment';
  description: string;
  applies_to_asset_id?: string | null;
}

export interface SceneItem {
  scene_id: string;
  summary: string;
  asset_ids_used: string[];
}

export interface Call1Output {
  assets: AssetRegistryItem[];
  scenes: SceneItem[];
}

export interface SceneNodeResult {
  scene_id: string;
  nodes: Array<{
    node_id: string;
    type: string;
    asset_ref?: string;
    scene_id?: string;
    data: Record<string, any>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
}

const MODEL_CANDIDATES = [
  'deepseek/deepseek-chat',
  'deepseek/deepseek-r1',
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct',
];

// ── Call API helper with DeepSeek V4 Flash config & retries ──
async function callDeepSeekJSON<T>(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 8000,
  maxRetries: number = 4
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      const selectedModel = MODEL_CANDIDATES[(attempt - 1) % MODEL_CANDIDATES.length];

      const params: Record<string, any> = {
        model: selectedModel,
        thinking: { type: 'disabled' },
        max_tokens: maxTokens,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      };

      const response = await chatCompletion(apiKey, selectedModel, messages, params);

      // Log prompt caching usage if present
      if (response?.usage) {
        console.log(`[AutoOrchestrator ${selectedModel} Cache] hit: ${response.usage.prompt_cache_hit_tokens || 0}, miss: ${response.usage.prompt_cache_miss_tokens || 0}`);
      }

      const choice = response.choices?.[0];
      if (choice?.finish_reason === 'length') {
        throw new Error('Response output was truncated due to max_tokens limit.');
      }

      let rawContent = choice?.message?.content || '';
      // Strip markdown code fences if model accidentally wrapped output
      rawContent = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();

      const parsed = JSON.parse(rawContent) as T;
      return parsed;
    } catch (err: any) {
      lastError = err;
      console.warn(`[AutoOrchestrator Call Attempt ${attempt}/${maxRetries} Failed]:`, err.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1200 * attempt));
      }
    }
  }

  throw new Error(`AI generation failed after ${maxRetries} attempts: ${lastError?.message}`);
}

// ── System Prompts ──
const CALL1_SYSTEM_PROMPT = `YOU ARE AN EXPERT FILM DIRECTOR AND WORKFLOW ARCHITECT FOR FLOWFORGE.
YOUR ONLY TASK IS TO OUTPUT VALID 100% RAW JSON. DO NOT INCLUDE ANY MARKDOWN FENCES, GREETINGS, OR EXPLANATIONS.

GIVEN A MOVIE TOPIC/STORY IDEA FROM THE USER:
1. Break down the movie into a clear sequence of scenes ("scenes").
2. Build a comprehensive, non-redundant asset registry ("assets") listing ALL characters, variants (outfit/color changes), objects, and environments across the movie.

JSON SCHEMA OUTPUT:
{
  "assets": [
    {
      "asset_id": "character_name",
      "asset_type": "character" | "variant" | "object" | "environment",
      "description": "Detailed visual description of visual appearance...",
      "applies_to_asset_id": null // Or asset_id of character if asset_type is "variant"
    }
  ],
  "scenes": [
    {
      "scene_id": "scene_1",
      "summary": "Detailed summary of what happens in scene 1...",
      "asset_ids_used": ["character_name", "env_name"]
    }
  ]
}

RULES:
- Every recurring entity MUST have a unique "asset_id".
- If a character changes costume/outfit in a later scene, create a "variant" asset with applies_to_asset_id = character's asset_id.
- DO NOT create duplicate asset_ids for the same character.
- Output MUST be 100% pure JSON starting with { and ending with }.`;

function buildCall2SystemPrompt(assetRegistry: AssetRegistryItem[]): string {
  return `YOU ARE AN EXPERT FILM PIPELINE ARCHITECT FOR FLOWFORGE.
YOUR ONLY TASK IS TO OUTPUT VALID 100% RAW JSON FOR NODES AND EDGES OF A SPECIFIC MOVIE SCENE.
DO NOT INCLUDE ANY MARKDOWN CODE FENCES, INTROS, OUTROS, OR EXPLANATIONS.

GLOBAL ASSET REGISTRY FOR THIS MOVIE (STRICT REFERENCE - REUSE ASSET IDs ONLY):
${JSON.stringify(assetRegistry, null, 2)}

DEFAULT MODEL IDs TO USE:
- For Image Nodes: "black-forest-labs/flux-1-schnell"
- For Video Nodes: "minimax/video-01"

RULES FOR SCENE NODE GENERATION:
1. For any character/object/environment asset used for the FIRST TIME in the movie, create an AI Image Node (type: "ai.imageGen") to generate the primary reference image.
2. If a character appears with a "variant" outfit in this scene, create an AI Image Node for the variant outfit, AND another composed AI Image Node with referenceImageNodeIds = [character_base_image_node_id, variant_outfit_node_id] with prompt instructing to apply outfit to character while preserving facial features.
3. Create 1 AI Video Node (type: "ai.videoGen") for the scene with detailed prompt covering action, character movements, environment, camera angle, visual effects, and in-scene dialogue (if any).
4. Connect edges: Reference Image Node(s) -> Composed Image Node (if any) -> Scene AI Video Node.
5. DO NOT ADD ANY DUBBING OR SUBTITLE NODES (ai.dubSub) TO THE WORKFLOW.

JSON SCHEMA OUTPUT FOR THE SCENE:
{
  "scene_id": "scene_X",
  "nodes": [
    {
      "node_id": "img_asset_id",
      "type": "ai.imageGen",
      "asset_ref": "asset_id",
      "data": {
        "model": "black-forest-labs/flux-1-schnell",
        "prompt": "Detailed description for reference image...",
        "aspectRatio": "16:9",
        "label": "Reference Image - Asset Name"
      }
    },
    {
      "node_id": "video_scene_X",
      "type": "ai.videoGen",
      "data": {
        "model": "minimax/video-01",
        "prompt": "Detailed prompt for 8s scene video action, camera, environment, dialogue...",
        "duration": 5,
        "aspectRatio": "16:9",
        "label": "Video - Scene X"
      }
    }
  ],
  "edges": [
    {
      "source": "img_asset_id",
      "target": "video_scene_X",
      "sourceHandle": "out",
      "targetHandle": "image"
    }
  ]
}

OUTPUT MUST BE 100% PURE JSON ONLY.`;
}

// ── Grid Layout Engine for Workflow Nodes ──
function layoutWorkflowNodes(nodes: NodeData[], edges: EdgeData[]): { nodes: NodeData[]; edges: EdgeData[] } {
  const SCENE_SPACING_X = 650;
  const PIPELINE_STEP_X = 360;
  const NODE_SPACING_Y = 480;

  // Group nodes by scene_id metadata
  const sceneGroups = new Map<string, NodeData[]>();
  const unassigned: NodeData[] = [];

  nodes.forEach(node => {
    const sceneId = node.data?.scene_id || (node.id.match(/scene_\d+/)?.[0]);
    if (sceneId) {
      if (!sceneGroups.has(sceneId)) sceneGroups.set(sceneId, []);
      sceneGroups.get(sceneId)!.push(node);
    } else {
      unassigned.push(node);
    }
  });

  let currentSceneX = 100;

  sceneGroups.forEach((sceneNodes) => {
    // Separate scene nodes into pipeline layers:
    // Layer 0: Base Asset Images
    // Layer 1: Composed / Variant Images
    // Layer 2: Video Gen Node
    const baseImages = sceneNodes.filter(n => n.type === 'ai.imageGen' && !n.data?.referenceImageNodeIds?.length);
    const composedImages = sceneNodes.filter(n => n.type === 'ai.imageGen' && n.data?.referenceImageNodeIds?.length);
    const videoNodes = sceneNodes.filter(n => n.type === 'ai.videoGen');
    const remaining = sceneNodes.filter(n => !baseImages.includes(n) && !composedImages.includes(n) && !videoNodes.includes(n));

    // Position Base Images
    baseImages.forEach((n, idx) => {
      n.position = { x: currentSceneX, y: 100 + idx * NODE_SPACING_Y };
    });

    // Position Composed Images
    const layer1X = baseImages.length > 0 ? currentSceneX + PIPELINE_STEP_X : currentSceneX;
    composedImages.forEach((n, idx) => {
      n.position = { x: layer1X, y: 100 + idx * NODE_SPACING_Y };
    });

    // Position Video Nodes
    const layer2X = layer1X + PIPELINE_STEP_X;
    videoNodes.forEach((n, idx) => {
      n.position = { x: layer2X, y: 100 + idx * NODE_SPACING_Y };
    });

    // Position remaining nodes if any
    remaining.forEach((n, idx) => {
      n.position = { x: layer2X + PIPELINE_STEP_X, y: 100 + idx * NODE_SPACING_Y };
    });

    currentSceneX += SCENE_SPACING_X * 1.5;
  });

  // Layout unassigned nodes if any
  unassigned.forEach((n, idx) => {
    n.position = { x: currentSceneX, y: 100 + idx * NODE_SPACING_Y };
  });

  return { nodes, edges };
}

// ── Main Auto Orchestration Pipeline ──
export async function generateAutoWorkflow(
  apiKey: string,
  movieTopic: string,
  onProgress: ProgressCallback
): Promise<{ nodes: NodeData[]; edges: EdgeData[] }> {
  // Step 1: Call 1 - Scene & Asset Analysis
  onProgress({
    stage: 'call1_scene_analysis',
    message: 'Đang phân tích kịch bản & trích xuất danh sách nhân vật, bối cảnh...',
    percent: 15,
  });

  const userTopicPrompt = `TẠO WORKFLOW PHIM CHO CHỦ ĐỀ/Ý TƯỞNG SAU:
"${movieTopic}"

Hãy phân rã thành các khung cảnh chi tiết và danh sách asset đầy đủ theo JSON schema đã quy định.`;

  const call1Result = await callDeepSeekJSON<Call1Output>(
    apiKey,
    CALL1_SYSTEM_PROMPT,
    userTopicPrompt,
    8000
  );

  if (!call1Result?.assets || !call1Result?.scenes || call1Result.scenes.length === 0) {
    throw new Error('Call 1 failed to generate valid scenes and assets breakdown.');
  }

  console.log('[AutoOrchestrator Call 1 Output]:', call1Result);

  // Step 2: Call 2..N - Generate Scene Nodes (Parallel execution)
  onProgress({
    stage: 'call2_scene_nodes',
    message: `Đã xác định ${call1Result.scenes.length} khung cảnh & ${call1Result.assets.length} asset. Đang tạo node cho các cảnh...`,
    percent: 40,
  });

  const systemPromptWithAssets = buildCall2SystemPrompt(call1Result.assets);

  // Track created asset reference node IDs to prevent duplicate asset nodes across scenes
  const createdAssetNodeMap = new Map<string, string>(); // asset_id -> node_id

  // Track all generated nodes & edges
  const allRawNodes: any[] = [];
  const allRawEdges: any[] = [];
  let partialErrors: string[] = [];

  const scenePromises = call1Result.scenes.map(async (scene, idx) => {
    const sceneUserPrompt = `SINH NODE & EDGES CHO KHUNG CẢNH SAU:
Scene ID: ${scene.scene_id}
Scene Order: Cảnh ${idx + 1}/${call1Result.scenes.length}
Scene Summary: ${scene.summary}
Assets used in this scene: ${JSON.stringify(scene.asset_ids_used)}

Hãy xuất ra JSON đúng schema scene nodes & edges.`;

    try {
      const sceneResult = await callDeepSeekJSON<SceneNodeResult>(
        apiKey,
        systemPromptWithAssets,
        sceneUserPrompt,
        6000
      );
      return sceneResult;
    } catch (e: any) {
      console.error(`[AutoOrchestrator Scene ${scene.scene_id} Failed]:`, e);
      partialErrors.push(`Cảnh ${idx + 1} (${scene.scene_id}): ${e.message}`);
      return null;
    }
  });

  const sceneResults = await Promise.all(scenePromises);

  // Step 3: Merge & Deduplicate
  onProgress({
    stage: 'merging',
    message: 'Đang tổng hợp & loại bỏ node asset trùng lặp...',
    percent: 75,
  });

  sceneResults.forEach((sr, idx) => {
    if (!sr) return;
    const sceneId = call1Result.scenes[idx]?.scene_id || `scene_${idx + 1}`;

    (sr.nodes || []).forEach(node => {
      const assetRef = node.asset_ref;

      // If node represents a base asset reference (not composed variant)
      if (assetRef && node.type === 'ai.imageGen' && !node.data?.referenceImageNodeIds?.length) {
        if (createdAssetNodeMap.has(assetRef)) {
          // Asset node already exists from a previous scene!
          const existingNodeId = createdAssetNodeMap.get(assetRef)!;
          // Redirect all edges targeting this node to existingNodeId
          (sr.edges || []).forEach(edge => {
            if (edge.source === node.node_id) edge.source = existingNodeId;
            if (edge.target === node.node_id) edge.target = existingNodeId;
          });
          return; // Skip duplicate node insertion
        } else {
          createdAssetNodeMap.set(assetRef, node.node_id);
        }
      }

      node.scene_id = sceneId;
      allRawNodes.push(node);
    });

    (sr.edges || []).forEach(edge => {
      allRawEdges.push(edge);
    });
  });

  // Step 4: Validate Nodes & Edges
  onProgress({
    stage: 'validating',
    message: 'Đang kiểm tra tính hợp lệ của liên kết node & xếp lưới...',
    percent: 90,
  });

  const existingNodeIds = new Set(allRawNodes.map(n => n.node_id));

  // Convert to FlowForge NodeData format
  const formattedNodes: NodeData[] = allRawNodes.map((n, i) => {
    const rawId = n.node_id || `auto_${Date.now()}_${i}`;
    const id = rawId.startsWith('node_') ? rawId : `node_${rawId}`;

    // Sanitize model ID: If LLM generated invalid/dummy model ID or unknown model, fallback to solid defaults
    let rawModel = (n.data?.model as string) || '';
    const nodeType = n.type || 'ai.imageGen';
    if (!rawModel || rawModel.includes('banana') || rawModel.includes('veo') || !rawModel.includes('/')) {
      if (nodeType === 'ai.videoGen') rawModel = 'minimax/video-01';
      else if (nodeType === 'ai.imageGen') rawModel = 'black-forest-labs/flux-1-schnell';
      else rawModel = 'google/gemini-2.0-flash-001';
    }

    return {
      id,
      type: n.type || 'ai.imageGen',
      position: { x: 0, y: 0 },
      data: {
        model: rawModel,
        prompt: n.data?.prompt || '',
        aspectRatio: n.data?.aspectRatio || '16:9',
        duration: n.data?.duration || 5,
        nodeName: n.data?.label || n.data?.nodeName || (n.type === 'ai.videoGen' ? `Video Cảnh ${i + 1}` : `Image Asset`),
        scene_id: n.scene_id,
        asset_ref: n.asset_ref,
        referenceImageNodeIds: (n.data?.referenceImageNodeIds || []).map((rid: string) => rid.startsWith('node_') ? rid : `node_${rid}`),
      }
    };
  });

  // Filter valid edges
  const formattedEdges: EdgeData[] = [];
  const edgeIdSet = new Set<string>();
  const formatNodeId = (id: string) => id.startsWith('node_') ? id : `node_${id}`;

  allRawEdges.forEach((e) => {
    if (existingNodeIds.has(e.source) && existingNodeIds.has(e.target)) {
      const srcId = formatNodeId(e.source);
      const tgtId = formatNodeId(e.target);
      const edgeId = `edge_${srcId}_${tgtId}_${e.sourceHandle || 'out'}_${e.targetHandle || 'in'}`;
      if (!edgeIdSet.has(edgeId)) {
        edgeIdSet.add(edgeId);
        formattedEdges.push({
          id: edgeId,
          source: srcId,
          target: tgtId,
          sourceHandle: e.sourceHandle || 'out',
          targetHandle: e.targetHandle || (e.source.includes('img') ? 'image' : 'text'),
        });
      }
    }
  });

  // Apply Grid Layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = layoutWorkflowNodes(formattedNodes, formattedEdges);

  onProgress({
    stage: 'done',
    message: 'Tạo workflow tự động thành công!',
    percent: 100,
    partialError: partialErrors.length > 0 ? partialErrors.join('\n') : undefined,
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
