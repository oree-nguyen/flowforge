import { useRef, useState, useCallback } from 'react';
import { canvasEngine } from '../../engine/canvasEngine';
import { type NodeProps } from '../NodeTypes';
import { FileText, X, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { extractFileContent, ACCEPTED_FILE_TYPES, formatBytes, type ExtractedFile } from '../../services/fileExtractor';

export function InputFileNode({ id, data, selected, onConnectStart }: NodeProps) {
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
    <div className="relative group">
      {/* Node Label above node */}
      <div className="absolute -top-6 left-0 label-micro text-text-primary flex items-center gap-1.5">
        <FileText size={12} className="text-[#FB923C]" /> File Input
      </div>

      <div className={`w-[260px] flex rounded-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${selected ? 'border-accent-lime shadow-elev-node-selected' : 'border-defined shadow-elev-node'}`}>
        <div className="w-[3px] bg-[#FB923C] shrink-0 rounded-l-xl" />
        
        <div className="flex-1 flex flex-col bg-surface-1 rounded-r-xl overflow-hidden">
          <div className="px-3 h-8 bg-surface-2 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="title-node text-text-primary truncate">
                Input File
              </span>
            </div>
            <span className="label-micro px-1.5 py-0.5 bg-[#FB923C]/12 text-[#FB923C] rounded shrink-0">FILE</span>
          </div>

          <div className="p-3 flex flex-col gap-3">
        {isExtracting ? (
          <div className="h-28 bg-surface-0 border border-dashed border-hairline rounded-md flex flex-col items-center justify-center gap-2">
            <Loader2 size={20} className="text-[#FB923C] animate-spin" />
            <span className="label-small text-text-muted">Extracting content...</span>
          </div>
        ) : storedFile ? (
          /* File loaded state */
          <div className="bg-surface-0 border border-hairline rounded-md p-3 relative group/file">
            <button
              onClick={removeFile}
              onPointerDown={e => e.stopPropagation()}
              className="absolute top-2 right-2 opacity-0 group-hover/file:opacity-100 bg-surface-1/80 p-1 rounded-lg hover:bg-state-error transition-all shadow-elev-floating"
            >
              <X size={12} />
            </button>

            {/* File info */}
            <div className="flex items-start gap-2 mb-2 pr-5">
              <FileText size={18} className={`shrink-0 mt-0.5 ${getFileColor(storedFile.name)}`} />
              <div className="min-w-0">
                <p className="label-small font-medium text-text-primary truncate">{storedFile.name}</p>
                <p className="label-micro text-text-muted opacity-80">{formatBytes(storedFile.sizeBytes)}</p>
              </div>
            </div>

            {/* Text preview */}
            <div className="bg-surface-3 rounded p-2 body text-[10px] text-text-muted opacity-80 max-h-16 overflow-hidden relative">
              <p className="line-clamp-4 whitespace-pre-wrap">{storedFile.text.slice(0, 200)}</p>
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-surface-3 to-transparent" />
            </div>

            {/* Status */}
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle2 size={10} className="text-state-success" />
              <span className="label-micro text-state-success">
                {storedFile.text.split(' ').length.toLocaleString()} words extracted
              </span>
            </div>
          </div>
        ) : (
          /* Drop zone */
          <div
            className={`h-28 rounded-md border border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
              isDragging
                ? 'border-[#FB923C] bg-[#FB923C]/10'
                : 'border-hairline bg-surface-0 hover:border-text-muted'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onPointerDown={e => e.stopPropagation()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload size={20} className={isDragging ? 'text-[#FB923C]' : 'text-text-muted'} />
            <div className="text-center px-3">
              <p className="label-small font-medium text-text-muted">Click or drop file</p>
              <p className="label-micro text-text-muted opacity-60 mt-0.5">.txt .md .pdf .docx .csv .json</p>
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
        </div>
      </div>

      {/* Single Output Port Icon (Right) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-2 pl-2.5 z-20">
        <div 
          className="port-handle w-8 h-8 rounded-full border border-[#FB923C]/60 bg-panel flex items-center justify-center text-[#FB923C] cursor-crosshair shadow-md"
          title="File Output (out)"
          data-target={`${id}:out`}
          data-portid="out"
          onPointerDown={(e) => {
            e.stopPropagation();
            onConnectStart?.(e, id, 'out');
          }}
        >
          <FileText size={14} />
        </div>
      </div>
    </div>
  );
}
