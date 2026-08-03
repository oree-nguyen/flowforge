import { useEffect } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { canvasEngine } from '../engine/canvasEngine';

export function useKeyboardShortcuts(onToggleGuide: () => void) {
  const { saveCurrentWorkflow, setToolMode, toolMode } = useWorkflowStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea or operating inside open video editor workspace
      const active = document.activeElement as HTMLElement | null;
      const openVideoEditorNodeId = useWorkflowStore.getState().openVideoEditorNodeId;
      if (
        active?.tagName === 'INPUT' ||
        active?.tagName === 'TEXTAREA' ||
        active?.isContentEditable ||
        openVideoEditorNodeId !== null
      ) {
        return;
      }

      // Space -> pan mode (temporary logic, implemented in useCanvasEngine for drag)

      switch (e.key.toLowerCase()) {
        case 'tab':
          e.preventDefault();
          setToolMode(toolMode === 'select' ? 'pan' : 'select');
          break;

        case 'escape':
          e.preventDefault();
          canvasEngine.clearSelection();
          break;

        case 'delete':
        case 'backspace':
          e.preventDefault();
          {
            const selectedIds = canvasEngine.getSelectedIds();
            const nodes = canvasEngine.getNodes().filter(n => selectedIds.includes(n.id));
            const hasValuableOutput = nodes.some(n => !!n.data?.output || !!n.data?.file || !!n.data?.outputVideo);
            if (!hasValuableOutput || window.confirm('Một hoặc nhiều node đang chọn có chứa dữ liệu/kết quả đã tạo. Bạn có chắc muốn xóa không?')) {
              canvasEngine.deleteSelected();
            }
          }
          break;

        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            canvasEngine.selectAll();
          }
          break;

        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            canvasEngine.copySelected();
          }
          break;

        case 'v':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            canvasEngine.pasteClipboard();
          }
          break;

        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              canvasEngine.redo();
            } else {
              canvasEngine.undo();
            }
          }
          break;

        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            canvasEngine.redo();
          }
          break;

        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            saveCurrentWorkflow();
          }
          break;

        case 'k':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onToggleGuide();
          }
          break;

        case '=':
        case '+':
          e.preventDefault();
          canvasEngine.zoomIn();
          break;

        case '-':
          e.preventDefault();
          canvasEngine.zoomOut();
          break;

        case '0':
          e.preventDefault();
          canvasEngine.resetView();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentWorkflow, setToolMode, toolMode, onToggleGuide]);
}
