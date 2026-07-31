import { useState } from 'react';
import { X, Database, RotateCcw, AlertTriangle } from 'lucide-react';
import { canvasEngine } from '../engine/canvasEngine';
import { useWorkflowStore } from '../store/workflowStore';

interface RawWorkflow {
  id: string;
  name: string;
  updatedAt: string;
  canvasData: {
    nodes: any[];
    edges: any[];
    viewport?: any;
  };
}

interface RecoveryModalProps {
  onClose: () => void;
}

export function RecoveryModal({ onClose }: RecoveryModalProps) {
  const [status, setStatus] = useState<string>('');
  const [recovered, setRecovered] = useState<string | null>(null);

  // Read ALL raw localStorage keys that might contain flowforge data
  const rawData = (() => {
    try {
      const raw = localStorage.getItem('flowforge-workflow-storage');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })();

  const allWorkflows: RawWorkflow[] = rawData?.state?.savedWorkflows || [];
  const currentWorkflowId: string = rawData?.state?.currentWorkflowId || '';

  const handleRestore = (wf: RawWorkflow) => {
    try {
      if (!wf.canvasData?.nodes?.length) {
        setStatus(`⚠️ Workflow "${wf.name}" không có node nào để khôi phục.`);
        return;
      }

      // Restore canvas engine
      canvasEngine.deserialize({
        nodes: wf.canvasData.nodes,
        edges: wf.canvasData.edges || [],
        viewport: wf.canvasData.viewport || { x: 0, y: 0, zoom: 1 },
      });

      // Update store to match
      const store = useWorkflowStore.getState();
      store.loadWorkflow(wf.id);

      setRecovered(wf.name);
      setStatus(`✅ Đã khôi phục "${wf.name}" — ${wf.canvasData.nodes.length} nodes, ${wf.canvasData.edges?.length || 0} edges`);
    } catch (e: any) {
      setStatus(`❌ Lỗi khi khôi phục: ${e.message}`);
    }
  };

  const handleExportJSON = (wf: RawWorkflow) => {
    const blob = new Blob([JSON.stringify(wf, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wf.name.replace(/\s+/g, '_')}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-panel border border-border-subtle rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-white/5">
          <div className="flex items-center gap-3">
            <Database size={20} className="text-accent-lime" />
            <div>
              <h2 className="text-base font-semibold text-text-primary">Khôi phục Workflow</h2>
              <p className="text-xs text-text-muted">Đọc trực tiếp từ localStorage — dữ liệu gốc chưa bị xóa</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-border-subtle rounded-xl text-text-muted hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Raw data info */}
          <div className="bg-canvas rounded-xl border border-border-subtle p-4 text-xs font-mono text-text-muted space-y-1">
            <div>🔑 Storage key: <span className="text-accent-lime">flowforge-workflow-storage</span></div>
            <div>📦 Raw data found: <span className={rawData ? 'text-green-400' : 'text-red-400'}>{rawData ? 'YES' : 'NO — localStorage trống!'}</span></div>
            {rawData && (
              <>
                <div>📁 Workflows: <span className="text-text-primary">{allWorkflows.length} found</span></div>
                <div>🎯 Current ID: <span className="text-text-primary">{currentWorkflowId}</span></div>
              </>
            )}
          </div>

          {!rawData && (
            <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-300 text-sm">
              <AlertTriangle size={16} className="shrink-0" />
              <div>
                <div className="font-medium">Không tìm thấy dữ liệu trong localStorage.</div>
                <div className="text-xs mt-1 text-orange-300/70">Có thể browser đã clear storage, hoặc dữ liệu chưa từng được lưu.</div>
              </div>
            </div>
          )}

          {/* Workflow list */}
          {allWorkflows.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Tất cả Workflows trong localStorage:</h3>
              {allWorkflows.map(wf => {
                const nodeCount = wf.canvasData?.nodes?.length || 0;
                const edgeCount = wf.canvasData?.edges?.length || 0;
                const isCurrent = wf.id === currentWorkflowId;
                const isESDM = wf.name?.toLowerCase().includes('esdm');
                return (
                  <div
                    key={wf.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isESDM
                        ? 'border-accent-lime/50 bg-accent-lime/5'
                        : isCurrent
                        ? 'border-blue-500/40 bg-blue-500/5'
                        : 'border-border-subtle bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary text-sm truncate">{wf.name || '(Không tên)'}</span>
                          {isESDM && <span className="shrink-0 text-[9px] bg-accent-lime text-black px-1.5 py-0.5 rounded-full font-bold">ESDM</span>}
                          {isCurrent && <span className="shrink-0 text-[9px] border border-blue-400 text-blue-400 px-1.5 py-0.5 rounded-full">current</span>}
                        </div>
                        <div className="text-xs text-text-muted mt-1 space-x-3">
                          <span>🔷 {nodeCount} nodes</span>
                          <span>🔗 {edgeCount} edges</span>
                          <span>🕒 {wf.updatedAt ? new Date(wf.updatedAt).toLocaleString('vi-VN') : 'unknown'}</span>
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5 font-mono opacity-60 truncate">id: {wf.id}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleExportJSON(wf)}
                          className="px-2.5 py-1.5 text-xs border border-border-subtle hover:border-text-muted text-text-muted hover:text-text-primary rounded-lg transition-colors"
                          title="Export JSON backup"
                        >
                          JSON
                        </button>
                        <button
                          onClick={() => handleRestore(wf)}
                          disabled={nodeCount === 0}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                            nodeCount === 0
                              ? 'bg-border-subtle text-text-muted cursor-not-allowed'
                              : 'bg-accent-lime text-black hover:bg-accent-lime/80'
                          }`}
                        >
                          <RotateCcw size={12} />
                          Restore
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Status message */}
          {status && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
              status.startsWith('✅')
                ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                : status.startsWith('⚠️')
                ? 'bg-orange-500/10 border border-orange-500/30 text-orange-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300'
            }`}>
              {status}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-white/5 flex justify-between items-center">
          <p className="text-xs text-text-muted">
            💡 Sau khi Restore, nhấn <kbd className="bg-border-subtle px-1.5 py-0.5 rounded text-text-primary">SAVE</kbd> để lưu lại vĩnh viễn.
          </p>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              recovered
                ? 'bg-accent-lime text-black hover:bg-accent-lime/80'
                : 'bg-border-subtle text-text-primary hover:bg-white/10'
            }`}
          >
            {recovered ? `✅ Đóng (đã khôi phục '${recovered}')` : 'Đóng'}
          </button>
        </div>
      </div>
    </div>
  );
}
