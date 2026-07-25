/**
 * React hook to subscribe to canvasEngine state changes
 */
import { useSyncExternalStore } from 'react';
import { canvasEngine } from './canvasEngine';

export function useCanvasEngine() {
  const state = useSyncExternalStore(
    (cb) => canvasEngine.subscribe(cb),
    canvasEngine.getSnapshot
  );

  return { ...state, engine: canvasEngine };
}

export function useNodeData(id: string) {
  return useSyncExternalStore(
    (cb) => canvasEngine.subscribe(cb),
    () => canvasEngine.getNode(id)
  );
}
