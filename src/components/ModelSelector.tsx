import { useState, useRef, useEffect } from 'react';
import { getModelCatalog, type ModelModality } from '../store/modelCatalog';
import { useWorkflowStore } from '../store/workflowStore';
import { ChevronDown, Search, Sparkles, Check } from 'lucide-react';

interface ModelSelectorProps {
  modality: ModelModality;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  className?: string;
}

export function ModelSelector({ modality, value, onChange, className = '' }: ModelSelectorProps) {
  const fetchedModels = useWorkflowStore(state => state.fetchedModels);
  const models = getModelCatalog(modality, fetchedModels);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedModel = models.find(m => m.id === value) || {
    id: value,
    name: value ? value.split('/').pop() || value : 'Select Model',
    free: value.includes(':free'),
  };

  const filtered = models.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.id.toLowerCase().includes(search.toLowerCase())
  );

  const freeModels = filtered.filter(m => m.free);
  const paidModels = filtered.filter(m => !m.free);

  const handleSelect = (modelId: string) => {
    onChange({ target: { value: modelId } });
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border-subtle bg-[#141414] text-xs text-white cursor-pointer hover:border-white/30 transition-colors select-none ${className}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="truncate">{selectedModel.name}</span>
          {selectedModel.free && (
            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-surface-3 text-text-primary rounded shrink-0">
              FREE
            </span>
          )}
        </div>
        <ChevronDown size={14} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#1a1a1a] border border-border-subtle rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[320px]">
          {/* Search box */}
          <div className="p-2 border-b border-border-subtle flex items-center gap-2 bg-[#141414]">
            <Search size={12} className="text-text-muted shrink-0" />
            <input 
              type="text"
              placeholder="Search model..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-white outline-none w-full placeholder:text-text-muted"
              autoFocus
            />
          </div>

          {/* Model list */}
          <div className="overflow-y-auto p-1.5 flex flex-col gap-2 custom-scrollbar">
            {freeModels.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="text-[10px] font-semibold text-text-primary uppercase tracking-wider px-2 pt-1 flex items-center gap-1">
                  <Sparkles size={10} /> Free Models
                </div>
                {freeModels.map(m => (
                  <div
                    key={m.id}
                    onClick={() => handleSelect(m.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${m.id === value ? 'bg-surface-3 text-text-primary font-medium' : 'text-text-primary hover:bg-white/5'}`}
                  >
                    <span className="truncate">{m.name}</span>
                    {m.id === value && <Check size={12} className="shrink-0" />}
                  </div>
                ))}
              </div>
            )}

            {paidModels.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="text-[10px] font-semibold text-[#FF9800] uppercase tracking-wider px-2 pt-1">
                  Paid Models
                </div>
                {paidModels.map(m => (
                  <div
                    key={m.id}
                    onClick={() => handleSelect(m.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${m.id === value ? 'bg-surface-3 text-text-primary font-medium' : 'text-text-primary hover:bg-white/5'}`}
                  >
                    <span className="truncate">{m.name}</span>
                    {m.id === value && <Check size={12} className="shrink-0" />}
                  </div>
                ))}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="p-3 text-center text-xs text-text-muted">No models found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
