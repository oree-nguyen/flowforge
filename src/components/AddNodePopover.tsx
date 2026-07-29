import { useState, useEffect } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Type, Image as ImageIcon, Sparkles, StickyNote, Bot, Camera, Video, AlertCircle, Loader2, FileText, Headphones, Binary, Search, Mic, FileAudio, Languages } from 'lucide-react';
import { canvasEngine } from '../engine/canvasEngine';
import { fetchModels, groupModelsByProviderAndModality, type ExpandedModality } from '../services/openRouterApi';

export function AddNodePopover({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'node' | 'model'>('node');
  const [models, setModels] = useState<Record<string, Record<string, any[]>>>({});
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpandedModality | 'all'>('all');
  
  const apiKey = useWorkflowStore(state => state.apiKey);
  const setFetchedModels = useWorkflowStore(state => state.setFetchedModels);

  useEffect(() => {
    if (isOpen && activeTab === 'model' && apiKey) {
      loadModels();
    }
  }, [isOpen, activeTab, apiKey]);

  const loadModels = async () => {
    setIsLoadingModels(true);
    setModelError('');
    try {
      const data = await fetchModels(apiKey);
      setFetchedModels(data || []);
      setModels(groupModelsByProviderAndModality(data || []));
    } catch (err: any) {
      setModelError(err.message || 'Failed to load models');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleAddNode = (type: string, data: any) => {
    const vp = canvasEngine.getViewport();
    const x = (window.innerWidth / 2 - vp.x) / vp.zoom + (Math.random() - 0.5) * 100;
    const y = (window.innerHeight / 2 - vp.y) / vp.zoom + (Math.random() - 0.5) * 100;
    canvasEngine.addNode({
      id: `node_${Date.now()}`,
      type,
      position: { x, y },
      data,
    });
    onClose();
  };

  const nodeTypes = [
    { type: 'input.text', label: 'Input Text', icon: <Type size={18} />, color: 'bg-border-subtle' },
    { type: 'input.image', label: 'Input Image', icon: <ImageIcon size={18} />, color: 'bg-border-subtle' },
    { type: 'input.file', label: 'Other Input', icon: <FileText size={18} />, color: 'bg-orange-500/20 text-orange-400' },
    { type: 'note', label: 'Note', icon: <StickyNote size={18} />, color: 'bg-amber-500/20 text-amber-500' },
    { type: 'ai.textGen', label: 'AI Text Gen', icon: <Bot size={18} />, color: 'bg-[#9C27B0]/20 text-[#9C27B0]' },
    { type: 'ai.imageGen', label: 'AI Image Gen', icon: <Camera size={18} />, color: 'bg-[#FF9800]/20 text-[#FF9800]' },
    { type: 'ai.videoGen', label: 'AI Video Gen', icon: <Video size={18} />, color: 'bg-accent-lime/20 text-accent-lime' },
    { type: 'ai.audioGen', label: 'AI Audio Gen', icon: <Headphones size={18} />, color: 'bg-[#F59E0B]/20 text-[#F59E0B]' },
    { type: 'ai.transcription', label: 'AI Transcription', icon: <Mic size={18} />, color: 'bg-[#10B981]/20 text-[#10B981]' },
    { type: 'ai.dubSub', label: 'Lồng tiếng / Sub', icon: <Languages size={18} />, color: 'bg-indigo-500/20 text-indigo-400' },
  ];

  const categories: { key: ExpandedModality | 'all'; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <Sparkles size={12} /> },
    { key: 'text', label: 'Text', icon: <Type size={12} /> },
    { key: 'image', label: 'Image', icon: <ImageIcon size={12} /> },
    { key: 'video', label: 'Video', icon: <Video size={12} /> },
    { key: 'audio', label: 'Audio', icon: <Headphones size={12} /> },
    { key: 'embeddings', label: 'Embeddings', icon: <Binary size={12} /> },
    { key: 'rerank', label: 'Rerank', icon: <Search size={12} /> },
    { key: 'speech', label: 'Speech', icon: <Mic size={12} /> },
    { key: 'transcription', label: 'Transcription', icon: <FileAudio size={12} /> },
  ];

  const activeCategories = selectedCategory === 'all' 
    ? (['text', 'image', 'video', 'audio', 'embeddings', 'rerank', 'speech', 'transcription'] as ExpandedModality[])
    : [selectedCategory];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-4 right-4 top-16 sm:left-24 sm:right-auto sm:top-24 sm:w-[420px] max-h-[85vh] bg-panel backdrop-blur-panel border border-border-subtle rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
          >
            {/* Header Tabs */}
            <div className="flex border-b border-border-subtle p-2 gap-2 bg-white/5 shrink-0">
              <button 
                className={`flex-1 py-1.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'node' ? 'bg-border-subtle text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                onClick={() => setActiveTab('node')}
              >
                Nodes
              </button>
              <button 
                className={`flex-1 py-1.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'model' ? 'bg-border-subtle text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                onClick={() => setActiveTab('model')}
              >
                <Sparkles size={14} className={activeTab === 'model' ? 'text-accent-lime' : ''} />
                Add model AI
              </button>
            </div>

            {/* Content Area */}
            {activeTab === 'node' ? (
              <div className="p-4 overflow-y-auto custom-scrollbar flex-1 max-h-[500px]">
                <div className="grid grid-cols-2 gap-3">
                  {nodeTypes.map(nt => (
                    <button 
                      key={nt.type}
                      className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border-subtle bg-canvas hover:border-text-muted transition-colors text-text-primary"
                      onClick={() => handleAddNode(nt.type, {})}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${nt.color}`}>
                        {nt.icon}
                      </div>
                      <span className="text-sm font-medium">{nt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Search & Category Filter */}
                <div className="p-3 border-b border-border-subtle flex flex-col gap-2 shrink-0 bg-white/5">
                  <input 
                    type="text" 
                    placeholder="Search models by name or provider..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-canvas border border-border-subtle rounded-xl px-3 py-2 text-xs outline-none focus:border-accent-lime text-text-primary placeholder:text-text-muted"
                  />
                  
                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-1">
                    {categories.map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => setSelectedCategory(cat.key)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors ${
                          selectedCategory === cat.key
                            ? 'bg-accent-lime text-black font-semibold'
                            : 'bg-white/10 text-text-muted hover:text-white'
                        }`}
                      >
                        {cat.icon}
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable Model List */}
                <div className="p-3 overflow-y-auto custom-scrollbar flex-1 max-h-[460px]">
                  {!apiKey ? (
                    <div className="flex flex-col items-center justify-center text-center gap-3 p-8 text-text-muted">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                        <AlertCircle size={24} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">API Key Required</div>
                        <div className="text-xs text-text-muted mt-1">Please set your OpenRouter API key in Settings to load models.</div>
                      </div>
                    </div>
                  ) : isLoadingModels ? (
                    <div className="flex flex-col items-center justify-center text-text-muted gap-2 p-12">
                      <Loader2 size={24} className="animate-spin text-accent-lime" />
                      <span className="text-sm">Loading models from OpenRouter...</span>
                    </div>
                  ) : modelError ? (
                    <div className="flex flex-col items-center justify-center text-danger text-center gap-2 p-8">
                      <AlertCircle size={24} />
                      <span className="text-sm">{modelError}</span>
                      <button onClick={loadModels} className="text-xs bg-white/10 px-3 py-1.5 rounded-lg mt-2 text-text-primary">Retry</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 pb-4">
                      {activeCategories.map(modality => {
                        const providers = models[modality];
                        if (!providers || Object.keys(providers).length === 0) return null;
                        
                        let hasMatchingModels = false;

                        const providerBlocks = Object.entries(providers).map(([provider, providerModels]) => {
                          const filtered = providerModels.filter(m => 
                            m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.id.toLowerCase().includes(searchQuery.toLowerCase())
                          );
                          if (filtered.length === 0) return null;
                          hasMatchingModels = true;
                          
                          return (
                            <div key={provider} className="flex flex-col gap-2 mb-2">
                              {filtered.map(m => (
                                <button 
                                  key={m.id}
                                  className="flex flex-col p-3 rounded-xl border border-border-subtle bg-canvas hover:border-accent-lime hover:bg-white/5 transition-colors text-left gap-1.5"
                                  onClick={() => handleAddNode(
                                    modality === 'image' ? 'ai.imageGen' : modality === 'video' ? 'ai.videoGen' : 'ai.textGen', 
                                    { model: m.id }
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-text-primary text-xs truncate pr-2">{m.name}</span>
                                    <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-text-muted shrink-0 font-mono">{provider}</span>
                                  </div>
                                  <div className="font-mono text-[10px] text-text-muted flex justify-between items-center">
                                    <span>
                                      {m.pricing?.prompt ? `$${(parseFloat(m.pricing.prompt) * 1000000).toFixed(2)}/1M in · $${(parseFloat(m.pricing.completion || '0') * 1000000).toFixed(2)}/1M out` : 'Free/Included'}
                                    </span>
                                    {m.id.includes(':free') && (
                                      <span className="text-accent-lime font-semibold">FREE</span>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          );
                        });

                        if (!hasMatchingModels) return null;

                        return (
                          <div key={modality} className="flex flex-col">
                            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 sticky top-0 bg-panel/95 py-1 z-10 backdrop-blur border-b border-border-subtle/40 flex items-center justify-between">
                              <span>{modality} Models</span>
                            </div>
                            {providerBlocks}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
