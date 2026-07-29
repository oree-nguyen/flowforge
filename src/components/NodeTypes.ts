/**
 * NodeTypes.ts - Type definitions for node components
 */

export type NodeProps<_T = any> = {
  id: string;
  data: Record<string, any>;
  selected: boolean;
  onConnectStart?: (e: React.PointerEvent, id: string, handle?: 'out') => void;
  onDisconnectStart?: (e: React.PointerEvent, id: string, handle?: string) => void;
};

// Noop Handle - ports are rendered by CanvasRenderer
export function Handle(_props: { type?: string; position?: string; className?: string }) {
  return null;
}

export const Position = {
  Left: 'left',
  Right: 'right',
  Top: 'top',
  Bottom: 'bottom',
} as const;
