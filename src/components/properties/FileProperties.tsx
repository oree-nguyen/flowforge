import { useSyncExternalStore } from 'react';
import { canvasEngine } from '../../engine/canvasEngine';
import { FileText, Download, Trash2, FileCheck } from 'lucide-react';
import { formatBytes, type ExtractedFile } from '../../services/fileExtractor';

export function FileProperties({ nodeId }: { nodeId: string }) {
  const node = useSyncExternalStore(
    cb => canvasEngine.subscribe(cb),
    () => canvasEngine.getNode(nodeId)
  );

  if (!node) return null;
  const data = node.data;
  const file = data.extractedFile as ExtractedFile | undefined;

  const handleChange = (key: string, value: any) => {
    canvasEngine.updateNodeData(nodeId, { [key]: value });
  };

  const handleDownloadText = () => {
    if (!file) return;
    const blob = new Blob([file.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_${file.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemoveFile = () => {
    canvasEngine.updateNodeData(nodeId, { extractedFile: undefined });
  };

  return (
    <div className="flex flex-col p-4 gap-5">
      {/* Node Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-orange-400/20 text-orange-400">
           <FileText size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">Other Input (File)</span>
          <span className="text-[10px] text-text-muted">Extracts text/data for LLMs</span>
        </div>
      </div>

      {/* Node Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-muted flex items-center gap-1">
          <span className="opacity-70">🏷️</span> Node Name
        </label>
        <input 
          className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-lime"
          placeholder="File Input Node"
          value={(data.nodeName as string) || ''}
          onChange={(e) => handleChange('nodeName', e.target.value)}
        />
      </div>

      {/* File Details */}
      {file ? (
        <div className="flex flex-col gap-3 bg-canvas/50 border border-border-subtle rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <FileCheck size={18} className="text-orange-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{file.name}</p>
                <p className="text-[10px] text-text-muted">{formatBytes(file.sizeBytes)} · {file.mimeType}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Extracted Content Preview</span>
            <div className="bg-black/40 rounded-lg p-2.5 text-xs text-text-muted font-mono max-h-36 overflow-y-auto custom-scrollbar whitespace-pre-wrap select-text">
              {file.text}
            </div>
          </div>

          <div className="flex gap-2 mt-1">
            <button 
              onClick={handleDownloadText}
              className="flex-1 py-1.5 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download size={12} /> Download Text
            </button>
            <button 
              onClick={handleRemoveFile}
              className="py-1.5 px-3 bg-danger/10 hover:bg-danger/20 rounded-lg text-xs text-danger flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-text-muted text-xs border border-dashed border-border-subtle rounded-xl flex flex-col items-center gap-2">
          <FileText size={24} className="text-text-muted/40" />
          <span>No file uploaded yet. Drop a file (.pdf, .docx, .md, .txt) into the canvas node.</span>
        </div>
      )}
    </div>
  );
}
