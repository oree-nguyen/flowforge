import { canvasEngine } from '../../engine/canvasEngine';
import { type NodeProps } from '../NodeTypes';

export function NoteNode({ id, data, selected }: NodeProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    canvasEngine.updateNodeData(id, { text: e.target.value });
  };

  return (
    <div className={`w-[260px] bg-amber-200/90 backdrop-blur rounded-2xl shadow-lg border ${selected ? 'border-amber-500' : 'border-transparent'} p-1 transition-all group`}>
      <textarea
        className="w-full h-32 bg-transparent text-amber-950 p-3 outline-none resize-none placeholder:text-amber-700/50 text-sm"
        placeholder="Type note here..."
        value={(data.text as string) || ''}
        onChange={handleChange}
        onPointerDown={e => e.stopPropagation()}
      />
    </div>
  );
}
