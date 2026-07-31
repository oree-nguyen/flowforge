import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useWorkflowStore } from '../../store/workflowStore';
import { AudioLines, Sparkles, Loader2, Music, Mic2 } from 'lucide-react';
import { type NodeData } from '../../engine/canvasEngine';

export const AIAudioSepNode = memo(({ data, selected }: { data: NodeData['data'], id: string, selected: boolean }) => {
  const isPropertiesPanelOpen = useWorkflowStore(state => state.isPropertiesPanelOpen);
  const showBasicSettings = selected && !isPropertiesPanelOpen;

  // Render progress if generating
  const renderProgress = () => {
    if (!data.isGenerating) return null;
    
    // progress object from worker, e.g. data.progress { status, percent }
    const progressStatus = data.progress?.status || 'Processing...';
    const progressPercent = data.progress?.percent || 0;

    return (
      <div className="absolute -top-12 left-0 right-0 bg-surface-3 border border-border-subtle rounded-xl p-2 shadow-elev-floating z-50 animate-in slide-in-from-bottom-2 duration-200">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-accent-lime font-medium flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              {progressStatus}
            </span>
            <span className="text-text-muted font-mono">{progressPercent}%</span>
          </div>
          <div className="h-1 bg-surface-1 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-lime transition-all duration-300" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative group z-10 cursor-grab active:cursor-grabbing">
      {renderProgress()}
      
      <div className={`w-[320px] flex rounded-2xl overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${selected ? 'shadow-elev-node-selected' : 'border-border-defined shadow-elev-node'} bg-surface-2 border border-border-subtle`}>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-3 py-2 flex items-center gap-2 border-b border-border-hairline bg-surface-1">
            <div className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles size={12} />
            </div>
            <div className="flex-1 truncate text-[13px] font-semibold text-text-primary tracking-[-0.01em]">
              {data.label || 'HTDemucs Audio Sep'}
            </div>
          </div>

          {/* Body */}
          <div className="p-3 bg-surface-2 flex flex-col gap-3">
            {/* Input Port Area */}
            <div className="relative h-10 border border-dashed border-border-subtle rounded-xl bg-surface-1/50 flex flex-col items-center justify-center gap-0.5">
              <Handle 
                type="target" 
                position={Position.Left} 
                id="audio_in"
                className="!w-6 !h-6 !-left-3 !bg-panel !border-2 !border-surface-3 !rounded-full flex items-center justify-center !shadow-lg hover:!scale-110 transition-transform port-handle"
              >
                <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center" title="Audio In">
                  <AudioLines size={12} className="text-white" />
                </div>
              </Handle>
              <span className="text-[11px] font-medium text-text-muted">Audio Input</span>
            </div>
            
            {/* Display Model Info */}
            <div className="flex items-center justify-between bg-surface-1 rounded-lg px-2 py-1.5 border border-border-hairline">
               <span className="text-[10px] uppercase font-semibold tracking-wider text-text-muted">Model</span>
               <span className="text-xs font-mono text-text-primary">HTDemucs ONNX</span>
            </div>

            {/* Basic Settings Popover */}
            {showBasicSettings && (
              <div className="absolute top-0 -right-[260px] w-[240px] bg-panel backdrop-blur-panel border border-border-subtle rounded-xl p-3 shadow-elev-floating animate-node-popup z-20 flex flex-col gap-3">
                 <div className="text-xs font-semibold text-text-primary">Settings</div>
                 <div className="flex flex-col gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        useWorkflowStore.getState().setPropertiesPanelOpen(true);
                      }}
                      className="w-full text-xs font-medium bg-surface-3 hover:bg-surface-4 text-text-primary py-2 rounded-lg transition-colors border border-border-subtle"
                    >
                      Open Full Settings
                    </button>
                 </div>
              </div>
            )}
          </div>
          
          {/* Footer - Outputs */}
          <div className="flex flex-col bg-surface-1 border-t border-border-hairline">
             {/* Vocals */}
             <div className="px-3 py-2 flex items-center justify-between border-b border-border-hairline relative">
                <div className="flex items-center gap-1.5 text-text-muted">
                  <Mic2 size={12} />
                  <span className="text-xs font-medium">Vocals</span>
                </div>
                <Handle 
                  type="source" 
                  position={Position.Right} 
                  id="vocals_out"
                  className="!w-6 !h-6 !-right-3 !bg-panel !border-2 !border-surface-3 !rounded-full flex items-center justify-center !shadow-lg hover:!scale-110 transition-transform port-handle"
                >
                  <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center" title="Vocals Out">
                    <AudioLines size={12} className="text-white" />
                  </div>
                </Handle>
             </div>
             
             {/* Instrumental */}
             <div className="px-3 py-2 flex items-center justify-between relative">
                <div className="flex items-center gap-1.5 text-text-muted">
                  <Music size={12} />
                  <span className="text-xs font-medium">Instrumental</span>
                </div>
                <Handle 
                  type="source" 
                  position={Position.Right} 
                  id="instrumental_out"
                  className="!w-6 !h-6 !-right-3 !bg-panel !border-2 !border-surface-3 !rounded-full flex items-center justify-center !shadow-lg hover:!scale-110 transition-transform port-handle"
                >
                  <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center" title="Instrumental Out">
                    <AudioLines size={12} className="text-white" />
                  </div>
                </Handle>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
});
