import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Play, Settings, Copy, Plus, Trash2 } from 'lucide-react';
import { canvasEngine, type NodeData } from '../../engine/canvasEngine';
import { useCanvasEngine } from '../../engine/useCanvasEngine';
import { useWorkflowStore } from '../../store/workflowStore';
import { toast } from '../../store/toastStore';
import { useTouchGestures } from '../../hooks/useTouchGestures';

// Node type → component mapping
import { InputTextNode } from '../nodes/InputTextNode';
import { InputImageNode } from '../nodes/InputImageNode';
import { AITextGenNode } from '../nodes/AITextGenNode';
import { AIImageGenNode } from '../nodes/AIImageGenNode';
import { AIVideoGenNode } from '../nodes/AIVideoGenNode';
import { AIAudioGenNode } from '../nodes/AIAudioGenNode';
import { AITranscriptionNode } from '../nodes/AITranscriptionNode';
import { AIDubSubNode } from '../nodes/AIDubSubNode';
import { VideoEditorNode } from '../nodes/VideoEditorNode';
import { NoteNode } from '../nodes/NoteNode';
import { UtilDownloadNode } from '../nodes/UtilDownloadNode';
import { InputFileNode } from '../nodes/InputFileNode';

const NODE_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'input.text': InputTextNode,
  'input.image': InputImageNode,
  'ai.textGen': AITextGenNode,
  'ai.imageGen': AIImageGenNode,
  'ai.videoGen': AIVideoGenNode,
  'ai.audioGen': AIAudioGenNode,
  'ai.transcription': AITranscriptionNode,
  'ai.dubSub': AIDubSubNode,
  'util.videoEditor': VideoEditorNode,
  'note': NoteNode,
  'util.download': UtilDownloadNode,
  'input.file': InputFileNode,
};

// --- Connection drag state ---
type ConnDrag = { sourceId: string; sourceHandle: 'out'; x: number; y: number } | null;

// --- Single node wrapper ---
function NodeWrapper({
  node,
  selected,
  onDragStart,
  onConnectStart,
  onDisconnectStart,
}: {
  node: NodeData;
  selected: boolean;
  onDragStart: (e: React.PointerEvent, id: string) => void;
  onConnectStart: (e: React.PointerEvent, id: string, handle: 'out') => void;
  onDisconnectStart: (e: React.PointerEvent, id: string, handle?: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const NodeComp = NODE_COMPONENTS[node.type];
  if (!NodeComp) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    // Don't drag when interacting with inputs/buttons inside the node
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    if (['input', 'textarea', 'select', 'button', 'label'].includes(tag)) return;
    if ((e.target as HTMLElement).closest('button, input, textarea, select')) return;
    onDragStart(e, node.id);
  };

  useEffect(() => {
    if (wrapRef.current) {
      const width = wrapRef.current.offsetWidth;
      const height = wrapRef.current.offsetHeight;
      canvasEngine.setNodeSize(node.id, width, height);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, node.type, node.data]);

  return (
    <div
      ref={wrapRef}
      data-nodeid={node.id}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        cursor: 'grab',
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        e.stopPropagation();
        canvasEngine.select(node.id, e.ctrlKey || e.metaKey);
        if (useWorkflowStore.getState().autoOpenProperties) {
          useWorkflowStore.getState().setPropertiesPanelOpen(true);
        }
      }}
    >
          {/* Render default handle dots ONLY for generic non-custom nodes */}
      {!['ai.textGen', 'ai.imageGen', 'ai.videoGen', 'ai.audioGen', 'util.videoEditor', 'ai.dubSub', 'input.text', 'input.image', 'input.file', 'util.download'].includes(node.type) && (
        <>
          {/* Default Output port handle */}
          <div
            className="port-handle"
            style={{
              position: 'absolute',
              right: -16,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'crosshair',
              zIndex: 10,
              touchAction: 'none',
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onConnectStart(e, node.id, 'out');
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'var(--accent-lime)',
                border: '2px solid var(--canvas)',
                boxShadow: '0 0 8px rgba(198,241,53,0.6)',
              }}
            />
          </div>
          {/* Default Input port handle */}
          <div
            className="port-handle"
            style={{
              position: 'absolute',
              left: -16,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'crosshair',
              zIndex: 10,
            }}
            data-target={node.id}
            onPointerDown={(e) => {
              e.stopPropagation();
              onDisconnectStart(e, node.id, undefined);
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(255,255,255,0.3)',
              }}
            />
          </div>
        </>
      )}
      <NodeComp
        id={node.id}
        data={node.data}
        selected={selected}
        onConnectStart={onConnectStart}
        onDisconnectStart={onDisconnectStart}
      />
    </div>
  );
}

