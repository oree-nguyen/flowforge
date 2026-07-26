import { useEffect, useRef } from 'react';
import { canvasEngine } from '../engine/canvasEngine';
import { Canvas } from './Canvas';
import { ZoomControls } from './ZoomControls';
import { RecenterButton } from './RecenterButton';
import { PropertiesPanel } from './PropertiesPanel';
import { Lock } from 'lucide-react';

// ─────────────────────────────────────────────
// Dữ liệu workflow demo đã cập nhật từ file demo_workflow_1785078570786.json
// ─────────────────────────────────────────────
const DEMO_WORKFLOW_DATA = {
  nodes: [
    {
      id: 'node_1785078135724',
      type: 'input.text',
      position: { x: 1158.65, y: 199.20 },
      data: {
        text: 'Tạo ảnh cậu bé đang chơi xe ô tô.',
        nodeName: 'input_text_1',
      },
    },
    {
      id: 'node_1785078059250',
      type: 'input.image',
      position: { x: 1163.33, y: 442.87 },
      data: {
        file: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80',
        nodeName: 'input_image_1',
      },
    },
    {
      id: 'node_1785078086464',
      type: 'ai.imageGen',
      position: { x: 1564.15, y: 233.35 },
      data: {
        model: 'google/gemini-banana-nano-2-pro',
        nodeName: 'ai_image_1',
        aspectRatio: '1:1',
        output: {
          previewUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&auto=format&fit=crop&q=80'
        }
      },
    },
    {
      id: 'node_1785078196386_79',
      type: 'input.text',
      position: { x: 1607.72, y: 643.08 },
      data: {
        text: 'Tạo video cầu bé đang chơi xe ô tô',
        nodeName: 'input_text_2',
      },
    },
    {
      id: 'node_1785078245473',
      type: 'ai.videoGen',
      position: { x: 2012.82, y: 339.72 },
      data: {
        model: 'google/veo-3.1-pro',
        nodeName: 'ai_video_1',
        aspectRatio: '16:9',
        output: {
          previewUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZhcTBxaTFhZWhwZHA3dWxpdnRmcDVwZnkyZXRocDRnZnZhbWVzZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svvjDDy267/giphy.gif'
        }
      },
    },
  ],
  edges: [
    {
      id: 'e_1785078161553',
      source: 'node_1785078135724',
      target: 'node_1785078086464',
      sourceHandle: 'out',
      targetHandle: 'prompt',
    },
    {
      id: 'e_1785078135724',
      source: 'node_1785078059250',
      target: 'node_1785078086464',
      sourceHandle: 'out',
      targetHandle: 'image',
    },
    {
      id: 'e_1785078459911',
      source: 'node_1785078196386_79',
      target: 'node_1785078245473',
      sourceHandle: 'out',
      targetHandle: 'text',
    },
    {
      id: 'e_1785078482142',
      source: 'node_1785078086464',
      target: 'node_1785078245473',
      sourceHandle: 'out',
      targetHandle: 'image',
    },
  ],
  viewport: {
    zoom: 0.55,
    x: -560,
    y: -50,
  },
};

// ─────────────────────────────────────────────
// READ-ONLY MODE: Landing page embedded demo
// ─────────────────────────────────────────────
export function DemoCanvas() {
  const savedStateRef = useRef<ReturnType<typeof canvasEngine.serialize> | null>(null);

  useEffect(() => {
    // Save the real workflow state so we can restore it later
    savedStateRef.current = canvasEngine.serialize();

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

    const sanitizedNodes = (DEMO_WORKFLOW_DATA.nodes || []).map((node: any) => {
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

    // Load the demo workflow
    canvasEngine.deserialize({
      ...DEMO_WORKFLOW_DATA,
      nodes: sanitizedNodes
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
