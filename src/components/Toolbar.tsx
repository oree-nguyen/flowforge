import { useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { Settings, Undo2, Redo2, Play, MousePointer2, Hand, ImagePlus, Plus, StickyNote, RefreshCw, FileText } from 'lucide-react';
import { AddNodePopover } from './AddNodePopover';
import { canvasEngine } from '../engine/canvasEngine';

export function Toolbar({ onOpenSettings, onOpenImageLibrary }: { onOpenSettings?: () => void, onOpenImageLibrary?: () => void }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const isExecuting = useWorkflowStore(state => state.isExecuting);
  const toolMode = useWorkflowStore(state => state.toolMode);
  const setToolMode = useWorkflowStore(state => state.setToolMode);
  const toolbarVisibility = useWorkflowStore(state => state.toolbarVisibility || {});

  const handleQuickAdd = (type: string) => {
    const vp = canvasEngine.getViewport();
    const x = (200 - vp.x) / vp.zoom + Math.random() * 100;
    const y = (200 - vp.y) / vp.zoom + Math.random() * 100;
    canvasEngine.addNode({
      id: `node_${Date.now()}`,
      type,
      position: { x, y },
      data: {},
    });
  };

  const isVisible = (key: string) => toolbarVisibility[key as keyof typeof toolbarVisibility] !== false;

  return (
    <>
      <div className="absolute left-2 sm:left-6 top-3 sm:top-6 bottom-20 sm:bottom-24 w-[48px] sm:w-[56px] bg-panel backdrop-blur-panel border border-border-subtle rounded-2xl flex flex-col items-center py-2.5 sm:py-3 z-10 shadow-xl overflow-hidden">
        
        {/* Primary Actions */}
        <div className="flex flex-col gap-3 w-full px-2 items-center">
          <button 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform shadow-[0_0_15px_rgba(198,241,53,0.3)]
              ${isAddOpen ? 'bg-text-primary text-canvas scale-105' : 'bg-accent-lime text-canvas hover:scale-105'}
            `}
            onClick={() => setIsAddOpen(!isAddOpen)}
            title="Add Node"
          >
            <Plus size={24} strokeWidth={2.5} className={isAddOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
          </button>
        </div>

        <div className="w-8 h-[1px] bg-border-subtle my-3"></div>

        {/* Tools */}
        <div className="flex flex-col gap-1 w-full px-2 items-center flex-1 overflow-y-auto no-scrollbar">
          {isVisible('select') && (
            <ToolButton icon={<MousePointer2 size={18} />} active={toolMode === 'select'} tooltip="Select (V)" onClick={() => setToolMode('select')} />
          )}
          {isVisible('pan') && (
            <ToolButton icon={<Hand size={18} />} active={toolMode === 'pan'} tooltip="Pan (Space)" onClick={() => setToolMode('pan')} />
          )}
          
          {(isVisible('select') || isVisible('pan')) && (isVisible('note') || isVisible('imageLibrary') || isVisible('otherInput')) && (
            <div className="w-8 h-[1px] bg-border-subtle my-1"></div>
          )}
          
          {isVisible('note') && (
            <ToolButton icon={<StickyNote size={18} />} tooltip="Add Note" onClick={() => handleQuickAdd('note')} />
          )}
          {isVisible('imageLibrary') && (
            <ToolButton icon={<ImagePlus size={18} />} tooltip="Image Library" onClick={onOpenImageLibrary} />
          )}
          {isVisible('otherInput') && (
            <ToolButton icon={<FileText size={18} className="text-orange-400" />} tooltip="Add Other Input (File)" onClick={() => handleQuickAdd('input.file')} />
          )}
          
          {isVisible('run') && (
            <>
              <div className="w-8 h-[1px] bg-border-subtle my-1"></div>
              <button 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform my-1 shadow-[0_0_15px_rgba(198,241,53,0.3)]
                  ${isExecuting ? 'bg-text-muted cursor-not-allowed' : 'bg-accent-lime hover:scale-105 text-canvas'}
                `}
                onClick={() => useWorkflowStore.getState().executeWorkflow()}
                disabled={isExecuting}
                title="Run Workflow"
              >
                <Play size={20} fill="currentColor" className="ml-0.5" />
              </button>
            </>
          )}
          
          <div className="w-8 h-[1px] bg-border-subtle my-1"></div>
          
          {isVisible('undoRedo') && (
            <>
              <ToolButton icon={<Undo2 size={18} />} tooltip="Undo (Ctrl+Z)" onClick={() => {}} active={false} />
              <ToolButton icon={<Redo2 size={18} />} tooltip="Redo (Ctrl+Shift+Z)" onClick={() => {}} active={false} />
            </>
          )}
          {isVisible('reload') && (
            <ToolButton icon={<RefreshCw size={18} />} tooltip="Reload Models" onClick={() => window.location.reload()} />
          )}
          {isVisible('settings') && (
            <ToolButton icon={<Settings size={18} />} tooltip="Settings" onClick={onOpenSettings} />
          )}
        </div>
      </div>
      
      <AddNodePopover isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </>
  );
}

function ToolButton({ icon, active = false, tooltip = "", onClick }: { icon: React.ReactNode; active?: boolean; tooltip?: string; onClick?: () => void }) {
  return (
    <button 
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors group relative
        ${active ? 'bg-border-subtle text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}
      `}
      title={tooltip}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}
