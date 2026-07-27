import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, CheckCircle, Sparkles, Lock, RefreshCw } from 'lucide-react';
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

  // Helper to compute node center port position
  const getPortPos = (nodeId: string, type: 'out' | 'in', index = 0) => {
    const pos = positions[nodeId] || { x: 0, y: 0 };
    if (type === 'out') {
      return { x: pos.x + 300, y: pos.y + 110 };
    }
    const step = 80;
    const startY = pos.y + 70;
    return { x: pos.x, y: startY + index * step };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl border border-white/15 bg-[#0C0C0E] overflow-hidden shadow-2xl"
      style={{
        height: 540,
        transition: 'transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 600ms ease-out',
        transform: isVisible ? 'translate(0, 0) scale(1)' : 'translate(24px, 40px) scale(0.93)',
        opacity: isVisible ? 1 : 0,
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
              strokeWidth="3.5"
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
              strokeWidth="3.5"
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
              strokeWidth="3.5"
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
              strokeWidth="3.5"
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
              strokeWidth="3.5"
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
            className="w-[260px] bg-[#1C1C1F] rounded-2xl shadow-lg border border-[#2A2A2E] overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-500 z-10 hover:border-accent-lime/50"
          >
            <div className="px-4 py-3 bg-white/5 border-b border-[#2A2A2E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-sm font-medium text-white">Input Text</span>
              </div>
              <span className="text-[10px] text-white/40 font-mono">text</span>
            </div>
            <div className="p-4">
              <div className="bg-[#0A0A0C] border border-[#2A2A2E] rounded-xl p-3 text-xs text-white/90 font-mono min-h-[60px] relative">
                {typedText1 || <span className="text-white/30 italic">Waiting for prompt input...</span>}
                {enableTyping && typedText1.length < fullText1.length && (
                  <span className="inline-block w-1.5 h-3.5 bg-accent-lime ml-0.5 animate-pulse" />
                )}
              </div>
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
            className="w-[260px] bg-[#1C1C1F] rounded-2xl shadow-lg border border-[#2A2A2E] overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-500 z-10 hover:border-accent-lime/50"
          >
            <div className="px-4 py-3 bg-white/5 border-b border-[#2A2A2E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <span className="text-sm font-medium text-white">Input Image</span>
              </div>
              <span className="text-[10px] text-white/40 font-mono">image</span>
            </div>
            <div className="p-4">
              <div className="relative w-full h-[140px] bg-[#0A0A0C] border border-[#2A2A2E] rounded-xl overflow-hidden flex items-center justify-center">
                {!img1Loaded && enableUploading ? (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={18} className="animate-spin text-white/60" />
                    <span className="text-[10px] text-white/60 font-mono">Uploading...</span>
                  </div>
                ) : img1Loaded ? (
                  <img
                    src={imgNode1.data.file || imgNode1.data.imageUrl}
                    alt="Red toy car"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-white/30">
                    <Lock size={16} />
                    <span className="text-[10px] font-mono">Waiting for input</span>
                  </div>
                )}
              </div>
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
            className="w-[260px] bg-[#1C1C1F] rounded-2xl shadow-lg border border-[#2A2A2E] overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-500 z-10 hover:border-accent-lime/50"
          >
            <div className="px-4 py-3 bg-white/5 border-b border-[#2A2A2E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <span className="text-sm font-medium text-white">Input Image</span>
              </div>
              <span className="text-[10px] text-white/40 font-mono">image</span>
            </div>
            <div className="p-4">
              <div className="relative w-full h-[140px] bg-[#0A0A0C] border border-[#2A2A2E] rounded-xl overflow-hidden flex items-center justify-center">
                {!img2Loaded && enableUploading ? (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={18} className="animate-spin text-white/60" />
                    <span className="text-[10px] text-white/60 font-mono">Uploading...</span>
                  </div>
                ) : img2Loaded ? (
                  <img
                    src={imgNode2.data.file || imgNode2.data.imageUrl}
                    alt="3D Boy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-white/30">
                    <Lock size={16} />
                    <span className="text-[10px] font-mono">Waiting for input</span>
                  </div>
                )}
              </div>
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
            className="w-[320px] bg-[#1a1a1a] border border-[#2A2A2E] rounded-xl shadow-2xl cursor-grab active:cursor-grabbing transition-all duration-500 z-10 hover:border-accent-lime/60 overflow-hidden"
          >
            <div className="px-4 py-3 bg-[#1C1C1F] border-b border-[#2A2A2E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-yellow-400" />
                <span className="text-xs font-medium text-white truncate max-w-[200px]" title="Google: Nano Banana 2 (Gemini 3.1 Flash Image)">
                  Google: Nano Banana 2...
                </span>
              </div>
              <span className="text-[10px] text-yellow-300 font-mono">AI Image</span>
            </div>
            <div className="relative w-full h-[320px] bg-[#0A0A0C] flex items-center justify-center">
              {isRunning && !imageGenDone ? (
                /* Gemini Mesh Wave Animation Effect */
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 animate-pulse flex flex-col items-center justify-center gap-3 p-4 text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
                  <span className="text-xs font-bold text-yellow-300 font-mono tracking-wide">
                    Gemini 3.1 Synthesis Wave Running...
                  </span>
                  <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-400 to-lime-400 animate-pulse w-3/4" />
                  </div>
                </div>
              ) : imageGenDone ? (
                <img
                  src={imageGenNode.data.output?.previewUrl}
                  alt="Generated 3D Boy with Car"
                  className="w-full h-full object-cover transition-all duration-700"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-white/30">
                  <Sparkles size={32} />
                  <span className="text-xs font-mono">Ready to Generate</span>
                </div>
              )}
            </div>
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
            className="w-[260px] bg-[#1C1C1F] rounded-2xl shadow-lg border border-[#2A2A2E] overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-500 z-10 hover:border-accent-lime/50"
          >
            <div className="px-4 py-3 bg-white/5 border-b border-[#2A2A2E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-sm font-medium text-white">Input Text</span>
              </div>
              <span className="text-[10px] text-white/40 font-mono">text</span>
            </div>
            <div className="p-4">
              <div className="bg-[#0A0A0C] border border-[#2A2A2E] rounded-xl p-3 text-xs text-white/90 font-mono min-h-[60px] relative">
                {typedText2 || <span className="text-white/30 italic">Waiting for prompt input...</span>}
                {enableTyping && typedText2.length < fullText2.length && (
                  <span className="inline-block w-1.5 h-3.5 bg-accent-lime ml-0.5 animate-pulse" />
                )}
              </div>
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
            className="w-[320px] bg-[#1a1a1a] border border-[#2A2A2E] rounded-xl shadow-2xl cursor-grab active:cursor-grabbing transition-all duration-500 z-10 hover:border-accent-lime/60 overflow-hidden"
          >
            <div className="px-4 py-3 bg-[#1C1C1F] border-b border-[#2A2A2E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play size={14} className="text-green-400" />
                <span className="text-xs font-medium text-white truncate max-w-[200px]" title="Google Veo 3.1 Pro">
                  Google Veo 3.1 Pro
                </span>
              </div>
              <span className="text-[10px] text-green-300 font-mono">AI Video</span>
            </div>
            <div className="relative w-full h-[240px] bg-[#0A0A0C] flex items-center justify-center">
              {isRunning && !videoGenDone && imageGenDone ? (
                /* Generative UI wave for Video */
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#233554] animate-pulse flex flex-col items-center justify-center gap-3 p-4 text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                  <span className="text-xs font-bold text-emerald-300 font-mono tracking-wide">
                    Rendering Video Frames...
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
                <div className="flex flex-col items-center gap-3 text-white/30">
                  <Play size={32} />
                  <span className="text-xs font-mono">Ready to Generate</span>
                </div>
              )}
            </div>
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
