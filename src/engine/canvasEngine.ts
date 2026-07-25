/**
 * Custom Canvas Engine - Pure React 19 compatible
 * Manages nodes, edges, selection, and viewport state
 */

export type NodeData = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  width?: number;
  height?: number;
};

export type EdgeData = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
};

export type ViewportState = {
  x: number;
  y: number;
  zoom: number;
};

type Listener = () => void;

class CanvasEngine {
  private nodes: Map<string, NodeData> = new Map();
  private edges: Map<string, EdgeData> = new Map();
  private selectedIds: Set<string> = new Set();
  private viewport: ViewportState = { x: 0, y: 0, zoom: 1 };
  private listeners: Set<Listener> = new Set();
  private nodeRefs: Map<string, { width: number; height: number }> = new Map();

  // Snapshot cache for useSyncExternalStore
  private snapshot = {
    nodes: [] as NodeData[],
    edges: [] as EdgeData[],
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedIds: [] as string[]
  };

  private updateSnapshot() {
    this.snapshot = {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      viewport: this.viewport,
      selectedIds: Array.from(this.selectedIds)
    };
  }

  getSnapshot = () => {
    return this.snapshot;
  };

  // Subscribe/unsubscribe
  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.updateSnapshot();
    this.listeners.forEach(fn => fn());
  }

  // Node CRUD
  addNode(node: NodeData) {
    this.nodes.set(node.id, { ...node });
    this.notify();
  }

  updateNode(id: string, updates: Partial<NodeData>) {
    const node = this.nodes.get(id);
    if (node) {
      this.nodes.set(id, { ...node, ...updates });
      this.notify();
    }
  }

  updateNodeData(id: string, data: Partial<Record<string, any>>) {
    const node = this.nodes.get(id);
    if (node) {
      this.nodes.set(id, { ...node, data: { ...node.data, ...data } });
      this.notify();
    }
  }

  removeNode(id: string) {
    this.nodes.delete(id);
    // Remove connected edges
    for (const [eid, edge] of this.edges) {
      if (edge.source === id || edge.target === id) {
        this.edges.delete(eid);
      }
    }
    this.selectedIds.delete(id);
    this.notify();
  }

  duplicateNode(id: string) {
    const node = this.nodes.get(id);
    if (node) {
      const newId = `node_${Date.now()}`;
      this.nodes.set(newId, {
        ...node,
        id: newId,
        position: { x: node.position.x + 30, y: node.position.y + 30 },
        data: { ...node.data }
      });
      this.notify();
    }
  }

  getNode(id: string): NodeData | undefined {
    return this.nodes.get(id);
  }

  getNodes(): NodeData[] {
    return Array.from(this.nodes.values());
  }

  // Edge CRUD
  addEdge(edge: EdgeData) {
    // Avoid duplicate edges
    const existing = Array.from(this.edges.values()).find(
      e => e.source === edge.source && e.target === edge.target &&
           e.sourceHandle === edge.sourceHandle && e.targetHandle === edge.targetHandle
    );
    if (!existing) {
      this.edges.set(edge.id, edge);
      this.notify();
    }
  }

  removeEdge(id: string) {
    this.edges.delete(id);
    this.notify();
  }

  getEdges(): EdgeData[] {
    return Array.from(this.edges.values());
  }

  // Selection
  select(id: string, multi = false) {
    if (!multi) this.selectedIds.clear();
    this.selectedIds.add(id);
    this.notify();
  }

  deselect(id: string) {
    this.selectedIds.delete(id);
    this.notify();
  }

  clearSelection() {
    this.selectedIds.clear();
    this.notify();
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  getSelectedIds(): string[] {
    return Array.from(this.selectedIds);
  }

  getSelectedNodeId(): string | null {
    for (const id of this.selectedIds) {
      if (this.nodes.has(id)) return id;
    }
    return null;
  }

  // Viewport
  setViewport(v: ViewportState) {
    this.viewport = v;
    this.notify();
  }

  getViewport(): ViewportState {
    return this.viewport;
  }

  panBy(dx: number, dy: number) {
    this.viewport = { ...this.viewport, x: this.viewport.x + dx, y: this.viewport.y + dy };
    this.notify();
  }

  zoomTo(zoom: number, cx?: number, cy?: number) {
    const clampedZoom = Math.min(Math.max(zoom, 0.1), 3);
    if (cx !== undefined && cy !== undefined) {
      const scale = clampedZoom / this.viewport.zoom;
      this.viewport = {
        zoom: clampedZoom,
        x: cx - scale * (cx - this.viewport.x),
        y: cy - scale * (cy - this.viewport.y)
      };
    } else {
      this.viewport = { ...this.viewport, zoom: clampedZoom };
    }
    this.notify();
  }

  zoomIn() { this.zoomTo(this.viewport.zoom * 1.2); }
  zoomOut() { this.zoomTo(this.viewport.zoom / 1.2); }
  resetView() { this.setViewport({ x: 0, y: 0, zoom: 1 }); }

  // Node size tracking (for edge routing)
  setNodeSize(id: string, width: number, height: number) {
    this.nodeRefs.set(id, { width, height });
  }

  getNodeSize(id: string) {
    return this.nodeRefs.get(id) ?? { width: 240, height: 120 };
  }

  // Screen → canvas coordinate
  screenToCanvas(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.viewport.x) / this.viewport.zoom,
      y: (sy - this.viewport.y) / this.viewport.zoom
    };
  }

  // Serialize/deserialize
  serialize() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      viewport: this.viewport
    };
  }

  deserialize(data: { nodes: NodeData[]; edges: EdgeData[]; viewport?: ViewportState }) {
    this.nodes.clear();
    this.edges.clear();
    this.selectedIds.clear();
    data.nodes.forEach(n => this.nodes.set(n.id, n));
    data.edges.forEach(e => this.edges.set(e.id, e));
    if (data.viewport) this.viewport = data.viewport;
    this.notify();
  }
}

// Singleton engine instance
export const canvasEngine = new CanvasEngine();
