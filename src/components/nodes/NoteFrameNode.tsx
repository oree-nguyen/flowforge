import { canvasEngine } from '../../engine/canvasEngine';
import { type NodeProps } from '../NodeTypes';

export function NoteFrameNode({ id, data, selected }: NodeProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    canvasEngine.updateNodeData(id, { label: e.target.value });
  };

  return (
    <div
      className={`bg-border-subtle/5 border-2 ${selected ? 'border-text-primary/50' : 'border-border-subtle/40'} rounded-3xl transition-all relative flex flex-col`}
      style={{ width: 400, height: 300 }}
    >
      <div className="absolute top-0 left-0 w-full p-3 cursor-grab active:cursor-grabbing">
        <input
          className="bg-transparent border-none outline-none text-text-muted text-sm font-medium w-full placeholder:text-text-muted/50"
          placeholder="Frame label..."
          value={(data.label as string) || ''}
          onChange={handleChange}
          onPointerDown={e => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
