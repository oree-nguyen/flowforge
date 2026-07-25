// Removed @xyflow/react dependency

export type NodeType = 
  | 'input.text'
  | 'input.image'
  | 'ai.textGen'
  | 'ai.imageGen'
  | 'ai.videoGen'
  | 'util.download'
  | 'note'
  | 'noteFrame';

// Data interfaces
export interface InputTextData {
  text: string;
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
export type NoteNodeType = BaseNode & { type: 'note'; data: NoteData };
export type NoteFrameNodeType = BaseNode & { type: 'noteFrame'; data: NoteFrameData };
