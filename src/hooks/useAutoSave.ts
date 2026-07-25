import { useEffect } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { canvasEngine } from '../engine/canvasEngine';

export function useAutoSave() {
  const saveCurrentWorkflow = useWorkflowStore((state) => state.saveCurrentWorkflow);

  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-save if canvas has nodes
      if (canvasEngine.getNodes().length > 0) {
        saveCurrentWorkflow();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [saveCurrentWorkflow]);
}
