import { useSyncExternalStore, useState, useRef } from 'react';
import { ChevronLeft, Save, Plus, FolderOpen, Trash2, Database } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { canvasEngine } from '../engine/canvasEngine';
import { RecoveryModal } from './RecoveryModal';
import { toast } from '../store/toastStore';

export function TopBar() {
  const { 
    workflowName, 
    setWorkflowName, 
    savedWorkflows, 
    currentWorkflowId, 
    loadWorkflow, 
    createNewWorkflow, 
    saveCurrentWorkflow,
    deleteWorkflow,
    importWorkflow
  } = useWorkflowStore();

  const [isSavedGlow, setIsSavedGlow] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nodeCount = useSyncExternalStore(
    cb => canvasEngine.subscribe(cb),
    () => canvasEngine.getNodes().length
  );

  const handleSave = () => {
    saveCurrentWorkflow();
    setIsSavedGlow(true);
    setTimeout(() => setIsSavedGlow(false), 1500);
  };

  const handleSelectWorkflow = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'NEW_WORKFLOW') {
      const name = prompt('Nhập tên cho Workflow mới:', 'New Workflow');
      if (name) {
        createNewWorkflow(name);
      }
    } else {
      loadWorkflow(val);
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.canvasData && Array.isArray(parsed.canvasData.nodes)) {
          importWorkflow(parsed);
          toast.success('Import workflow thành công!');
        } else {
          toast.error('File JSON không đúng định dạng workflow của FlowForge.');
        }
      } catch (err) {
        toast.error('Lỗi khi đọc file JSON: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = '';
  };

  return (
    <>
      <div className="h-[56px] w-full bg-panel backdrop-blur-panel border-b border-border-subtle flex items-center justify-between px-4 z-20 shrink-0">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-border-subtle rounded-xl text-text-muted hover:text-text-primary transition-colors" title="Back">
            <ChevronLeft size={20} />
          </button>

          {/* Editable workflow name */}
          <input
            type="text"
            value={workflowName}
            onChange={e => setWorkflowName(e.target.value)}
            className="bg-transparent border border-transparent hover:border-border-subtle focus:border-accent-lime rounded-lg px-2 py-1 text-sm font-medium text-text-primary outline-none transition-colors min-w-[120px] max-w-[220px]"
            placeholder="Workflow name..."
          />

          {/* Workflow switcher dropdown */}
          <select
            value={currentWorkflowId}
            onChange={handleSelectWorkflow}
            className="bg-canvas border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-muted outline-none cursor-pointer hover:border-text-muted transition-colors max-w-[160px]"
            title="Switch workflow"
          >
            {savedWorkflows.map(wf => (
              <option key={wf.id} value={wf.id} className="bg-panel">
                {wf.name}
              </option>
            ))}
            <option value="NEW_WORKFLOW" className="bg-panel text-accent-lime">+ New Workflow</option>
          </select>

          <span className="text-xs text-text-muted">{nodeCount} nodes</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Recovery button */}
          <button
            onClick={() => setIsRecoveryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border-subtle hover:border-orange-400 text-text-muted hover:text-orange-400 rounded-xl transition-all"
            title="Khôi phục workflow từ localStorage"
          >
            <Database size={13} />
            <span>Recovery</span>
          </button>

          {/* Delete current workflow */}
          {savedWorkflows.length > 1 && (
            <button
              onClick={() => {
                if (confirm(`Xóa workflow "${workflowName}"?`)) {
                  deleteWorkflow(currentWorkflowId);
                }
              }}
              className="p-2 hover:bg-red-500/10 hover:text-red-400 text-text-muted rounded-xl transition-colors"
              title="Delete workflow"
            >
              <Trash2 size={15} />
            </button>
          )}

          {/* New workflow */}
          <button
            onClick={() => {
              const name = prompt('Tên Workflow mới:', 'New Workflow');
              if (name) createNewWorkflow(name);
            }}
            className="p-2 hover:bg-border-subtle text-text-muted hover:text-text-primary rounded-xl transition-colors"
            title="New workflow"
          >
            <Plus size={16} />
          </button>

          {/* Import JSON workflow */}
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImportJSON} 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-border-subtle text-text-muted hover:text-text-primary rounded-xl transition-colors"
            title="Import workflow từ JSON"
          >
            <FolderOpen size={16} />
          </button>

          {/* SAVE */}
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              isSavedGlow
                ? 'bg-accent-lime text-black scale-95'
                : 'bg-accent-lime/20 border border-accent-lime/40 text-accent-lime hover:bg-accent-lime hover:text-black'
            }`}
          >
            <Save size={14} />
            {isSavedGlow ? 'Saved!' : 'SAVE'}
          </button>
        </div>
      </div>

      {isRecoveryOpen && <RecoveryModal onClose={() => setIsRecoveryOpen(false)} />}
    </>
  );
}
