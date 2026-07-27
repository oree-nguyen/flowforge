import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  CheckCircle, 
  Lock, 
  RefreshCw, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Type, 
  FileText, 
  ImagePlus 
} from 'lucide-react';
import demoWorkflowRaw from '../data/demoWorkflowData.json';

interface DemoCanvasSceneProps {
  scrollProgress: number; // 0 to 1
  isVisible: boolean;
}

// Convert Base64 data URIs to Blob URLs
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

export function DemoCanvasScene({ scrollProgress, isVisible }: DemoCanvasSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Extract and sanitize raw nodes & edges
  const rawCanvasData = useMemo(() => {
    const data = (demoWorkflowRaw as any).canvasData || demoWorkflowRaw;
    const sanitizedNodes = (data.nodes || []).map((node: any) => {
      const nd = { ...node, data: { ...node.data } };
      if (nd.data.file) nd.data.file = convertDataUri(nd.data.file);
      if (nd.data.imageUrl) nd.data.imageUrl = convertDataUri(nd.data.imageUrl);
      if (nd.data.output?.previewUrl) {
        nd.data.output = {
          ...nd.data.output,
          previewUrl: convertDataUri(nd.data.output.previewUrl),
        };
      }
      return nd;
    });
    return { nodes: sanitizedNodes, edges: data.edges || [] };
  }, []);

  // Node positions state (allows dragging)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const posMap: Record<string, { x: number; y: number }> = {};
    rawCanvasData.nodes.forEach((n: any) => {
      posMap[n.id] = { ...n.position };
    });
    return posMap;
  });

  // Node drag handler
  const activeDragId = useRef<string | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialNodePos = useRef({ x: 0, y: 0 });

  const handlePointerDownNode = (e: React.PointerEvent, id: string) => {
    if ((e.target as HTMLElement).closest('button, input, textarea')) return;
    activeDragId.current = id;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    initialNodePos.current = { ...positions[id] };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveNode = (e: React.PointerEvent) => {
    if (!activeDragId.current) return;
    const dx = (e.clientX - dragStartPos.current.x) / viewport.zoom;
    const dy = (e.clientY - dragStartPos.current.y) / viewport.zoom;
    setPositions((prev) => ({
      ...prev,
      [activeDragId.current!]: {
        x: initialNodePos.current.x + dx,
        y: initialNodePos.current.y + dy,
      },
    }));
  };

  const handlePointerUpNode = () => {
    activeDragId.current = null;
  };

  // Viewport calculation: Auto-center and fit all 6 nodes
  const viewport = useMemo(() => {
    const nodeCoords = Object.values(positions);
    if (nodeCoords.length === 0) return { zoom: 0.48, x: -500, y: -60 };

    const minX = Math.min(...nodeCoords.map((p) => p.x));
    const maxX = Math.max(...nodeCoords.map((p) => p.x)) + 340;
    const minY = Math.min(...nodeCoords.map((p) => p.y));
    const maxY = Math.max(...nodeCoords.map((p) => p.y)) + 320;

    const width = maxX - minX;
    const height = maxY - minY;

    // Fixed container aspect assumption
    const containerW = 1000;
    const containerH = 500;

    const zoom = Math.min(containerW / width, containerH / height) * 0.88;
    const x = (containerW - width * zoom) / 2 - minX * zoom;
    const y = (containerH - height * zoom) / 2 - minY * zoom;

    return { zoom: Math.max(0.38, Math.min(0.6, zoom)), x, y };
  }, [positions]);

  // Animation states driven by scrollProgress + Run trigger
  const [isRunning, setIsRunning] = useState(false);
  const [imageGenDone, setImageGenDone] = useState(false);
  const [videoGenDone, setVideoGenDone] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Typewriter state
  const [typedText1, setTypedText1] = useState('');
  const [typedText2, setTypedText2] = useState('');

  // Image Upload loading state
  const [img1Loaded, setImg1Loaded] = useState(false);
  const [img2Loaded, setImg2Loaded] = useState(false);

  // Identify nodes
  const textNode1 = rawCanvasData.nodes.find((n: any) => n.id === 'node_1785078061639');
  const imgNode1 = rawCanvasData.nodes.find((n: any) => n.id === 'node_1785078059250');
  const imgNode2 = rawCanvasData.nodes.find((n: any) => n.id === 'node_1785078056303');
  const imageGenNode = rawCanvasData.nodes.find((n: any) => n.id === 'node_1785078086464');
  const textNode2 = rawCanvasData.nodes.find((n: any) => n.id === 'node_1785078196386_79');
  const videoGenNode = rawCanvasData.nodes.find((n: any) => n.id === 'node_1785078245473');

  const fullText1 = textNode1?.data?.text || 'Tạo ảnh cậu bé đang chơi xe ô tô.';
  const fullText2 = textNode2?.data?.text || 'Tạo video cậu bé đang chơi xe ô tô';

  // Calculate phase visibilities based on scrollProgress
  const showText1 = scrollProgress >= 0.05;
  const showImg1 = scrollProgress >= 0.12;
  const showImg2 = scrollProgress >= 0.20;
  const showImageGen = scrollProgress >= 0.28;
  const showEdges1 = scrollProgress >= 0.36;
  const showText2 = scrollProgress >= 0.44;
  const showVideoGen = scrollProgress >= 0.52;
  const showEdges2 = scrollProgress >= 0.60;
  const enableTyping = scrollProgress >= 0.68;
  const enableUploading = scrollProgress >= 0.78;
  const showRunBtn = scrollProgress >= 0.88;

  // Typewriter effect logic
  useEffect(() => {
    if (!enableTyping) {
      setTypedText1('');
      setTypedText2('');
      return;
    }

    let t1Index = 0;
    let t2Index = 0;

    const timer1 = setInterval(() => {
      if (t1Index <= fullText1.length) {
        setTypedText1(fullText1.slice(0, t1Index));
        t1Index++;
      } else {
        clearInterval(timer1);
        const timer2 = setInterval(() => {
          if (t2Index <= fullText2.length) {
            setTypedText2(fullText2.slice(0, t2Index));
            t2Index++;
          } else {
            clearInterval(timer2);
          }
        }, 35);
      }
    }, 35);

    return () => {
      clearInterval(timer1);
    };
  }, [enableTyping, fullText1, fullText2]);

  // Image upload shimmer simulation logic
  useEffect(() => {
    if (!enableUploading) {
      setImg1Loaded(false);
      setImg2Loaded(false);
      return;
    }

    const t1 = setTimeout(() => setImg1Loaded(true), 600);
    const t2 = setTimeout(() => setImg2Loaded(true), 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [enableUploading]);

  // Reset Run states if user scrolls back up
  useEffect(() => {
    if (scrollProgress < 0.85) {
      setIsRunning(false);
      setImageGenDone(false);
      setVideoGenDone(false);
      setDownloaded(false);
    }
  }, [scrollProgress]);

  // Trigger Run AI Pipeline
  const handleRunWorkflow = () => {
    if (isRunning || (imageGenDone && videoGenDone)) return;
    setIsRunning(true);

    // Step 1: Run ImageGen (2.2s)
    setTimeout(() => {
      setImageGenDone(true);

      // Step 2: Run VideoGen (2.5s after ImageGen)
      setTimeout(() => {
        setVideoGenDone(true);
        setIsRunning(false);

        // Step 3: Trigger auto-download
        setTimeout(() => {
          triggerAutoDownloads();
        }, 500);
      }, 2500);
    }, 2200);
  };

  // Auto-download generated media files to disk
  const triggerAutoDownloads = () => {
    if (downloaded) return;
    setDownloaded(true);

    const imageBlob = imageGenNode?.data?.output?.previewUrl;
    const videoBlob = videoGenNode?.data?.output?.previewUrl;

    if (imageBlob) {
      const a1 = document.createElement('a');
      a1.href = imageBlob;
      a1.download = 'FlowForge_Generated_Image.png';
      document.body.appendChild(a1);
      a1.click();
      document.body.removeChild(a1);
    }

    if (videoBlob) {
      setTimeout(() => {
        const a2 = document.createElement('a');
        a2.href = videoBlob;
        a2.download = 'FlowForge_Generated_Video.gif';
        document.body.appendChild(a2);
        a2.click();
        document.body.removeChild(a2);
      }, 600);
    }
  };

  // Helper to compute exact node port handle positions for 100% pixel-perfect wire alignment
  const getPortPos = (nodeId: string, type: 'out' | 'in', index = 0) => {
    const pos = positions[nodeId] || { x: 0, y: 0 };

    // 1. Input Text Nodes (node_1785078061639, node_1785078196386_79)
    if (nodeId.includes('61639') || nodeId.includes('196386')) {
      if (type === 'out') return { x: pos.x + 260, y: pos.y + 92 };
      return { x: pos.x, y: pos.y + 92 };
    }

    // 2. Input Image Nodes (node_1785078059250, node_1785078056303)
    if (nodeId.includes('59250') || nodeId.includes('56303')) {
      if (type === 'out') return { x: pos.x + 260, y: pos.y + 112 };
      return { x: pos.x, y: pos.y + 112 };
    }

    // 3. AI Image Gen Node (node_1785078086464) -> Frame 320x320 (aspect 1:1)
    if (nodeId.includes('86464')) {
      if (type === 'out') return { x: pos.x + 320, y: pos.y + 160 };
      // Port inputs on left: 0 -> Text (120), 1 -> Image (160), 2 -> File (200)
      const inputYOffsets = [120, 160, 200];
      return { x: pos.x - 16, y: pos.y + (inputYOffsets[index] ?? 160) };
    }

    // 4. AI Video Gen Node (node_1785078245473) -> Frame 320x180 (aspect 16:9)
    if (nodeId.includes('45473')) {
      if (type === 'out') return { x: pos.x + 320, y: pos.y + 90 };
      // Port inputs on left: 0 -> Image (70), 1 -> Text (110)
      const inputYOffsets = [70, 110];
      return { x: pos.x - 16, y: pos.y + (inputYOffsets[index] ?? 90) };
    }

    if (type === 'out') return { x: pos.x + 260, y: pos.y + 100 };
    return { x: pos.x, y: pos.y + 100 };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl border border-white/15 bg-[#0A0A0C] overflow-hidden shadow-2xl"
      style={{
        height: 540,
        transition: 'transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 600ms ease-out',
        transform: isVisible ? 'translate(0, 0) scale(1)' : 'translate(24px, 40px) scale(0.93)',
        opacity: isVisible ? 1 : 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 0)',
        backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
        backgroundPosition: `${viewport.x % (24 * viewport.zoom)}px ${viewport.y % (24 * viewport.zoom)}px`,
      }}
      onPointerMove={handlePointerMoveNode}
      onPointerUp={handlePointerUpNode}
    >
      {/* --- TITLE BAR --- */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2.5 bg-[#0C0C0E]/90 backdrop-blur border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          <span className="text-[11px] text-white/50 font-mono ml-2">
            Cinematic Character Pipeline.flow
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-white/40 font-medium">
            <Lock size={11} className="opacity-60" />
            Interactive Demo · Drag nodes to move
          </div>

          {/* RUN BUTTON */}
          {showRunBtn && (
            <button
              onClick={handleRunWorkflow}
              disabled={isRunning}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs transition-all shadow-lg ${
                isRunning
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 animate-pulse'
                  : imageGenDone && videoGenDone
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                  : 'bg-accent-lime text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(132,204,22,0.5)] animate-pulse'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Generating AI Pipeline...</span>
                </>
              ) : imageGenDone && videoGenDone ? (
                <>
                  <CheckCircle size={13} />
                  <span>Completed {downloaded && '· Downloaded ⬇'}</span>
                </>
              ) : (
                <>
                  <Play size={13} className="fill-black" />
                  <span>▶ Run Workflow</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* --- CANVAS CONTENT CONTAINER --- */}
      <div
        className="absolute inset-0 top-[41px] origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        {/* SVG EDGES */}
        <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none z-0">
          <defs>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#84cc16" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Edges into ImageGen */}
          {showEdges1 && textNode1 && imageGenNode && (
            <path
              d={makeBezier(
                getPortPos(textNode1.id, 'out'),
                getPortPos(imageGenNode.id, 'in', 0)
              )}
              fill="none"
              stroke="url(#edgeGrad)"
              strokeWidth="2"
              className="transition-all duration-500 animate-pulse"
            />
          )}
          {showEdges1 && imgNode1 && imageGenNode && (
            <path
              d={makeBezier(
                getPortPos(imgNode1.id, 'out'),
                getPortPos(imageGenNode.id, 'in', 1)
              )}
              fill="none"
              stroke="url(#edgeGrad)"
              strokeWidth="2"
              className="transition-all duration-500 animate-pulse"
            />
          )}
          {showEdges1 && imgNode2 && imageGenNode && (
            <path
              d={makeBezier(
                getPortPos(imgNode2.id, 'out'),
                getPortPos(imageGenNode.id, 'in', 2)
              )}
              fill="none"
              stroke="url(#edgeGrad)"
              strokeWidth="2"
              className="transition-all duration-500 animate-pulse"
            />
          )}

          {/* Edges into VideoGen */}
          {showEdges2 && textNode2 && videoGenNode && (
            <path
              d={makeBezier(
                getPortPos(textNode2.id, 'out'),
                getPortPos(videoGenNode.id, 'in', 0)
              )}
              fill="none"
              stroke="url(#edgeGrad)"
              strokeWidth="2"
              className="transition-all duration-500 animate-pulse"
            />
          )}
          {showEdges2 && imageGenNode && videoGenNode && (
            <path
              d={makeBezier(
                getPortPos(imageGenNode.id, 'out'),
                getPortPos(videoGenNode.id, 'in', 1)
              )}
              fill="none"
              stroke="url(#edgeGrad)"
              strokeWidth="2"
              className="transition-all duration-500 animate-pulse"
            />
          )}
        </svg>

        {/* --- NODE 1: INPUT TEXT --- */}
        {showText1 && textNode1 && (
          <div
            style={{
              position: 'absolute',
              left: positions[textNode1.id]?.x,
              top: positions[textNode1.id]?.y,
            }}
            onPointerDown={(e) => handlePointerDownNode(e, textNode1.id)}
            className="w-[260px] bg-node rounded-2xl shadow-lg border border-border-subtle overflow-visible cursor-grab active:cursor-grabbing transition-all duration-500 z-10 hover:border-text-muted"
          >
            {/* Output Port Handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-accent-lime border-2 border-canvas shadow-[0_0_8px_rgba(198,241,53,0.6)] z-20" />

            <div className="px-4 py-3 bg-white/5 border-b border-border-subtle flex items-center gap-2 rounded-t-2xl">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-sm font-medium text-text-primary">Input Text</span>
            </div>
            <div className="p-4 rounded-b-2xl">
              <textarea
                className="w-full h-24 bg-canvas border border-border-subtle rounded-xl p-3 text-sm text-text-primary outline-none resize-none transition-colors placeholder:text-text-muted font-sans"
                placeholder="Enter text..."
                value={typedText1}
                readOnly
              />
              {typedText1 ? (
                <div className="flex justify-between items-center mt-1.5 px-1">
                  <span className="text-[9px] text-text-muted">{typedText1.length} chars · {typedText1.split(/\s+/).filter(Boolean).length} words</span>
                  <span className="text-[9px] text-text-muted hover:text-danger cursor-pointer">✕ Clear</span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* --- NODE 2: INPUT IMAGE 1 (Red Car) --- */}
        {showImg1 && imgNode1 && (
          <div
            style={{
              position: 'absolute',
              left: positions[imgNode1.id]?.x,
              top: positions[imgNode1.id]?.y,
            }}
            onPointerDown={(e) => handlePointerDownNode(e, imgNode1.id)}
            className="w-[260px] bg-node rounded-2xl shadow-lg border border-border-subtle overflow-visible cursor-grab active:cursor-grabbing transition-all duration-500 z-10 hover:border-text-muted"
          >
            {/* Output Port Handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-accent-lime border-2 border-canvas shadow-[0_0_8px_rgba(198,241,53,0.6)] z-20" />

            <div className="px-4 py-3 bg-white/5 border-b border-border-subtle flex items-center gap-2 rounded-t-2xl">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-sm font-medium text-text-primary">Input Image</span>
            </div>
            <div className="p-4 rounded-b-2xl">
              {img1Loaded ? (
                <div className="relative group rounded-xl overflow-hidden bg-canvas border border-border-subtle aspect-video flex items-center justify-center">
                  <img src={imgNode1.data.file || imgNode1.data.imageUrl} alt="Red toy car" className="max-w-full max-h-full object-contain" />
                </div>
              ) : enableUploading ? (
                <div className="h-32 bg-canvas border border-dashed border-accent-lime/40 rounded-xl flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={20} className="animate-spin text-accent-lime" />
                  <span className="text-xs text-accent-lime font-medium">Uploading...</span>
                </div>
              ) : (
                <div className="h-32 bg-canvas border border-dashed border-border-subtle rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-text-muted transition-colors">
                  <ImagePlus size={24} className="text-text-muted" />
                  <span className="text-xs text-text-muted font-medium">Click to upload</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- NODE 3: INPUT IMAGE 2 (3D Boy) --- */}
        {showImg2 && imgNode2 && (
          <div
            style={{
              position: 'absolute',
              left: positions[imgNode2.id]?.x,
              top: positions[imgNode2.id]?.y,
            }}
            onPointerDown={(e) => handlePointerDownNode(e, imgNode2.id)}
            className="w-[260px] bg-node rounded-2xl shadow-lg border border-border-subtle overflow-visible cursor-grab active:cursor-grabbing transition-all duration-500 z-10 hover:border-text-muted"
          >
            {/* Output Port Handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-accent-lime border-2 border-canvas shadow-[0_0_8px_rgba(198,241,53,0.6)] z-20" />

            <div className="px-4 py-3 bg-white/5 border-b border-border-subtle flex items-center gap-2 rounded-t-2xl">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-sm font-medium text-text-primary">Input Image</span>
            </div>
            <div className="p-4 rounded-b-2xl">
              {img2Loaded ? (
                <div className="relative group rounded-xl overflow-hidden bg-canvas border border-border-subtle aspect-video flex items-center justify-center">
                  <img src={imgNode2.data.file || imgNode2.data.imageUrl} alt="3D Boy" className="max-w-full max-h-full object-contain" />
                </div>
              ) : enableUploading ? (
                <div className="h-32 bg-canvas border border-dashed border-accent-lime/40 rounded-xl flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={20} className="animate-spin text-accent-lime" />
                  <span className="text-xs text-accent-lime font-medium">Uploading...</span>
                </div>
              ) : (
                <div className="h-32 bg-canvas border border-dashed border-border-subtle rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-text-muted transition-colors">
                  <ImagePlus size={24} className="text-text-muted" />
                  <span className="text-xs text-text-muted font-medium">Click to upload</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- NODE 4: AI IMAGE GEN (Gemini Banana Nano 2 Pro) --- */}
        {showImageGen && imageGenNode && (
          <div
            style={{
              position: 'absolute',
              left: positions[imageGenNode.id]?.x,
              top: positions[imageGenNode.id]?.y,
            }}
            onPointerDown={(e) => handlePointerDownNode(e, imageGenNode.id)}
            className="relative group z-10 cursor-grab active:cursor-grabbing transition-all duration-500"
          >
            {/* Floating Node Label above frame */}
            <div className="absolute -top-6 left-0 text-xs font-medium text-text-primary flex items-center gap-2">
              <ImageIcon size={12} /> Google - Nano Banana 2 (Gemini 3.1 Flash Image)
            </div>

            {/* Main Frame */}
            <div className="w-[320px] bg-[#1a1a1a] rounded-xl relative overflow-hidden transition-all border-2 border-border-subtle hover:border-text-muted aspect-[1/1]">
              {/* Preview or Placeholder */}
              {isRunning && !imageGenDone ? (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 animate-pulse flex flex-col items-center justify-center gap-3 p-4 text-center">
                  <div className="w-10 h-10 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
                  <span className="text-xs font-bold text-yellow-300 font-mono tracking-wide">
                    Gemini 3.1 Synthesis...
                  </span>
                </div>
              ) : imageGenDone ? (
                <img
                  src={imageGenNode.data.output?.previewUrl}
                  alt="Generated 3D Boy with Car"
                  className="w-full h-full object-cover transition-all duration-700"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-text-muted/30">
                  <ImageIcon size={48} />
                </div>
              )}

              {/* Top Controls */}
              <div className="absolute top-3 left-3 flex items-center justify-center w-6 h-6 bg-white rounded-full text-black shadow-lg">
                <Play size={12} className="ml-0.5 fill-black" />
              </div>
              
              <div className="absolute top-3 right-3">
                <div className="w-8 h-4 rounded-full flex items-center p-0.5 shadow-lg bg-accent-lime">
                  <div className="w-3 h-3 rounded-full bg-black shadow-sm transform translate-x-4" />
                </div>
              </div>
            </div>

            {/* Input Handle Ports on Left */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-2 pr-2.5 z-20">
              <div className="w-8 h-8 rounded-full border border-border-subtle bg-panel flex items-center justify-center text-text-muted hover:text-white transition-colors shadow-md" title="Text Input">
                <Type size={14} />
              </div>
              <div className="w-8 h-8 rounded-full border border-border-subtle bg-panel flex items-center justify-center text-text-muted hover:text-white transition-colors shadow-md" title="Image Input">
                <ImageIcon size={14} />
              </div>
              <div className="w-8 h-8 rounded-full border border-orange-400/50 bg-panel flex items-center justify-center text-orange-400 hover:text-orange-300 transition-colors shadow-md" title="File Input">
                <FileText size={14} />
              </div>
            </div>

            {/* Output Port Handle on Right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-accent-lime border-2 border-canvas shadow-[0_0_8px_rgba(198,241,53,0.6)] z-20" />
          </div>
        )}

        {/* --- NODE 5: INPUT TEXT 2 --- */}
        {showText2 && textNode2 && (
          <div
            style={{
              position: 'absolute',
              left: positions[textNode2.id]?.x,
              top: positions[textNode2.id]?.y,
            }}
            onPointerDown={(e) => handlePointerDownNode(e, textNode2.id)}
            className="w-[260px] bg-node rounded-2xl shadow-lg border border-border-subtle overflow-visible cursor-grab active:cursor-grabbing transition-all duration-500 z-10 hover:border-text-muted"
          >
            {/* Output Port Handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-accent-lime border-2 border-canvas shadow-[0_0_8px_rgba(198,241,53,0.6)] z-20" />

            <div className="px-4 py-3 bg-white/5 border-b border-border-subtle flex items-center gap-2 rounded-t-2xl">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-sm font-medium text-text-primary">Input Text</span>
            </div>
            <div className="p-4 rounded-b-2xl">
              <textarea
                className="w-full h-24 bg-canvas border border-border-subtle rounded-xl p-3 text-sm text-text-primary outline-none resize-none transition-colors placeholder:text-text-muted font-sans"
                placeholder="Enter text..."
                value={typedText2}
                readOnly
              />
              {typedText2 ? (
                <div className="flex justify-between items-center mt-1.5 px-1">
                  <span className="text-[9px] text-text-muted">{typedText2.length} chars · {typedText2.split(/\s+/).filter(Boolean).length} words</span>
                  <span className="text-[9px] text-text-muted hover:text-danger cursor-pointer">✕ Clear</span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* --- NODE 6: AI VIDEO GEN (Google Veo 3.1 Pro) --- */}
        {showVideoGen && videoGenNode && (
          <div
            style={{
              position: 'absolute',
              left: positions[videoGenNode.id]?.x,
              top: positions[videoGenNode.id]?.y,
            }}
            onPointerDown={(e) => handlePointerDownNode(e, videoGenNode.id)}
            className="relative group z-10 cursor-grab active:cursor-grabbing transition-all duration-500"
          >
            {/* Floating Node Label above frame */}
            <div className="absolute -top-6 left-0 text-xs font-medium text-text-primary flex items-center gap-2">
              <VideoIcon size={12} /> Google Veo 3.1 Pro
            </div>

            {/* Main Frame */}
            <div className="w-[320px] bg-[#1a1a1a] rounded-xl relative overflow-hidden transition-all border-2 border-border-subtle hover:border-text-muted aspect-[16/9]">
              {/* Preview or Placeholder */}
              {isRunning && !videoGenDone && imageGenDone ? (
                <div className="w-full h-full bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#233554] animate-pulse flex flex-col items-center justify-center gap-3 p-4 text-center">
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                  <span className="text-xs font-bold text-emerald-300 font-mono tracking-wide">
                    Rendering Video...
                  </span>
                </div>
              ) : videoGenDone ? (
                <video
                  src={videoGenNode.data.output?.previewUrl}
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-cover transition-all duration-700"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-text-muted/30">
                  <VideoIcon size={48} />
                </div>
              )}

              {/* Top Controls */}
              <div className="absolute top-3 left-3 flex items-center justify-center w-6 h-6 bg-white rounded-full text-black shadow-lg">
                <Play size={12} className="ml-0.5 fill-black" />
              </div>
              
              <div className="absolute top-3 right-3">
                <div className="w-8 h-4 rounded-full flex items-center p-0.5 shadow-lg bg-accent-lime">
                  <div className="w-3 h-3 rounded-full bg-black shadow-sm transform translate-x-4" />
                </div>
              </div>
            </div>

            {/* Input Handle Ports on Left */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-2 pr-2.5 z-20">
              <div className="w-8 h-8 rounded-full border border-border-subtle bg-panel flex items-center justify-center text-text-muted hover:text-white transition-colors shadow-md" title="Image Input">
                <ImageIcon size={14} />
              </div>
              <div className="w-8 h-8 rounded-full border border-border-subtle bg-panel flex items-center justify-center text-text-muted hover:text-white transition-colors shadow-md" title="Text Input">
                <Type size={14} />
              </div>
            </div>

            {/* Output Port Handle on Right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-accent-lime border-2 border-canvas shadow-[0_0_8px_rgba(198,241,53,0.6)] z-20" />
          </div>
        )}
      </div>
    </div>
  );
}

// Bezier curve helper
function makeBezier(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  const dx = Math.abs(p2.x - p1.x) * 0.5;
  return `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
}
