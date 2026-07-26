import { useState, useEffect, useRef } from 'react';
import { Globe, ArrowRight, Play, ChevronRight, Layers, Cpu, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  onOpenWorkflow: () => void;
}

export function LandingPage({ onOpenWorkflow }: LandingPageProps) {
  const [lang, setLang] = useState<'en' | 'vi'>('en');

  // Multi-language text dictionary
  const t = {
    en: {
      navFeatures: 'Features',
      navWorkflows: 'Workflows',
      navPrompts: 'Prompts',
      navPricing: 'Pricing',
      navFAQ: 'FAQ',
      navGuide: 'Guide',
      signIn: 'Sign in',
      getStarted: 'Open Workflow',
      heroTag: '✨ Next-Gen Visual AI Orchestration',
      heroTitle: 'Build Complex Multi-Modal AI Workflows with FlowForge',
      heroSubtitle: 'Connect 400+ AI models including ChatGPT, Grok, FLUX, and MiniMax into seamless visual DAG execution nodes.',
      openAppBtn: 'Open Workflow Editor',
      demoVideoBtn: 'Watch Demo',
      showcaseTitle: 'Real-time AI Generation Pipelines',
      showcaseSubtitle: 'Watch how FlowForge seamlessly streams outputs across text, image, and video models in parallel.',
      feature1Title: '400+ OpenRouter AI Models',
      feature1Desc: 'Access LLMs, FLUX Image Gen, and MiniMax Video Gen in a unified visual node builder.',
      feature2Title: 'Visual DAG Execution',
      feature2Desc: 'Topological execution engine processes input data through custom node dependencies.',
      feature3Title: 'Cloud & Local Auto-Sync',
      feature3Desc: 'Sync outputs automatically to Google Drive, IndexedDB, or local file system.',
      footerRights: 'FlowForge Inc. All rights reserved.',
    },
    vi: {
      navFeatures: 'Tính năng',
      navWorkflows: 'Quy trình mẫu',
      navPrompts: 'Thư viện Prompt',
      navPricing: 'Bảng giá',
      navFAQ: 'Hỏi đáp',
      navGuide: 'Hướng dẫn',
      signIn: 'Đăng nhập',
      getStarted: 'Mở Workflow',
      heroTag: '✨ Nền tảng điều phối AI trực quan thế hệ mới',
      heroTitle: 'Xây dựng quy trình AI Đa phương thức phức tạp với FlowForge',
      heroSubtitle: 'Kết nối 400+ model AI như ChatGPT, Grok, FLUX, MiniMax thành các node thực thi dạng đồ thị trực quan.',
      openAppBtn: 'Mở Workflow Editor',
      demoVideoBtn: 'Xem Video Demo',
      showcaseTitle: 'Các Chuỗi Sinh AI Theo Thời Gian Thực',
      showcaseSubtitle: 'Khám phá cách FlowForge stream nội dung tự động giữa các model Text, Image và Video song song.',
      feature1Title: '400+ Model AI OpenRouter',
      feature1Desc: 'Kết nối LLM, FLUX Image Gen, MiniMax Video Gen trên cùng một canvas trực quan.',
      feature2Title: 'Động cơ Thực thi DAG Trực quan',
      feature2Desc: 'Xử lý quy trình theo thứ tự phụ thuộc topologically giữa các node linh hoạt.',
      feature3Title: 'Đồng bộ Tự động Cloud & Local',
      feature3Desc: 'Lưu trữ output tự động về Google Drive, IndexedDB hoặc máy cá nhân.',
      footerRights: 'FlowForge Inc. Bảo lưu mọi quyền.',
    }
  }[lang];

  // Video Card Items with scroll-triggered animations
  const videoCards = [
    {
      id: 1,
      title: 'Reference Image to 8-sec Video',
      tag: 'AI Video Gen',
      model: 'MiniMax Video-01',
      gifUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      prompt: 'Animate character with cinematic dolly zoom motion, golden hour lighting'
    },
    {
      id: 2,
      title: 'Stylized 3D Character Rendering',
      tag: 'AI Image Gen',
      model: 'FLUX.1 Schnell',
      gifUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
      prompt: 'Skater boy in futuristic Neo Tokyo city, 8k render, octane render style'
    },
    {
      id: 3,
      title: 'Cyberpunk Billboard Generation',
      tag: 'AI Image Gen',
      model: 'Grok / FLUX Pro',
      gifUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      prompt: 'Glossy magazine cover shot, neon vibrant colors, direct camera gaze'
    },
    {
      id: 4,
      title: 'Voice Narration & Dubbing Pipeline',
      tag: 'AI Audio Gen',
      model: 'OpenAI TTS-1 HD',
      gifUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      prompt: 'Natural studio voiceover with soft warm acoustics and crisp dynamic range'
    }
  ];

  // IntersectionObserver for video cards scroll-triggered stagger animation
  const showcaseRef = useRef<HTMLDivElement>(null);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Stagger reveal cards one by one
          videoCards.forEach((card, index) => {
            setTimeout(() => {
              setVisibleCards(prev => [...new Set([...prev, card.id])]);
            }, index * 200);
          });
        }
      });
    }, { threshold: 0.15 });

    if (showcaseRef.current) {
      observer.observe(showcaseRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full h-screen bg-[#0A0A0C] text-white font-sans overflow-y-auto overflow-x-hidden selection:bg-accent-lime selection:text-black touch-auto">
      
      {/* --- TOP NAVBAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0C]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 rounded-xl bg-accent-lime flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(132,204,22,0.4)]">
            ✦
          </div>
          <span className="text-lg font-bold tracking-tight text-white">FlowForge</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-text-muted font-medium">
          <a href="#features" className="hover:text-white transition-colors">{t.navFeatures}</a>
          <a href="#workflows" className="hover:text-white transition-colors">{t.navWorkflows}</a>
          <a href="#showcase" className="hover:text-white transition-colors">{t.navPrompts}</a>
          <a href="#pricing" className="hover:text-white transition-colors">{t.navPricing}</a>
          <a href="#faq" className="hover:text-white transition-colors">{t.navFAQ}</a>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <button 
            onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-white/15 rounded-xl hover:border-white/40 text-text-muted hover:text-white transition-all bg-white/5"
          >
            <Globe size={13} />
            <span>{lang.toUpperCase()}</span>
          </button>

          {/* CTA OPEN WORKFLOW BUTTON */}
          <button 
            onClick={onOpenWorkflow}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent-lime text-black font-semibold text-xs hover:brightness-110 shadow-[0_0_20px_rgba(132,204,22,0.4)] transition-all hover:scale-105 active:scale-95"
          >
            <span>{t.getStarted}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-lime/10 border border-accent-lime/30 text-accent-lime text-xs font-medium mb-6 animate-pulse">
          {t.heroTag}
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6 bg-gradient-to-b from-white via-white/90 to-white/50 bg-clip-text text-transparent">
          {t.heroTitle}
        </h1>

        <p className="text-base md:text-lg text-text-muted max-w-2xl mb-10 leading-relaxed">
          {t.heroSubtitle}
        </p>

        <div className="flex items-center gap-4 mb-16">
          <button 
            onClick={onOpenWorkflow}
            className="px-8 py-3.5 rounded-2xl bg-accent-lime text-black font-bold text-sm hover:brightness-110 shadow-[0_0_30px_rgba(132,204,22,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>{t.openAppBtn}</span>
            <ChevronRight size={16} />
          </button>
          <a 
            href="#showcase"
            className="px-6 py-3.5 rounded-2xl border border-white/20 hover:border-white/40 text-white font-semibold text-sm hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <Play size={14} />
            <span>{t.demoVideoBtn}</span>
          </a>
        </div>

        {/* --- WORKFLOW CANVAS MOCKUP (INTERACTIVE) --- */}
        <div 
          onClick={onOpenWorkflow}
          className="w-full relative rounded-3xl border border-white/15 hover:border-accent-lime/60 bg-[#121216] p-6 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden cursor-pointer group transition-all"
        >
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Canvas Mockup Title bar */}
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-text-muted ml-2 font-mono">Workflow: Cinematic Character pipeline.flow</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-accent-lime group-hover:scale-105 transition-transform">
              <span className="w-2 h-2 rounded-full bg-accent-lime animate-ping" />
              Click to Interact & Edit Workflow ➔
            </div>
          </div>

          {/* Mockup Canvas Container with Nodes and SVG Wires */}
          <div className="relative min-h-[500px] w-full flex items-center justify-center py-6">
            
            {/* SVG Connecting Wires */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-accent-lime/40 stroke-[2] fill-none">
              {/* Path 1: Image Node -> Text Node */}
              <path d="M 280 250 C 340 250, 340 180, 400 180" className="stroke-purple-500/60" />
              {/* Path 2: Text Node -> Video Node */}
              <path d="M 640 180 C 700 180, 700 200, 760 200" className="stroke-accent-lime" />
              {/* Path 3: Image Node -> Sub Text Node */}
              <path d="M 280 250 C 340 250, 340 380, 400 380" className="stroke-orange-500/60" />
              {/* Path 4: Sub Text Node -> Image Node 2 */}
              <path d="M 640 380 C 700 380, 700 380, 760 380" className="stroke-orange-400" />
            </svg>

            {/* Layout Grid of Nodes */}
            <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 items-center z-10 text-left">
              
              {/* LEFT NODE: Reference Image */}
              <div className="bg-[#1A1A22] border border-purple-500/40 rounded-2xl p-3 shadow-xl hover:border-purple-500 transition-all transform hover:-translate-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-purple-400 mb-2">
                  <span>🖼️ Reference Image</span>
                  <span className="text-white/40">Input</span>
                </div>
                <div className="relative h-64 rounded-xl overflow-hidden border border-white/10 bg-black">
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" 
                    alt="Ref Character" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-[10px] text-white">portrait.png</div>
                </div>
              </div>

              {/* MIDDLE NODES: Prompts */}
              <div className="flex flex-col gap-6">
                {/* Text Prompt 1 */}
                <div className="bg-[#1A1A22] border border-border-subtle rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted mb-1.5">
                    <span>💬 Prompt Node</span>
                    <span className="text-accent-lime">AI Text Gen</span>
                  </div>
                  <p className="text-xs text-white/80 bg-black/40 p-2.5 rounded-xl border border-white/5 font-mono">
                    "Animate the reference character into an 8-second cinematic video. Slow dolly-in toward subject with smooth motion."
                  </p>
                </div>

                {/* Text Prompt 2 */}
                <div className="bg-[#1A1A22] border border-border-subtle rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted mb-1.5">
                    <span>💬 Secondary Style</span>
                    <span className="text-orange-400">AI Text Gen</span>
                  </div>
                  <p className="text-xs text-white/80 bg-black/40 p-2.5 rounded-xl border border-white/5 font-mono">
                    "Reimagine the reference subject as a bold poster shot. High contrast studio lighting with deep shadows."
                  </p>
                </div>
              </div>

              {/* RIGHT NODES: Generated Video & Image */}
              <div className="flex flex-col gap-6">
                {/* Video Generation Result */}
                <div className="bg-[#1A1A22] border border-accent-lime/50 rounded-2xl p-3 shadow-[0_0_30px_rgba(132,204,22,0.15)] transform hover:-translate-y-1 transition-all">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-accent-lime mb-2">
                    <span>🎬 Flow — Video</span>
                    <span className="px-1.5 py-0.5 bg-accent-lime/20 rounded text-[9px]">MiniMax Video-01</span>
                  </div>
                  <div className="relative h-44 rounded-xl overflow-hidden border border-accent-lime/30 bg-black">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" 
                      alt="AI Video Output" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-black shadow-lg">
                        <Play size={18} className="ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Generation Result */}
                <div className="bg-[#1A1A22] border border-orange-400/40 rounded-2xl p-3 shadow-xl transform hover:-translate-y-1 transition-all">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-orange-400 mb-2">
                    <span>🖼️ Grok / FLUX Image</span>
                    <span className="px-1.5 py-0.5 bg-orange-400/20 rounded text-[9px]">FLUX 1.1 Pro</span>
                  </div>
                  <div className="relative h-32 rounded-xl overflow-hidden border border-white/10 bg-black">
                    <img 
                      src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80" 
                      alt="AI Image Output" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 2: VIDEO SHOWCASE (SCROLL-TRIGGERED STAGGER ANIMATION) --- */}
      <section id="showcase" ref={showcaseRef} className="py-24 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            {t.showcaseTitle}
          </h2>
          <p className="text-text-muted text-base">
            {t.showcaseSubtitle}
          </p>
        </div>

        {/* Video Cards Grid with Scroll-Triggered Slide Up Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {videoCards.map((card) => {
            const isVisible = visibleCards.includes(card.id);
            return (
              <div 
                key={card.id}
                className={`bg-[#14141A] border border-white/10 hover:border-accent-lime/50 rounded-3xl p-6 transition-all duration-700 ease-out transform ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
                } hover:shadow-[0_0_40px_rgba(132,204,22,0.15)] group`}
              >
                <div className="relative h-64 rounded-2xl overflow-hidden mb-6 bg-black border border-white/10">
                  <img 
                    src={card.gifUrl} 
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur text-xs font-semibold text-accent-lime border border-accent-lime/30">
                    {card.tag}
                  </div>
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur text-xs font-mono text-white/80 border border-white/10">
                    {card.model}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent-lime transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-text-muted bg-white/5 p-3 rounded-xl border border-white/5 font-mono">
                  "{card.prompt}"
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- FEATURES STRIP --- */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#14141A] border border-white/10 p-8 rounded-3xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Cpu size={24} />
            </div>
            <h4 className="text-lg font-bold text-white">{t.feature1Title}</h4>
            <p className="text-sm text-text-muted">{t.feature1Desc}</p>
          </div>

          <div className="bg-[#14141A] border border-white/10 p-8 rounded-3xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent-lime/20 text-accent-lime flex items-center justify-center">
              <Layers size={24} />
            </div>
            <h4 className="text-lg font-bold text-white">{t.feature2Title}</h4>
            <p className="text-sm text-text-muted">{t.feature2Desc}</p>
          </div>

          <div className="bg-[#14141A] border border-white/10 p-8 rounded-3xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h4 className="text-lg font-bold text-white">{t.feature3Title}</h4>
            <p className="text-sm text-text-muted">{t.feature3Desc}</p>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 px-6 border-t border-white/10 text-center text-xs text-text-muted">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-accent-lime" />
          <span className="font-semibold text-white">FlowForge Platform</span>
        </div>
        <p>© 2026 {t.footerRights}</p>
      </footer>

    </div>
  );
}
