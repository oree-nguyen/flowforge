import { useState, useEffect, useRef } from 'react';
import { Globe, ArrowRight, Play, ChevronRight, Cpu, Layers, ShieldCheck } from 'lucide-react';
import { DemoCanvas } from './DemoCanvas';
import { useDemoScroll } from '../hooks/useDemoScroll';

interface LandingPageProps {
  onOpenWorkflow: () => void;
}

export function LandingPage({ onOpenWorkflow }: LandingPageProps) {
  const [lang, setLang] = useState<'en' | 'vi'>('en');
  const demoScrollRef = useRef<HTMLDivElement>(null);
  const { scrollProgress, isVisible } = useDemoScroll(demoScrollRef);

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
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZhcTBxaTFhZWhwZHA3dWxpdnRmcDVwZnkyZXRocDRnZnZhbWVzZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svvjDDy267/giphy.gif',
      prompt: 'Animate character with cinematic dolly zoom motion, golden hour lighting'
    },
    {
      id: 2,
      title: 'Stylized 3D Character Rendering',
      tag: 'AI Image Gen',
      model: 'FLUX.1 Schnell',
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNG1ycnhidTRyZjEwNmNzMTFwbGF6M2NpdTczZGt5cmJtdnhidWFmaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26tn33aiTi1jkl6H6/giphy.gif',
      prompt: 'Skater boy in futuristic Neo Tokyo city, 8k render, octane render style'
    },
    {
      id: 3,
      title: 'Cyberpunk Billboard Generation',
      tag: 'AI Image Gen',
      model: 'Grok / FLUX Pro',
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnZza29rNGlna284d3JqN3lhdWZ3NXgxaGJtN25sd2I3NmFnNXZnZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3vR1v8TjR5r3aM40/giphy.gif',
      prompt: 'Glossy magazine cover shot, neon vibrant colors, direct camera gaze'
    },
    {
      id: 4,
      title: 'Voice Narration & Dubbing Pipeline',
      tag: 'AI Audio Gen',
      model: 'OpenAI TTS-1 HD',
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2JqOW9ldmtscGFxZHMyaWFzaDFoc3gxbGJtNmR0eHkyazlnNnB5MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT9IgzoKnwFNmISR8I/giphy.gif',
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

        {/* --- STICKY SCROLL-DRIVEN WORKFLOW DEMO --- */}
        <div ref={demoScrollRef} className="relative w-full h-[300vh] my-10">
          <div className="sticky top-20 w-full z-30">
            <DemoCanvas scrollProgress={scrollProgress} isVisible={isVisible} />
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