// --- Helper for Handle Positions ---
function getHandlePosition(node: NodeData, size: { width: number, height: number }, type: 'in' | 'out', handleId?: string) {
  const nodeEl = document.querySelector(`[data-nodeid="${node.id}"]`) as HTMLElement;
  
  if (nodeEl) {
    const targetQuery = type === 'out'
      ? (handleId ? `[data-target="${node.id}:${handleId}"]` : `[data-target="${node.id}:out"]`)
      : (handleId ? `[data-target="${node.id}:${handleId}"]` : `[data-target^="${node.id}"]`);
    
    const portEl = (nodeEl.querySelector(targetQuery) || document.querySelector(targetQuery)) as HTMLElement;
    if (portEl) {
      let dx = 0;
      let dy = 0;
      let curr: HTMLElement | null = portEl;
      while (curr && curr !== nodeEl) {
        dx += curr.offsetLeft;
        dy += curr.offsetTop;
        curr = curr.offsetParent as HTMLElement | null;
      }
      dx += portEl.offsetWidth / 2;
      dy += portEl.offsetHeight / 2;
      return { x: node.position.x + dx, y: node.position.y + dy };
    }
  }

  // Fallback
  if (type === 'out') {
    return { x: node.position.x + size.width, y: node.position.y + size.height / 2 };
  }
  return { x: node.position.x, y: node.position.y + size.height / 2 };
}

// --- Node Floating Toolbar ---
function NodeFloatingToolbar({ nodeId }: { nodeId: string }) {
  const node = canvasEngine.getNode(nodeId);
  const size = canvasEngine.getNodeSize(nodeId);
  const { viewport } = useCanvasEngine();
  
  if (!node) return null;

  // Calculate position in screen space
  const left = node.position.x * viewport.zoom + viewport.x + (size.width * viewport.zoom) / 2;
  const top = node.position.y * viewport.zoom + viewport.y - 12; // 12px above the node

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        transform: 'translate(-50%, -100%)',
        zIndex: 50,
      }}
      className="bg-panel/95 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-xl flex items-center p-1.5 gap-1"
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      <button 
        className="p-2 text-text-muted hover:text-text-primary hover:bg-white/10 rounded-xl transition-colors" 
        title="Run node"
        onClick={() => useWorkflowStore.getState().executeWorkflow()}
      >
        <Play size={16} />
      </button>
      <button 
        className="p-2 text-text-muted hover:text-text-primary hover:bg-white/10 rounded-xl transition-colors" 
        title="Settings"
        onClick={() => useWorkflowStore.getState().setPropertiesPanelOpen(true)}
      >
        <Settings size={16} />
      </button>
      <button className="p-2 text-text-muted hover:text-text-primary hover:bg-white/10 rounded-xl transition-colors" title="Duplicate" onClick={() => canvasEngine.duplicateNode(nodeId)}>
        <Copy size={16} />
      </button>
      <div className="w-[1px] h-5 bg-border-subtle mx-1"></div>
      <button className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors" title="Delete" onClick={() => canvasEngine.removeNode(nodeId)}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

