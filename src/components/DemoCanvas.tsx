import { useEffect, useRef } from 'react';
import { canvasEngine } from '../engine/canvasEngine';
import { Canvas } from './Canvas';
import { ZoomControls } from './ZoomControls';
import { RecenterButton } from './RecenterButton';
import { PropertiesPanel } from './PropertiesPanel';

// ─────────────────────────────────────────────
//  Pre-defined cinematic character demo workflow
//  (mirrors the layout shown in the landing-page screenshot)
// ─────────────────────────────────────────────
const DEMO_WORKFLOW = {
  nodes: [
    {
      id: 'demo_input',
      type: 'input.image',
      position: { x: 40, y: 180 },
      data: {
        label: 'Reference Image',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      },
    },
    {
      id: 'demo_prompt1',
      type: 'ai.textGen',
      position: { x: 480, y: 80 },
      data: {
        model: 'google/gemini-2.0-flash-exp:free',
        nodeName: 'cinematic_prompt',
        prompt:
          'Animate the reference character into an 8-second cinematic video. Slow dolly-in toward subject with smooth global motion. Hair and fabric react gently to a soft breeze. Warm golden-hour lighting with automatic light rig transitions.',
      },
    },
    {
      id: 'demo_prompt2',
      type: 'ai.textGen',
      position: { x: 480, y: 360 },
      data: {
        model: 'google/gemini-2.0-flash-exp:free',
        nodeName: 'style_prompt',
        prompt:
          'Reimagine the reference subject as a bold poster shot from current studio lighting with cinematic shadows. Vibrant accent colors and crisp clean edges. Confident pose with a direct gaze to camera. Glossy magazine-cover aesthetic.',
      },
    },
    {
      id: 'demo_video',
      type: 'ai.videoGen',
      position: { x: 920, y: 50 },
      data: {
        model: 'minimax/video-01',
        nodeName: 'video_output',
        aspectRatio: '16:9',
        prompt: '',
        output: {
          previewUrl:
            'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZhcTBxaTFhZWhwZHA3dWxpdnRmcDVwZnkyZXRocDRnZnZhbWVzZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svvjDDy267/giphy.gif',
        },
      },
    },
    {
      id: 'demo_image',
      type: 'ai.imageGen',
      position: { x: 920, y: 330 },
      data: {
        model: 'black-forest-labs/flux-1-schnell',
        nodeName: 'image_output',
        aspectRatio: '9:16',
        prompt: '',
        output: {
          previewUrl:
            'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
        },
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'demo_input', target: 'demo_prompt1', sourceHandle: 'out', targetHandle: 'image' },
    { id: 'e2', source: 'demo_input', target: 'demo_prompt2', sourceHandle: 'out', targetHandle: 'image' },
    { id: 'e3', source: 'demo_prompt1', target: 'demo_video', sourceHandle: 'out', targetHandle: 'text' },
    { id: 'e4', source: 'demo_prompt2', target: 'demo_image', sourceHandle: 'out', targetHandle: 'text' },
  ],
  viewport: { x: 60, y: 30, zoom: 0.72 },
};

export function DemoCanvas() {
  const savedStateRef = useRef<ReturnType<typeof canvasEngine.serialize> | null>(null);

  useEffect(() => {
    // 1. Save the real workflow state so we can restore it later
    savedStateRef.current = canvasEngine.serialize();

    // 2. Load the demo workflow
    canvasEngine.deserialize(DEMO_WORKFLOW as any);

    return () => {
      // 3. On unmount, restore the real workflow
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
        <div className="flex items-center gap-1.5 text-[11px] text-accent-lime font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
          Live Demo · Drag to interact
        </div>
      </div>

      {/* Actual Canvas (real engine with real nodes) */}
      <div className="absolute inset-0 top-[41px]">
        <Canvas />
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
        <ZoomControls />
        <RecenterButton />
      </div>

      {/* Properties Panel (let it open if node is clicked) */}
      <PropertiesPanel />
    </div>
  );
}
