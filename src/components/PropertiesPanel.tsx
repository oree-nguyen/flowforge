import { useSyncExternalStore, useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { canvasEngine } from '../engine/canvasEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { TextGenProperties } from './properties/TextGenProperties';
import { ImageGenProperties } from './properties/ImageGenProperties';
import { VideoGenProperties } from './properties/VideoGenProperties';
import { DownloadProperties } from './properties/DownloadProperties';
import { FileProperties } from './properties/FileProperties';
import { X, Power, Bug } from 'lucide-react';

export function PropertiesPanel() {
  const { isPropertiesPanelOpen, setPropertiesPanelOpen } = useWorkflowStore();
  
  const selectedNodeId = useSyncExternalStore(
    cb => canvasEngine.subscribe(cb),
    () => canvasEngine.getSelectedNodeId()
  );

  const selectedNode = selectedNodeId ? canvasEngine.getNode(selectedNodeId) : null;
  const [activeTab, setActiveTab] = useState<'config' | 'results'>('config');

  const renderContent = () => {
    if (!selectedNode) return null;
    
    switch (selectedNode.type) {
      case 'ai.textGen':
        return <TextGenProperties nodeId={selectedNode.id} />;
      case 'ai.imageGen':
        return <ImageGenProperties nodeId={selectedNode.id} />;
      case 'ai.videoGen':
        return <VideoGenProperties nodeId={selectedNode.id} />;
      case 'util.download':
        return <DownloadProperties nodeId={selectedNode.id} />;
      case 'input.file':
        return <FileProperties nodeId={selectedNode.id} />;
      default:
        return (
          <div className="p-6 text-center text-text-muted text-sm flex flex-col gap-2 h-full items-center justify-center">
            <span className="text-2xl">⚙️</span>
            <span>No properties available for <code className="bg-white/10 px-1.5 py-0.5 rounded text-white">{selectedNode.type}</code></span>
          </div>
        );
    }
  };

  const handleClose = () => {
    setPropertiesPanelOpen(false);
  };

  return (
    <AnimatePresence>
      {(selectedNodeId && isPropertiesPanelOpen) && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-4 top-[72px] bottom-4 w-[380px] bg-panel/95 backdrop-blur-2xl border border-border-subtle rounded-2xl shadow-2xl z-20 flex flex-col text-text-primary font-sans overflow-hidden"
        >
          {/* Header Tabs */}
          <div className="flex items-center justify-between px-3 pt-2.5 border-b border-border-subtle bg-white/5">
            <div className="flex gap-4 px-2">
              <button 
                className={`py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'config' ? 'border-accent-lime text-text-primary font-semibold' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                onClick={() => setActiveTab('config')}
              >
                Config
              </button>
              <button 
                className={`py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'results' ? 'border-accent-lime text-text-primary font-semibold' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                onClick={() => setActiveTab('results')}
              >
                Results
              </button>
            </div>
            <div className="flex items-center gap-2 px-2 text-text-muted">
              <button className="hover:text-accent-lime transition-colors p-1 rounded-lg hover:bg-white/10" title="Power"><Power size={14} /></button>
              <button className="hover:text-danger transition-colors p-1 rounded-lg hover:bg-white/10" title="Debug"><Bug size={14} /></button>
              <button onClick={handleClose} className="hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-white/10"><X size={16} /></button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'config' ? renderContent() : (
              <div className="p-6 text-center text-xs text-text-muted">No execution results yet. Click Run on the toolbar to execute this workflow.</div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="p-4 border-t border-border-subtle bg-white/5 flex justify-between gap-3">
            <button 
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-border-subtle hover:bg-white/10 transition-colors"
            >
              Close
            </button>
            <button 
              onClick={handleClose}
              className="flex-1 px-4 py-2 rounded-xl text-xs font-medium bg-text-primary text-canvas hover:bg-text-primary/90 transition-colors font-semibold"
            >
              Save Node
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
