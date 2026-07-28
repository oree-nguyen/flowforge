import { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  ArrowRight, 
  Play, 
  ChevronRight, 
  Check, 
  Lock, 
  Server, 
  DollarSign, 
  Sparkles, 
  HelpCircle 
} from 'lucide-react';
import { DemoCanvas } from './DemoCanvas';
import { useDemoScroll } from '../hooks/useDemoScroll';

interface LandingPageProps {
  onOpenWorkflow: () => void;
}

export function LandingPage({ onOpenWorkflow }: LandingPageProps) {
  const [lang, setLang] = useState<'en' | 'vi'>('en');
  const [demoCompleted, setDemoCompleted] = useState(false);
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
      
      // Pricing Dictionary (EN)
      pricingTag: '💎 100% Free Forever · Client-Side Architecture',
      pricingTitle: 'Transparent, Zero-Markup Free Platform',
      pricingSubtitle: 'FlowForge is a 100% static client-side Web application running directly in your browser. No backend servers, 100% data privacy, and zero monthly subscription charges.',
      freeForeverBadge: '✨ FREE FOREVER',
      freeForeverPrice: '$0',
      freeForeverPeriod: 'Lifetime / Free Platform',
      freeForeverDesc: 'Full unrestricted access to all FlowForge visual DAG workflow features with zero monthly platform charges.',
      planFeatures: [
        '100% Client-Side Architecture: Runs completely inside your browser with zero backend server dependencies.',
        '100% Privacy & Security: API Keys & workflow data stored locally in browser storage (IndexedDB) or personal Google Drive.',
        'BYOK (Bring Your Own Key): Connect directly to OpenRouter API to access 400+ AI models (ChatGPT, Claude, FLUX, MiniMax, Grok, Llama).',
        'Zero Markup Billing: Pay raw official OpenRouter token prices directly with 0% extra surcharge or platform commission.',
        'Unlimited Nodes & Workflows: Create complex multi-modal execution pipelines without artificial limits or node caps.',
        'Free Export & Import: Full data ownership with JSON export, template sharing, and offline workflow backup.'
      ],
      openRouterTag: 'OpenRouter Integration Partner',
      openRouterTitle: 'Pay Only for What You Generate',
      openRouterDesc: 'Connect your personal OpenRouter API key to stream outputs from top-tier models (OpenAI, Anthropic, Google, FLUX, MiniMax) at exact pay-as-you-go rates.',
      securityPillar1Title: 'Local Browser Execution',
      securityPillar1Desc: 'All workflow execution logic runs inside your local browser runtime. No external servers ever execute or intercept your nodes.',
      securityPillar2Title: 'Zero-Knowledge Privacy',
      securityPillar2Desc: 'Your OpenRouter API keys never touch our servers. Requests are sent straight from your Browser to OpenRouter endpoints via HTTPS.',
      securityPillar3Title: 'Direct API Settlement',
      securityPillar3Desc: 'No monthly $20–$50 SaaS subscriptions. Deposit credits directly on OpenRouter and pay pennies per generation.',
      pricingCta: 'Launch Workflow Editor Now',

      // FAQ Dictionary (EN)
      faqTitle: 'Frequently Asked Questions',
      faqSubtitle: 'Everything you need to know about FlowForge pricing, security, and OpenRouter integration.',
      faqs: [
        {
          q: 'Why is FlowForge 100% Free Forever?',
          a: 'FlowForge is built as a static Client-Side Web UI. Because we do not run expensive backend server infrastructure or store user database clusters, we can offer the full visual workflow builder 100% free forever to the community.'
        },
        {
          q: 'Are my API Keys and workflows safe?',
          a: 'Yes, 100% safe. All API keys and workflow graphs are stored exclusively in your browser (IndexedDB / LocalStorage) or your personal Google Drive. Zero data or keys are ever sent to or stored on FlowForge servers.'
        },
        {
          q: 'How am I billed for AI generations?',
          a: 'You create a free account at OpenRouter.ai, generate an API Key, and paste it into FlowForge settings. You are only billed by OpenRouter for the exact tokens used per node execution at official raw costs.'
        },
        {
          q: 'Can I use FlowForge offline?',
          a: 'Yes! You can save FlowForge as a PWA / Local HTML application and design workflow DAGs completely offline. Internet access is only required when triggering API nodes to generate content.'
        }
      ]
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

      // Pricing Dictionary (VI)
      pricingTag: '💎 Miễn Phí Vô Thời Hạn · Kiến Trúc Client-Side',
      pricingTitle: 'Minh Bạch Tuyệt Đối - Platform Miễn Phí 100%',
      pricingSubtitle: 'FlowForge là ứng dụng Web UI tĩnh chạy 100% trực tiếp trên trình duyệt máy tính của bạn. Không phí đăng ký, không thẻ tín dụng, không phụ thu chênh lệch.',
      freeForeverBadge: '✨ MIỄN PHÍ VÔ THỜI HẠN',
      freeForeverPrice: '$0',
      freeForeverPeriod: 'Trọn Đời / Miễn Phí Platform',
      freeForeverDesc: 'Toàn quyền sử dụng đầy đủ mọi tính năng visual DAG builder mà không tốn chi phí duy trì nền tảng hàng tháng.',
      planFeatures: [
        'Cơ chế Client-Use 100%: Chạy hoàn toàn trực tiếp trên trình duyệt máy tính người dùng, không cần server backend trung gian.',
        'Đảm bảo 100% Bảo Mật & Riêng Tư: API Keys & dữ liệu quy trình lưu trữ cục bộ (IndexedDB/LocalStorage) hoặc Google Drive cá nhân của bạn.',
        'BYOK (Bring Your Own Key): Kết nối đối tác OpenRouter để sử dụng 400+ model AI hàng đầu (ChatGPT, Claude, FLUX, MiniMax, Grok...).',
        'Không chênh lệch giá (0% Markup): Thanh toán chi phí token sinh AI trực tiếp theo đúng bảng giá gốc niêm yết của OpenRouter.',
        'Vô hạn Node & Quy trình: Xây dựng các chuỗi sinh AI đa phương thức phức tạp mà không bị bóp tính năng hay giới hạn số node.',
        'Export / Import Tự Do: Toàn quyền sở hữu dữ liệu, dễ dàng xuất/nhập file JSON quy trình lưu trữ về máy cá nhân.'
      ],
      openRouterTag: 'Đối Tác Tích Hợp OpenRouter',
      openRouterTitle: 'Dùng Bao Nhiêu - Trả Bấy Nhiêu',
      openRouterDesc: 'Chỉ cần nhập OpenRouter API Key cá nhân để stream dữ liệu từ các model cao cấp (OpenAI, Anthropic, Google, FLUX, MiniMax) theo đúng giá gốc.',
      securityPillar1Title: 'Thực Thi Trực Tiếp Trên Trình Duyệt',
      securityPillar1Desc: 'Toàn bộ logic DAG execution được xử lý trực tiếp trên browser của bạn. Không có server trung gian nào can thiệp hay đọc dữ liệu.',
      securityPillar2Title: 'Bảo Mật API Key Tuyệt Đối',
      securityPillar2Desc: 'API Key của bạn không bao giờ gửi tới server FlowForge. Request được gửi trực tiếp từ Browser tới OpenRouter API qua HTTPS mã hóa.',
      securityPillar3Title: 'Không Phí Duy Trì Hàng Tháng',
      securityPillar3Desc: 'Loại bỏ hoàn toàn các gói cước Subscription đắt đỏ ($20-$50/tháng). Nạp bao nhiêu dùng bấy nhiêu trực tiếp tại OpenRouter.',
      pricingCta: 'Mở Workflow Editor Ngay',

      // FAQ Dictionary (VI)
      faqTitle: 'Câu Hỏi Thường Gặp (FAQ)',
      faqSubtitle: 'Giải đáp chi tiết về cơ chế miễn phí, bảo mật và tích hợp OpenRouter trên FlowForge.',
      faqs: [
        {
          q: 'Tại sao FlowForge hoàn toàn miễn phí vô thời hạn?',
          a: 'FlowForge được xây dựng theo mô hình Client-Side Web UI tĩnh. Chúng tôi không phải gánh chi phí duy trì máy chủ đắt đỏ hay lưu trữ database người dùng, vì vậy chúng tôi cam kết cung cấp giao diện visual workflow builder hoàn toàn miễn phí trọn đời cho cộng đồng.'
        },
        {
          q: 'Dữ liệu và API Key của tôi có an toàn không?',
          a: 'Hoàn toàn an toàn 100%. Mọi API Key và sơ đồ quy trình chỉ lưu trữ trong trình duyệt (LocalStorage / IndexedDB) hoặc Google Drive cá nhân của bạn. Không có bất kỳ server trung gian nào thu thập dữ liệu.'
        },
        {
          q: 'Tôi nạp tiền và trả phí AI như thế nào?',
          a: 'Bạn tạo tài khoản miễn phí tại OpenRouter.ai, lấy API Key và dán vào cài đặt FlowForge. Chi phí chỉ tính khi bạn bấm chạy node sinh AI, trừ trực tiếp vào số dư OpenRouter theo đúng bảng giá gốc niêm yết (FlowForge không thu thêm bất kỳ % phí nào).'
        },
        {
          q: 'Tôi có thể sử dụng ngoại tuyến (Offline) không?',
          a: 'Có! Bạn có thể lưu ứng dụng dưới dạng PWA/Local HTML và thiết kế sơ đồ quy trình hoàn toàn offline. Kết nối mạng chỉ cần thiết khi thực hiện gọi API node để sinh nội dung.'
        }
      ]
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
    <div className="bg-[#0A0A0C] text-white font-sans selection:bg-accent-lime selection:text-black" style={{ overflowX: 'clip' }}>
      
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
      </section>

      {/* Sticky section outside the hero section for proper sticky behavior */}
      <div ref={demoScrollRef} className="relative w-full" style={{ height: '300vh' }}>
        <div className="sticky top-20 px-6 max-w-7xl mx-auto z-30 pt-4">
          {/* Scroll hint + progress bar */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/40 font-mono tracking-wide">
              ↓ Scroll to simulate workflow building
            </p>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-accent-lime rounded-full transition-all duration-100"
                  style={{ width: `${scrollProgress * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-white/40 font-mono w-8 text-right">
                {Math.round(scrollProgress * 100)}%
              </span>
            </div>
          </div>
          <DemoCanvas 
            scrollProgress={scrollProgress} 
            isVisible={isVisible} 
            onRun={() => setDemoCompleted(true)} 
          />
        </div>
      </div>

      {/* --- CONTENT BELOW DEMO (UNLOCKED ONLY AFTER DEMO RUN) --- */}
      <div className={`transition-all duration-1000 ease-in-out ${demoCompleted ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden pointer-events-none'}`}>

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
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full text-xs font-semibold text-accent-lime">
                    {card.tag}
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full text-xs font-mono text-white/70">
                    {card.model}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent-lime transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs font-mono text-text-muted bg-black/40 border border-white/5 p-3 rounded-xl">
                  💬 "{card.prompt}"
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-lime/10 border border-accent-lime/30 text-accent-lime text-xs font-medium mb-4">
            {t.pricingTag}
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
            {t.pricingTitle}
          </h2>
          <p className="text-text-muted text-base leading-relaxed">
            {t.pricingSubtitle}
          </p>
        </div>

        {/* Main Pricing Card & Security Pillars Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
          {/* Main Lifetime Free Card */}
          <div className="lg:col-span-7 bg-[#14141A] border-2 border-accent-lime/40 hover:border-accent-lime rounded-3xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(132,204,22,0.1)] flex flex-col justify-between transition-all">
            <div className="absolute top-0 right-0 bg-accent-lime text-black px-4 py-1.5 rounded-bl-2xl text-xs font-extrabold tracking-wider">
              {t.freeForeverBadge}
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl md:text-6xl font-black text-white">{t.freeForeverPrice}</span>
                <span className="text-sm font-semibold text-accent-lime">{t.freeForeverPeriod}</span>
              </div>
              <p className="text-sm text-text-muted mb-8 leading-relaxed">
                {t.freeForeverDesc}
              </p>

              <div className="space-y-4 mb-8">
                {t.planFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent-lime/20 text-accent-lime flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={13} />
                    </div>
                    <span className="text-sm text-white/90 leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onOpenWorkflow}
              className="w-full py-4 rounded-2xl bg-accent-lime text-black font-bold text-sm hover:brightness-110 shadow-[0_0_25px_rgba(132,204,22,0.4)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{t.pricingCta}</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Security & OpenRouter Integration Breakdown */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
            <div className="bg-[#14141A] border border-white/10 p-6 rounded-3xl flex items-start gap-4 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Server size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">{t.securityPillar1Title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{t.securityPillar1Desc}</p>
              </div>
            </div>

            <div className="bg-[#14141A] border border-white/10 p-6 rounded-3xl flex items-start gap-4 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Lock size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">{t.securityPillar2Title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{t.securityPillar2Desc}</p>
              </div>
            </div>

            <div className="bg-[#14141A] border border-white/10 p-6 rounded-3xl flex items-start gap-4 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <DollarSign size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">{t.securityPillar3Title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{t.securityPillar3Desc}</p>
              </div>
            </div>

            {/* OpenRouter Banner Box */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 p-6 rounded-3xl">
              <div className="flex items-center gap-2 text-xs font-mono text-purple-300 mb-2">
                <Sparkles size={14} />
                <span>{t.openRouterTag}</span>
              </div>
              <h4 className="text-base font-bold text-white mb-1">{t.openRouterTitle}</h4>
              <p className="text-xs text-text-muted leading-relaxed">{t.openRouterDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section id="faq" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium mb-4">
            <HelpCircle size={14} />
            <span>FAQ</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
            {t.faqTitle}
          </h2>
          <p className="text-text-muted text-base">
            {t.faqSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {t.faqs.map((faq, idx) => (
            <div key={idx} className="bg-[#14141A] border border-white/10 p-8 rounded-3xl hover:border-accent-lime/40 transition-colors flex flex-col gap-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-accent-lime font-mono text-sm">0{idx + 1}.</span>
                {faq.q}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed pl-6 border-l-2 border-white/10">
                {faq.a}
              </p>
            </div>
          ))}
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

    </div>
  );
}
