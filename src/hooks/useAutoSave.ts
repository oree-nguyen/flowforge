import { useEffect, useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { canvasEngine } from '../engine/canvasEngine';

export function useAutoSave() {
  const saveCurrentWorkflow = useWorkflowStore((state) => state.saveCurrentWorkflow);
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-save if canvas has nodes (prevents overwriting with empty canvas on initial load errors)
      if (canvasEngine.getNodes().length > 0) {
        saveCurrentWorkflow();
        
        // Show toast
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 1500);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [saveCurrentWorkflow]);

  return saveToast;
}
