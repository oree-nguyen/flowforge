import { useRef, useState, useCallback } from 'react';
import { canvasEngine } from '../../engine/canvasEngine';
import { type NodeProps } from '../NodeTypes';
import { FileText, X, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { extractFileContent, ACCEPTED_FILE_TYPES, formatBytes, type ExtractedFile } from '../../services/fileExtractor';

export function InputFileNode({ id, data, selected }: NodeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const storedFile = data.extractedFile as ExtractedFile | undefined;

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsExtracting(true);
    try {
      const extracted = await extractFileContent(file);
      canvasEngine.updateNodeData(id, { extractedFile: extracted });
    } catch (err: any) {
      setError(err.message || 'Failed to extract file content');
    } finally {
      setIsExtracting(false);
    }
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const removeFile = () => {
    canvasEngine.updateNodeData(id, { extractedFile: undefined });
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // File type icon color based on extension
  const getFileColor = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const colors: Record<string, string> = {
      pdf: 'text-red-400',
      docx: 'text-blue-400',
      doc: 'text-blue-400',
      md: 'text-purple-400',
      txt: 'text-gray-400',
      csv: 'text-green-400',
      json: 'text-yellow-400',
    };
    return colors[ext || ''] || 'text-text-muted';
  };

  return (
    <div
      className={`w-[260px] bg-node rounded-2xl shadow-lg border transition-all ${
        selected ? 'border-text-primary shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-border-subtle'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-white/5 border-b border-border-subtle flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-orange-400" />
        <FileText size={14} className="text-orange-400" />
        <span className="text-sm font-medium text-text-primary">Other Input</span>
        <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 bg-orange-400/20 rounded text-orange-400">FILE</span>
      </div>

      {/* Body */}
      <div className="p-4">
        {isExtracting ? (
          <div className="h-28 bg-canvas border border-dashed border-border-subtle rounded-xl flex flex-col items-center justify-center gap-2">
            <Loader2 size={20} className="text-orange-400 animate-spin" />
            <span className="text-xs text-text-muted">Extracting content...</span>
          </div>
        ) : storedFile ? (
          /* File loaded state */
          <div className="bg-canvas border border-border-subtle rounded-xl p-3 relative group">
            <button
              onClick={removeFile}
              onPointerDown={e => e.stopPropagation()}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-panel/80 p-1 rounded-lg hover:bg-red-500 transition-all"
            >
              <X size={12} />
            </button>

            {/* File info */}
            <div className="flex items-start gap-2 mb-2 pr-5">
              <FileText size={18} className={`shrink-0 mt-0.5 ${getFileColor(storedFile.name)}`} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{storedFile.name}</p>
                <p className="text-[10px] text-text-muted">{formatBytes(storedFile.sizeBytes)}</p>
              </div>
            </div>

            {/* Text preview */}
            <div className="bg-black/30 rounded-lg p-2 text-[10px] text-text-muted font-mono max-h-16 overflow-hidden relative">
              <p className="line-clamp-4 whitespace-pre-wrap">{storedFile.text.slice(0, 200)}</p>
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            {/* Status */}
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle2 size={10} className="text-accent-lime" />
              <span className="text-[10px] text-accent-lime">
                {storedFile.text.split(' ').length.toLocaleString()} words extracted
              </span>
            </div>
          </div>
        ) : (
          /* Drop zone */
          <div
            className={`h-28 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
              isDragging
                ? 'border-orange-400 bg-orange-400/10'
                : 'border-border-subtle bg-canvas hover:border-text-muted'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onPointerDown={e => e.stopPropagation()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload size={20} className={isDragging ? 'text-orange-400' : 'text-text-muted'} />
            <div className="text-center px-3">
              <p className="text-xs font-medium text-text-muted">Click or drop file</p>
              <p className="text-[10px] text-text-muted/60 mt-0.5">.txt .md .pdf .docx .csv .json</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-2 flex items-start gap-1.5 text-red-400 bg-red-400/10 rounded-lg px-2 py-1.5">
            <AlertCircle size={12} className="shrink-0 mt-0.5" />
            <p className="text-[10px]">{error}</p>
          </div>
        )}

        <input
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {/* Single Output Port Icon (Right) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-2 pl-2.5 z-20">
        <div 
          className="port-handle w-8 h-8 rounded-full border border-orange-400/60 bg-panel flex items-center justify-center text-orange-400 cursor-crosshair shadow-md"
          title="File Output (out)"
          data-target={`${id}:out`}
          data-portid="out"
        >
          <FileText size={14} />
        </div>
      </div>
    </div>
  );
}