// --- Edge Floating Toolbar ---
function EdgeFloatingToolbar({ edgeId }: { edgeId: string }) {
  const edge = canvasEngine.getEdges().find(e => e.id === edgeId);
  const { viewport } = useCanvasEngine();
  
  if (!edge) return null;
  
  // Calculate approximate center of the edge
  const srcNode = canvasEngine.getNode(edge.source);
  const tgtNode = canvasEngine.getNode(edge.target);
  if (!srcNode || !tgtNode) return null;

  const srcPos = getHandlePosition(srcNode, canvasEngine.getNodeSize(edge.source), 'out');
  const tgtPos = getHandlePosition(tgtNode, canvasEngine.getNodeSize(edge.target), 'in', edge.targetHandle);

  const cx = (srcPos.x + tgtPos.x) / 2;
  const cy = (srcPos.y + tgtPos.y) / 2;

  const left = cx * viewport.zoom + viewport.x;
  const top = cy * viewport.zoom + viewport.y - 20;

  return (
    <div
      style={{ position: 'absolute', left, top, transform: 'translate(-50%, -100%)', zIndex: 50 }}
      className="bg-panel/95 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-xl flex items-center p-1.5 gap-1"
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      <button className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors" title="Delete" onClick={() => canvasEngine.removeEdge(edgeId)}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

// --- Main CanvasRenderer ---
export function CanvasRenderer() {
  const { nodes, edges, viewport, selectedIds } = useCanvasEngine();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Hook touch gestures for pinch zoom & 1-finger pan
  useTouchGestures(canvasRef, viewport.zoom);

  // Panning state
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });

  // Node drag state
  const dragId = useRef<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const nodeStartPos = useRef({ x: 0, y: 0 });

  // Connection drag
  const [connDrag, setConnDrag] = useState<ConnDrag>(null);
  const connDragRef = useRef<ConnDrag>(null);
  const connDragPos = useRef({ x: 0, y: 0 });
  const [, setConnDragRender] = useState(0); // force re-render for temp line
  const snappedPortRef = useRef<{ targetId: string; targetHandle: string; x: number; y: number; el: HTMLElement } | null>(null);

  // Context menu
  const [menu, setMenu] = useState<{ x: number; y: number; nodeId: string | null; edgeId: string | null } | null>(null);

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    canvasEngine.zoomTo(viewport.zoom * factor, cx, cy);
  }, [viewport.zoom]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // --- Pointer events for pan + drag + connection ---
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && !dragId.current && !connDrag)) {
      // Pan with middle mouse or left on empty space
      const nodeEl = (e.target as HTMLElement).closest('[data-nodeid]');
      if (!nodeEl || e.button === 1) {
        isPanning.current = true;
        lastPan.current = { x: e.clientX, y: e.clientY };
        canvasEngine.clearSelection();
        useWorkflowStore.getState().setPropertiesPanelOpen(false);
        setMenu(null);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    }
  };

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      lastPan.current = { x: e.clientX, y: e.clientY };
      canvasEngine.panBy(dx, dy);
    }

    if (dragId.current) {
      const dx = (e.clientX - dragStart.current.x) / viewport.zoom;
      const dy = (e.clientY - dragStart.current.y) / viewport.zoom;
      canvasEngine.updateNode(dragId.current, {
        position: {
          x: nodeStartPos.current.x + dx,
          y: nodeStartPos.current.y + dy,
        }
      });
    }

    if (connDragRef.current) {
      const srcId = connDragRef.current.sourceId;
      const sourceNode = canvasEngine.getNode(srcId);
      
      // Query all port elements with data-target
      const allPortEls = document.querySelectorAll('[data-target]');
      let closestPort: { targetId: string; targetHandle: string; x: number; y: number; dist: number; el: HTMLElement } | null = null;
      let minDist = 40; // 40px magnetic snap radius in screen space

      allPortEls.forEach(el => {
        const targetData = el.getAttribute('data-target');
        if (!targetData) return;
        const [targetId, targetHandle] = targetData.split(':');
        if (!targetId || targetId === srcId) return;

        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(cx - e.clientX, cy - e.clientY);

        if (dist < minDist) {
          const tgtHandle = targetHandle || 'in';
          let isValid = true;
          if (sourceNode?.type === 'input.text' && tgtHandle === 'image') isValid = false;
          if (sourceNode?.type === 'input.image' && tgtHandle === 'text') isValid = false;
          if (sourceNode?.type === 'ai.audioGen' && tgtHandle === 'image') isValid = false;
          if ((sourceNode?.type === 'input.image' || sourceNode?.type === 'ai.imageGen') && tgtHandle === 'file') isValid = false;

          if (isValid) {
            minDist = dist;
            closestPort = { targetId, targetHandle: tgtHandle, x: cx, y: cy, dist, el: el as HTMLElement };
          }
        }
      });

      // Clear previous snap highlights
      document.querySelectorAll('.port-snapped').forEach(el => el.classList.remove('port-snapped'));

      if (closestPort) {
        const found = closestPort as { targetId: string; targetHandle: string; x: number; y: number; dist: number; el: HTMLElement };
        snappedPortRef.current = found;
        found.el.classList.add('port-snapped');
        connDragPos.current = { x: found.x, y: found.y };
        connDragRef.current = { ...connDragRef.current, x: found.x, y: found.y };
      } else {
        snappedPortRef.current = null;
        connDragPos.current = { x: e.clientX, y: e.clientY };
        connDragRef.current = { ...connDragRef.current, x: e.clientX, y: e.clientY };
      }
      setConnDragRender(Date.now());
    }
  }, [viewport.zoom]);

  const handleCanvasPointerUp = useCallback((e: React.PointerEvent) => {
    isPanning.current = false;
    
    if (dragId.current) {
      canvasEngine.pushHistory(); // Save history after drag completes
      dragId.current = null;
    }

    // Clear any port snap class
    document.querySelectorAll('.port-snapped').forEach(el => el.classList.remove('port-snapped'));

    if (connDragRef.current) {
      // 1. If snapped magnetically to a port, connect directly!
      if (snappedPortRef.current) {
        const { targetId, targetHandle } = snappedPortRef.current;
        canvasEngine.addEdge({
          id: `e_${Date.now()}`,
          source: connDragRef.current.sourceId,
          target: targetId,
          sourceHandle: 'out',
          targetHandle,
        });
        snappedPortRef.current = null;
        connDragRef.current = null;
        setConnDrag(null);
        return;
      }

      // 2. Fallback: Check element under cursor
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const targetEl = el?.closest('[data-target]') as HTMLElement | null;
      const targetData = targetEl?.getAttribute('data-target');
      if (targetData) {
        const [targetId, targetHandle] = targetData.split(':');
        if (targetId && targetId !== connDragRef.current.sourceId) {
          const sourceNode = canvasEngine.getNode(connDragRef.current.sourceId);
          const tgtHandle = targetHandle || 'in';
          
          let isValid = true;
          let invalidReason = '';

          if (sourceNode?.id === targetId) {
            isValid = false;
            invalidReason = 'Không thể nối node với chính nó.';
          } else if (sourceNode?.type === 'input.text' && tgtHandle === 'image') {
            isValid = false;
            invalidReason = 'Cổng nhập này chỉ nhận dữ liệu Ảnh (Image), không nhận Text.';
          } else if (sourceNode?.type === 'input.image' && tgtHandle === 'text') {
            isValid = false;
            invalidReason = 'Cổng nhập này chỉ nhận Prompt Text, không nhận File Ảnh.';
          } else if (sourceNode?.type === 'ai.audioGen' && tgtHandle === 'image') {
            isValid = false;
            invalidReason = 'Cổng nhập này chỉ nhận Ảnh (Image), không nhận File Audio.';
          } else if ((sourceNode?.type === 'input.image' || sourceNode?.type === 'ai.imageGen') && tgtHandle === 'file') {
            isValid = false;
            invalidReason = 'Cổng nhập này chỉ nhận File Văn bản/PDF, không nhận File Ảnh.';
          }
          
          if (isValid) {
            canvasEngine.addEdge({
              id: `e_${Date.now()}`,
              source: connDragRef.current.sourceId,
              target: targetId,
              sourceHandle: 'out',
              targetHandle: tgtHandle,
            });
          } else {
            toast.warning(invalidReason || 'Đường nối không hợp lệ do không tương thích loại dữ liệu!');
          }
        }
      }
      connDragRef.current = null;
      setConnDrag(null);
    }
  }, []);

  const handleNodeDragStart = useCallback((e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    dragId.current = id;
    dragStart.current = { x: e.clientX, y: e.clientY };
    const node = canvasEngine.getNode(id);
    if (node) nodeStartPos.current = { ...node.position };
    canvasEngine.select(id, e.ctrlKey || e.metaKey);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleConnectStart = useCallback((e: React.PointerEvent, id: string, _handle: 'out') => {
    e.stopPropagation();
    const newDrag = { sourceId: id, sourceHandle: 'out' as const, x: e.clientX, y: e.clientY };
    connDragRef.current = newDrag;
    setConnDrag(newDrag);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleDisconnectStart = useCallback((e: React.PointerEvent, targetId: string, targetHandle?: string) => {
    e.stopPropagation();
    const edges = canvasEngine.getEdges();
    const edge = edges.find(e => e.target === targetId && e.targetHandle === (targetHandle || 'in'));
    if (edge) {
      canvasEngine.removeEdge(edge.id);
      const newDrag = { sourceId: edge.source, sourceHandle: 'out' as const, x: e.clientX, y: e.clientY };
      connDragRef.current = newDrag;
      setConnDrag(newDrag);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const nodeEl = (e.target as HTMLElement).closest('[data-nodeid]');
    const nodeId = nodeEl ? nodeEl.getAttribute('data-nodeid') : null;
    setMenu({ x: e.clientX, y: e.clientY, nodeId, edgeId: null });
  };

  // Compute temp edge line during connection drag
  const tempEdgeLine = connDragRef.current ? (() => {
    const srcNode = canvasEngine.getNode(connDragRef.current!.sourceId);
    if (!srcNode) return null;
    const srcSize = canvasEngine.getNodeSize(connDragRef.current!.sourceId);
    const rect = canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const srcPos = getHandlePosition(srcNode, srcSize, 'out');
    const x1 = srcPos.x * viewport.zoom + viewport.x;
    const y1 = srcPos.y * viewport.zoom + viewport.y;
    const x2 = connDragRef.current!.x - rect.left;
    const y2 = connDragRef.current!.y - rect.top;
    const dx = Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  })() : null;

  return (
    <div
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--canvas)',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 0)',
        backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
        backgroundPosition: `${viewport.x % (24 * viewport.zoom)}px ${viewport.y % (24 * viewport.zoom)}px`,
        cursor: isPanning.current ? 'grabbing' : 'default',
      }}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onContextMenu={handleContextMenu}
      onClick={() => setMenu(null)}
    >
      {/* Empty State Banner */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-panel/90 backdrop-blur-xl border border-border-subtle p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-11/12 text-center pointer-events-auto flex flex-col items-center gap-4 border-dashed border-accent-lime/30 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-accent-lime/10 border border-accent-lime/30 flex items-center justify-center text-accent-lime shadow-[0_0_20px_rgba(198,241,53,0.15)]">
              <Plus size={28} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base sm:text-lg font-bold text-white">Workflow của bạn đang trống</h3>
              <p className="text-xs text-text-muted">Bấm nút <span className="text-accent-lime font-semibold">+</span> trên thanh công cụ bên trái hoặc chọn mẫu dưới đây để bắt đầu tạo flow:</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full mt-2">
              <button 
                onClick={() => canvasEngine.addNode({ id: `node_${Date.now()}`, type: 'ai.textGen', position: { x: 300, y: 200 }, data: {} })}
                className="px-3 py-2 bg-canvas hover:bg-white/10 border border-border-subtle rounded-xl text-xs text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                + AI Text Node
              </button>
              <button 
                onClick={() => canvasEngine.addNode({ id: `node_${Date.now()}`, type: 'ai.imageGen', position: { x: 300, y: 200 }, data: {} })}
                className="px-3 py-2 bg-canvas hover:bg-white/10 border border-border-subtle rounded-xl text-xs text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                + AI Image Node
              </button>
              <button 
                onClick={() => canvasEngine.addNode({ id: `node_${Date.now()}`, type: 'ai.videoGen', position: { x: 300, y: 200 }, data: {} })}
                className="px-3 py-2 bg-canvas hover:bg-white/10 border border-border-subtle rounded-xl text-xs text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                + AI Video Node
              </button>
              <button 
                onClick={() => canvasEngine.addNode({ id: `node_${Date.now()}`, type: 'ai.dubSub', position: { x: 300, y: 200 }, data: {} })}
                className="px-3 py-2 bg-canvas hover:bg-white/10 border border-border-subtle rounded-xl text-xs text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                + Lồng tiếng / Sub
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Viewport transform layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: '0 0',
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          width: 0,
          height: 0,
        }}
      >
        {/* Edges */}
        <svg style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(198,241,53,0.3)" />
              <stop offset="100%" stopColor="rgba(198,241,53,0.9)" />
            </linearGradient>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="rgba(198,241,53,0.7)" />
            </marker>
          </defs>
          {edges.map(edge => {
            const src = canvasEngine.getNode(edge.source);
            const tgt = canvasEngine.getNode(edge.target);
            if (!src || !tgt) return null;
            const srcSize = canvasEngine.getNodeSize(edge.source);
            const tgtSize = canvasEngine.getNodeSize(edge.target);
            
            const srcPos = getHandlePosition(src, srcSize, 'out');
            const tgtPos = getHandlePosition(tgt, tgtSize, 'in', edge.targetHandle);
            
            const x1 = srcPos.x;
            const y1 = srcPos.y;
            const x2 = tgtPos.x;
            const y2 = tgtPos.y;
            
            const dx = Math.abs(x2 - x1) * 0.5;
            const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
            
            const isSelected = selectedIds.includes(edge.id);
            
            return (
              <g key={edge.id}>
                {/* Hit area for clicking */}
                <path 
                  d={path} 
                  fill="none" 
                  stroke="transparent" 
                  strokeWidth={20}
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    canvasEngine.select(edge.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenu({ x: e.clientX, y: e.clientY, nodeId: null, edgeId: edge.id });
                  }}
                />
                {/* Visible edge */}
                <path 
                  d={path} 
                  fill="none" 
                  stroke={isSelected ? '#fff' : "url(#edgeGrad)"} 
                  strokeWidth={isSelected ? 3 : 1.5} 
                  markerEnd="url(#arrowhead)" 
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map(node => (
          <NodeWrapper
            key={node.id}
            node={node}
            selected={selectedIds.includes(node.id)}
            onDragStart={handleNodeDragStart}
            onConnectStart={handleConnectStart}
            onDisconnectStart={handleDisconnectStart}
          />
        ))}
      </div>

      {/* Floating Toolbar */}
      {selectedIds.length === 1 && selectedIds[0].startsWith('node') && (
        <NodeFloatingToolbar nodeId={selectedIds[0]} />
      )}
      {selectedIds.length === 1 && selectedIds[0].startsWith('e_') && (
        <EdgeFloatingToolbar edgeId={selectedIds[0]} />
      )}

      {/* Temp connection line (screen space) */}
      {tempEdgeLine && (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 30 }}>
          <path 
            d={tempEdgeLine} 
            fill="none" 
            stroke={snappedPortRef.current ? "var(--accent-lime)" : "rgba(198,241,53,0.8)"} 
            strokeWidth={snappedPortRef.current ? 3 : 2} 
            strokeDasharray={snappedPortRef.current ? "none" : "6 3"}
            style={{ filter: snappedPortRef.current ? "drop-shadow(0 0 8px rgba(198,241,53,0.9))" : "none" }}
          />
        </svg>
      )}

      {/* Context Menu */}
      {menu && (
        <ContextMenuOverlay
          x={menu.x}
          y={menu.y}
          nodeId={menu.nodeId}
          edgeId={menu.edgeId}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

// --- Inline ContextMenu to avoid import issues ---
function ContextMenuOverlay({ x, y, nodeId, edgeId, onClose }: { x: number; y: number; nodeId: string | null; edgeId?: string | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const nodeItems = nodeId ? [
    { icon: <Play size={14} />, label: 'Run node', action: () => { useWorkflowStore.getState().executeWorkflow(); onClose(); } },
    { icon: <Settings size={14} />, label: 'Settings', action: () => { 
        canvasEngine.select(nodeId); 
        useWorkflowStore.getState().setPropertiesPanelOpen(true); 
        onClose(); 
    } },
    { divider: true },
    { icon: <Copy size={14} />, label: 'Copy node', shortcut: '⌘C', action: () => { 
        canvasEngine.select(nodeId);
        canvasEngine.copySelected();
        toast.success('Đã sao chép node vào bộ nhớ tạm (Ctrl+V để dán)!');
        onClose(); 
    } },
    { icon: <Plus size={14} />, label: 'Duplicate', shortcut: '⌘D', action: () => { canvasEngine.duplicateNode(nodeId); onClose(); } },
    { divider: true },
    { icon: <Trash2 size={14} />, label: 'Delete node', shortcut: '⌫', danger: true, action: () => { canvasEngine.removeNode(nodeId); onClose(); } },
  ] : null;

  const bgItems = [
    { label: '+ Text Input', action: () => { addNode('input.text'); onClose(); } },
    { label: '+ Image Input', action: () => { addNode('input.image'); onClose(); } },
    { label: '✦ Text Gen', action: () => { addNode('ai.textGen'); onClose(); } },
    { label: '✦ Image Gen', action: () => { addNode('ai.imageGen'); onClose(); } },
    { label: '✦ Video Gen', action: () => { addNode('ai.videoGen'); onClose(); } },
    { label: '↓ Download', action: () => { addNode('util.download'); onClose(); } },
    { label: '📄 Other Input', action: () => { addNode('input.file'); onClose(); } },
    { label: '◻ Note', action: () => { addNode('note'); onClose(); } },
  ];

  const edgeItems = edgeId ? [
    { icon: <Trash2 size={14} />, label: 'Delete Connection', shortcut: '⌫', danger: true, action: () => { canvasEngine.removeEdge(edgeId); onClose(); } },
  ] : null;

  const items = nodeId ? nodeItems : (edgeId ? edgeItems : bgItems);

  function addNode(type: string) {
    const pos = canvasEngine.screenToCanvas(x, y);
    canvasEngine.addNode({
      id: `node_${Date.now()}`,
      type,
      position: pos,
      data: {},
    });
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 9999,
        background: 'var(--panel)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: '6px 4px',
        minWidth: 200,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {items?.map((item: any, i) => {
        if (item.divider) {
          return <div key={i} className="h-[1px] bg-border-subtle my-1 mx-2" />;
        }
        return (
          <button
            key={i}
            onClick={item.action}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors rounded-lg group
              ${item.danger ? 'text-danger hover:bg-danger/10' : 'text-text-primary hover:bg-white/10'}
            `}
          >
            <div className="flex items-center gap-2">
              {item.icon && <span className="opacity-70 group-hover:opacity-100">{item.icon}</span>}
              <span>{item.label}</span>
            </div>
            {item.shortcut && <span className="text-xs text-text-muted">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}
