import React from 'react';
import { getModelCatalog, type ModelModality } from '../store/modelCatalog';
import { useWorkflowStore } from '../store/workflowStore';

interface ModelSelectorProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  modality: ModelModality;
}

export function ModelSelector({ modality, value, onChange, className = '', ...props }: ModelSelectorProps) {
  const fetchedModels = useWorkflowStore(state => state.fetchedModels);
  const models = getModelCatalog(modality, fetchedModels);

  // Ensure current value is included in list
  const currentValStr = (value as string) || '';
  const exists = models.some(m => m.id === currentValStr);

  const freeModels = models.filter(m => m.free);
  const paidModels = models.filter(m => !m.free);

  return (
    <select 
      value={value} 
      onChange={onChange}
      className={className}
      {...props}
    >
      {!exists && currentValStr && (
        <option value={currentValStr} className="bg-[#1a1a1a] text-white">
          {currentValStr}
        </option>
      )}
      {freeModels.length > 0 && (
        <optgroup label="🆓 Free / Low Cost" className="bg-[#1a1a1a] text-accent-lime font-semibold">
          {freeModels.map(m => (
            <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-white font-normal">
              {m.name}
            </option>
          ))}
        </optgroup>
      )}
      {paidModels.length > 0 && (
        <optgroup label="💳 Paid" className="bg-[#1a1a1a] text-[#FF9800] font-semibold mt-2">
          {paidModels.map(m => (
            <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-white font-normal">
              {m.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
