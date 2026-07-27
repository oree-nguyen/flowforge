import { useEffect, useRef } from 'react';
import { canvasEngine } from '../engine/canvasEngine';
import { Canvas } from './Canvas';
import { ZoomControls } from './ZoomControls';
import { RecenterButton } from './RecenterButton';
import { PropertiesPanel } from './PropertiesPanel';
import { Lock } from 'lucide-react';

import demoWorkflowRaw from '../data/demoWorkflowData.json';

// ─────────────────────────────────────────────
// READ-ONLY MODE: Landing page embedded demo
// ─────────────────────────────────────────────
export function DemoCanvas() {
  const savedStateRef = useRef<ReturnType<typeof canvasEngine.serialize> | null>(null);

  useEffect(() => {
    // Save the real workflow state so we can restore it later
    savedStateRef.current = canvasEngine.serialize();

    const rawCanvasData = (demoWorkflowRaw as any).canvasData || demoWorkflowRaw;

    // Convert base64 data URIs to lightweight Blob URLs for smooth rendering
    const convertDataUri = (str: any) => {
      if (typeof str === 'string' && str.startsWith('data:')) {
        try {
          const parts = str.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/png';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          return URL.createObjectURL(blob);
        } catch (e) {
          return str;
        }
      }
      return str;
    };

    const sanitizedNodes = (rawCanvasData.nodes || []).map((node: any) => {
      const data = { ...node.data };
      if (data.file) {
        data.file = convertDataUri(data.file);
        data.imageUrl = data.file;
      }
      if (data.imageUrl) {
        data.imageUrl = convertDataUri(data.imageUrl);
      }
      if (data.output?.previewUrl) {
        data.output = { ...data.output, previewUrl: convertDataUri(data.output.previewUrl) };
      }
      return { ...node, data };
    });

    // Load the exact demo workflow with optimized viewport for demo canvas
    canvasEngine.deserialize({
      nodes: sanitizedNodes,
      edges: rawCanvasData.edges || [],
      viewport: {
        zoom: 0.48,
        x: -500,
        y: -60
      }
    } as any);

    return () => {
      // On unmount, restore the real workflow
      if (savedStateRef.current) {
        canvasEngine.deserialize(savedStateRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative w-full rounded-2xl border border-white/15 bg-[#0C0C0E] overflow-hidden"
      style={{ height: 540, touchAction: 'none' }}
    >
      {/* Canvas Title Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2.5 bg-[#0C0C0E]/90 backdrop-blur border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          <span className="text-[11px] text-white/40 font-mono ml-2">
            Cinematic Character Pipeline.flow
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-medium">
          <Lock size={10} className="opacity-60" />
          View only · Drag to pan
        </div>
      </div>

      {/* Actual Canvas */}
      <div className="absolute inset-0 top-[41px]">
        <Canvas />
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
        <ZoomControls />
        <RecenterButton />
      </div>

      {/* Properties Panel */}
      <PropertiesPanel />
    </div>
  );
}
