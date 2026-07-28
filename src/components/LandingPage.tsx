import { useState, useEffect } from 'react';
import { 
  Globe, 
  ArrowRight, 
  ChevronRight, 
  Check, 
  Lock, 
  Server, 
  DollarSign, 
  Sparkles, 
  HelpCircle,
  Cpu,
  Layers,
  ShieldCheck,
  Copy,
  CheckCircle2,
  Workflow,
  Clapperboard,
  Camera,
  MessageSquareCode,
  ArrowUpRight,
  Terminal
} from 'lucide-react';
import { DemoCanvas } from './DemoCanvas';

interface LandingPageProps {
  onOpenWorkflow: () => void;
}

export function LandingPage({ onOpenWorkflow }: LandingPageProps) {
  const [lang, setLang] = useState<'en' | 'vi'>('en');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Tab State: 'home' | 'features' | 'workflows' | 'prompts' | 'pricing' | 'faq'
  const [activeTab, setActiveTab] = useState<
    'home' | 'features' | 'workflows' | 'prompts' | 'pricing' | 'faq'
  >(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    if (['features', 'workflows', 'prompts', 'pricing', 'faq'].includes(hash)) {
      return hash as any;
    }
    return 'home';
  });

  // Listen to hash changes for browser back/forward and direct links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (['features', 'workflows', 'prompts', 'pricing', 'faq'].includes(hash)) {
        setActiveTab(hash as any);
      } else if (hash === '' || hash === 'home' || hash === 'landing') {
        setActiveTab('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: 'home' | 'features' | 'workflows' | 'prompts' | 'pricing' | 'faq') => {
    setActiveTab(tab);
    window.location.hash = `#/${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyPrompt = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Multi-language text dictionary
  const t = {
    en: {
      navHome: 'Overview',
      navFeatures: 'Features',
      navWorkflows: 'Workflows',
      navPrompts: 'Prompts',
      navPricing: 'Pricing',
      navFAQ: 'FAQ',
      getStarted: 'Open Workflow',
      heroTag: '✨ Next-Gen Visual AI Orchestration',
      heroTitle: 'Build Complex Multi-Modal AI Workflows with FlowForge',
      heroSubtitle: 'Connect 400+ AI models including ChatGPT, Grok, FLUX, and MiniMax into seamless visual DAG execution nodes.',
      openAppBtn: 'Open Workflow Editor',
      demoTitle: 'Interactive Live Workflow Canvas',
      demoSubtitle: 'Drag nodes around, experiment with connections, and watch real-time AI pipeline execution.',
      feature1Title: '400+ OpenRouter AI Models',
      feature1Desc: 'Access LLMs, FLUX Image Gen, and MiniMax Video Gen in a unified visual node builder.',
      feature2Title: 'Visual DAG Execution Engine',
      feature2Desc: 'Topological execution engine processes input data through custom node dependencies.',
      feature3Title: 'Cloud & Local Auto-Sync',
      feature3Desc: 'Sync outputs automatically to Google Drive, IndexedDB, or local file system.',
      workflowsTag: '🚀 Pre-Built DAG Templates',
      workflowsTitle: 'Production-Ready AI Workflow Templates',
      workflowsSubtitle: 'Explore pre-configured DAG execution pipelines. Clone and launch directly into the Workflow Canvas in 1 click.',
      featuresTag: '⚡ Platform Capabilities',
      featuresTitle: 'Engineered for High-Performance AI Pipelines',
      featuresSubtitle: 'Explore the full power of FlowForge visual DAG engine, client-side security, and multi-modal integration.',
      promptsTag: '💬 Prompt Library & Showcase',
      promptsTitle: 'Real-Time AI Generation Showcase',
      promptsSubtitle: 'Explore real-world prompt examples and multi-modal output streaming across top-tier AI models.',
      copyPromptBtn: 'Copy Prompt',
      copiedPromptBtn: 'Copied!',
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
        'BYOK (Bring Your Own Key): Connect directly to OpenRouter API to access 400+ AI models.',
        'Zero Markup Billing: Pay raw official OpenRouter token prices directly.',
        'Unlimited Nodes & Workflows: Create complex multi-modal execution pipelines.',
        'Free Export & Import: Full data ownership with JSON export.'
      ],
      openRouterTag: 'OpenRouter Integration Partner',
      openRouterTitle: 'Pay Only for What You Generate',
      openRouterDesc: 'Connect your personal OpenRouter API key to stream outputs from top-tier models at exact pay-as-you-go rates.',
      securityPillar1Title: 'Local Browser Execution',
      securityPillar1Desc: 'All workflow execution logic runs inside your local browser runtime.',
      securityPillar2Title: 'Zero-Knowledge Privacy',
      securityPillar2Desc: 'Your OpenRouter API keys never touch our servers.',
      securityPillar3Title: 'Direct API Settlement',
      securityPillar3Desc: 'No monthly subscriptions. Pay pennies per generation directly on OpenRouter.',
      pricingCta: 'Launch Workflow Editor Now',
      faqTitle: 'Frequently Asked Questions',
      faqSubtitle: 'Everything you need to know about FlowForge pricing, security, and OpenRouter integration.',
      faqs: [
        {
          q: 'Why is FlowForge 100% Free Forever?',
          a: 'FlowForge is built as a static Client-Side Web UI. Because we do not run expensive backend server infrastructure, we can offer the full visual workflow builder 100% free forever.'
        },
        {
          q: 'Are my API Keys and workflows safe?',
          a: 'Yes, 100% safe. All API keys and workflow graphs are stored exclusively in your browser (IndexedDB / LocalStorage).'
        },
        {
          q: 'How am I billed for AI generations?',
          a: 'You create a free account at OpenRouter.ai, generate an API Key, and paste it into FlowForge settings. You are only billed by OpenRouter for the exact tokens used.'
        },
        {
          q: 'Can I use FlowForge offline?',
          a: 'Yes! You can save FlowForge as a PWA / Local HTML application and design workflow DAGs completely offline.'
        }
      ],
      footerRights: 'FlowForge Inc. All rights reserved.',
    },
    vi: {
      navHome: 'Tổng Quan',
      navFeatures: 'Tính năng',
      navWorkflows: 'Quy trình mẫu',
      navPrompts: 'Thư viện Prompt',
      navPricing: 'Bảng giá',
      navFAQ: 'Hỏi đáp',
      getStarted: 'Mở Workflow',
      heroTag: '✨ Nền tảng điều phối AI trực quan thế hệ mới',
      heroTitle: 'Xây dựng quy trình AI Đa phương thức phức tạp với FlowForge',
      heroSubtitle: 'Kết nối 400+ model AI như ChatGPT, Grok, FLUX, MiniMax thành các node thực thi dạng đồ thị trực quan.',
      openAppBtn: 'Mở Workflow Editor',
      demoTitle: 'Canvas Demo Trực Quan Thời Gian Thực',
      demoSubtitle: 'Tự do di chuyển node, thử nghiệm dây nối và theo dõi quy trình thực thi AI pipeline tự động.',
      feature1Title: '400+ Model AI OpenRouter',
      feature1Desc: 'Kết nối LLM, FLUX Image Gen, MiniMax Video Gen trên cùng một canvas trực quan.',
      feature2Title: 'Động cơ Thực thi DAG Trực quan',
      feature2Desc: 'Xử lý quy trình theo thứ tự phụ thuộc topologically giữa các node linh hoạt.',
      feature3Title: 'Đồng bộ Tự động Cloud & Local',
      feature3Desc: 'Lưu trữ output tự động về Google Drive, IndexedDB hoặc máy cá nhân.',
      workflowsTag: '🚀 Thư Viện Mẫu Đồ Thị AI',
      workflowsTitle: 'Quy Trình AI Thiết Kế Sẵn Chuẩn Sản Xuất',
      workflowsSubtitle: 'Khám phá các chuỗi AI đã được cấu hình tối ưu. Mở trực tiếp vào Canvas làm việc chỉ với 1-click.',
      featuresTag: '⚡ Năng Lực Nền Tảng',
      featuresTitle: 'Thiết Kế Cho Chuỗi AI Hiệu Năng Cao',
      featuresSubtitle: 'Khám phá trọn vẹn sức mạnh của động cơ DAG trực quan, kiến trúc bảo mật Client-Side và kết nối đa phương thức.',
      promptsTag: '💬 Thư Viện Prompt & Showcase',
      promptsTitle: 'Bộ Sưu Tập Mẫu Prompt & Kết Quả Sinh AI',
      promptsSubtitle: 'Tham khảo các mẫu Prompt thực tế và luồng stream dữ liệu giữa các model AI hàng đầu.',
      copyPromptBtn: 'Sao chép Prompt',
      copiedPromptBtn: 'Đã sao chép!',
      pricingTag: '💎 Miễn Phí Vô Thời Hạn · Kiến Trúc Client-Side',
      pricingTitle: 'Minh Bạch Tuyệt Đối - Platform Miễn Phí 100%',
      pricingSubtitle: 'FlowForge là ứng dụng Web UI tĩnh chạy 100% trực tiếp trên trình duyệt máy tính của bạn. Không phí đăng ký, không thẻ tín dụng, không phụ thu chênh lệch.',
      freeForeverBadge: '✨ MIỄN PHÍ VÔ THỜI HẠN',
      freeForeverPrice: '$0',
      freeForeverPeriod: 'Trọn Đời / Miễn Phí Platform',
      freeForeverDesc: 'Toàn quyền sử dụng đầy đủ mọi tính năng visual DAG builder mà không tốn chi phí duy trì nền tảng hàng tháng.',
      planFeatures: [
        'Cơ chế Client-Use 100%: Chạy hoàn toàn trực tiếp trên trình duyệt, không cần server backend trung gian.',
        'Đảm bảo 100% Bảo Mật & Riêng Tư: API Keys & dữ liệu quy trình lưu trữ cục bộ.',
        'BYOK (Bring Your Own Key): Kết nối đối tác OpenRouter để sử dụng 400+ model AI.',
        'Không chênh lệch giá (0% Markup): Thanh toán chi phí token sinh AI trực tiếp theo bảng giá gốc.',
        'Vô hạn Node & Quy trình: Xây dựng các chuỗi sinh AI đa phương thức phức tạp.',
        'Export / Import Tự Do: Toàn quyền sở hữu dữ liệu cá nhân.'
      ],
      openRouterTag: 'Đối Tác Tích Hợp OpenRouter',
      openRouterTitle: 'Dùng Bao Nhiêu - Trả Bấy Nhiêu',
      openRouterDesc: 'Chỉ cần nhập OpenRouter API Key cá nhân để stream dữ liệu từ các model cao cấp theo đúng giá gốc.',
      securityPillar1Title: 'Thực Thi Trực Tiếp Trên Trình Duyệt',
      securityPillar1Desc: 'Toàn bộ logic DAG execution được xử lý trực tiếp trên browser của bạn.',
      securityPillar2Title: 'Bảo Mật API Key Tuyệt Đối',
      securityPillar2Desc: 'API Key của bạn không bao giờ gửi tới server FlowForge.',
      securityPillar3Title: 'Không Phí Duy Trì Hàng Tháng',
      securityPillar3Desc: 'Loại bỏ hoàn toàn các gói cước Subscription. Nạp bao nhiêu dùng bấy nhiêu.',
      pricingCta: 'Mở Workflow Editor Ngay',
      faqTitle: 'Câu Hỏi Thường Gặp (FAQ)',
      faqSubtitle: 'Giải đáp chi tiết về cơ chế miễn phí, bảo mật và tích hợp OpenRouter trên FlowForge.',
      faqs: [
        {
          q: 'Tại sao FlowForge hoàn toàn miễn phí vô thời hạn?',
          a: 'FlowForge được xây dựng theo mô hình Client-Side Web UI tĩnh. Chúng tôi không phải gánh chi phí duy trì máy chủ đắt đỏ, vì vậy chúng tôi cam kết miễn phí trọn đời.'
        },
        {
          q: 'Dữ liệu và API Key của tôi có an toàn không?',
          a: 'Hoàn toàn an toàn 100%. Mọi API Key và sơ đồ quy trình chỉ lưu trữ trong trình duyệt (LocalStorage / IndexedDB).'
        },
        {
          q: 'Tôi nạp tiền và trả phí AI như thế nào?',
          a: 'Bạn tạo tài khoản miễn phí tại OpenRouter.ai, lấy API Key và dán vào cài đặt FlowForge. Chi phí chỉ tính khi bạn bấm chạy node sinh AI.'
        },
        {
          q: 'Tôi có thể sử dụng ngoại tuyến (Offline) không?',
          a: 'Có! Bạn có thể lưu ứng dụng dưới dạng PWA/Local HTML và thiết kế sơ đồ quy trình hoàn toàn offline.'
        }
      ],
      footerRights: 'FlowForge Inc. Bảo lưu mọi quyền.',
    }
  }[lang];

  const showcaseCards = [
    {
      id: 1,
      title: lang === 'vi' ? 'Chuỗi Sinh Video Điển Hình AI' : 'Cinematic Video Generation Pipeline',
      tag: 'Text + Image → Video',
      model: 'Google Veo 3.1 Pro + Gemini 3.1',
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZydnA5NDFhcmgxNmR4cGx1OW5pNmhvaGdyZmVxeXJscWptd3c4ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPnAiaMCws8nOsE/giphy.gif',
      prompt: 'A futuristic cybernetic character walking down a rainy neon-lit Tokyo street, 8k resolution cinematic camera movement.'
    },
    {
      id: 2,
      title: lang === 'vi' ? 'Chuỗi Chụp Ảnh Sản Phẩm FLUX Studio' : 'FLUX Product Photography Workflow',
      tag: 'Image → Image AI',
      model: 'FLUX 1.1 Pro Studio',
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmQwaHZxcWFzcXpzMHg1ZjBrdnlhNzN2ZGNrNmFwbWdzcW9sdnFvaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26tP3M3i03hoIylzm/giphy.gif',
      prompt: 'Luxury perfume bottle on dark reflective marble, soft rim lighting, floating golden dust particles, hyper-realistic 3D render.'
    },
    {
      id: 3,
      title: lang === 'vi' ? 'Tạo Bìa Tạp Chí & Stylized Visual' : 'Stylized Magazine Cover Pipeline',
      tag: 'Text → FLUX Image',
      model: 'FLUX Schnell + Claude 3.5',
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnZza29rNGlna284d3JqN3lhdWZ3NXgxaGJtN25sd2I3NmFnNXZnZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3vR1v8TjR5r3aM40/giphy.gif',
      prompt: 'Glossy high-fashion magazine cover shot, neon vibrant color grading, direct camera gaze, 85mm portrait lens.'
    },
    {
      id: 4,
      title: lang === 'vi' ? 'Chuỗi Đọc Thoại & Lồng Tiếng AI' : 'Voice Narration & Dubbing Pipeline',
      tag: 'Text → Audio AI',
      model: 'OpenAI TTS-1 HD',
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2JqOW9ldmtscGFxZHMyaWFzaDFoc3gxbGJtNmR0eHkyazlnNnB5MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT9IgzoKnwFNmISR8I/giphy.gif',
      prompt: 'Deep cinematic documentary voiceover with warm acoustic resonance and crisp dynamic clarity.'
    }
  ];

  const workflowTemplates = [
    {
      id: 'template_1',
      title: lang === 'vi' ? 'Phim Ngắn AI Đa Phương Thức' : 'Cinematic Character Movie Pipeline',
      category: 'Multi-Modal Video',
      icon: Clapperboard,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      desc: lang === 'vi' 
        ? 'Kết hợp Input Text + Input Image vào Gemini 3.1 Flash để sinh Prompt Ảnh, sau đó nối vào Google Veo 3.1 Pro sinh Video HD.' 
        : 'Connects Input Text + Image into Gemini 3.1 Synthesis to generate character keyframes, then streams into Google Veo 3.1 Pro.',
      nodesCount: 6,
      models: ['Gemini 3.1 Flash', 'Google Veo 3.1']
    },
    {
      id: 'template_2',
      title: lang === 'vi' ? 'Chụp Ảnh Studio Sản Phẩm FLUX' : 'FLUX Studio Product Renderer',
      category: 'Image Gen',
      icon: Camera,
      color: 'bg-accent-lime/20 text-accent-lime border-accent-lime/30',
      desc: lang === 'vi'
        ? 'Quy trình tạo bối cảnh Studio chuyên nghiệp cho ảnh sản phẩm thô bằng FLUX 1.1 Pro và GPT-4o Prompt Enhancer.'
        : 'Professional studio backdrop environment generator for raw product shots using FLUX 1.1 Pro and GPT-4o Enhancer.',
      nodesCount: 4,
      models: ['FLUX 1.1 Pro', 'GPT-4o']
    },
    {
      id: 'template_3',
      title: lang === 'vi' ? 'Multi-Agent Write & Cover Art' : 'Multi-Agent Story & Art Workflow',
      category: 'Text & Image',
      icon: MessageSquareCode,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      desc: lang === 'vi'
        ? 'Claude 3.5 Sonnet đóng vai trò biên kịch tạo cốt truyện, tự động chuyển hướng Prompt tới FLUX Schnell tạo ảnh minh họa.'
        : 'Claude 3.5 Sonnet acts as story writer, automatically piping visual descriptions into FLUX Schnell cover generator.',
      nodesCount: 5,
      models: ['Claude 3.5 Sonnet', 'FLUX Schnell']
    },
    {
      id: 'template_4',
      title: lang === 'vi' ? 'Biên Tập & Trích Xuất File Tài Liệu' : 'PDF Document Extractor & Summarizer',
      category: 'Document AI',
      icon: Terminal,
      color: 'bg-orange-500/20 text-orange-400 border-orange-400/30',
      desc: lang === 'vi'
        ? 'Đọc dữ liệu file PDF/Tài liệu thô, tự động trích xuất bảng biểu và tóm tắt thành văn bản báo cáo chuyên nghiệp.'
        : 'Parse raw PDF documents, extract tables, and automatically synthesize concise executive summary reports.',
      nodesCount: 3,
      models: ['PDF Extractor', 'OpenAI GPT-4o Mini']
    }
  ];

  return (
    <div className="bg-[#0A0A0C] text-white font-sans selection:bg-accent-lime selection:text-black min-h-screen">
      
      {/* TOP NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0C]/90 backdrop-blur-xl border-b border-white/10 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleTabChange('home')}>
          <div className="w-8 h-8 rounded-xl bg-accent-lime flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(132,204,22,0.4)]">
            ✦
          </div>
          <span className="text-lg font-bold tracking-tight text-white">FlowForge</span>
        </div>

        {/* TAB BUTTONS */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#14141A] p-1.5 rounded-2xl border border-white/10">
          <button onClick={() => handleTabChange('home')} className={`px-3.5 py-1.5 rounded-xl text-xs transition-all ${activeTab === 'home' ? 'bg-accent-lime text-black font-bold shadow-[0_0_15px_rgba(132,204,22,0.4)]' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>{t.navHome}</button>
          <button onClick={() => handleTabChange('features')} className={`px-3.5 py-1.5 rounded-xl text-xs transition-all ${activeTab === 'features' ? 'bg-accent-lime text-black font-bold shadow-[0_0_15px_rgba(132,204,22,0.4)]' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>{t.navFeatures}</button>
          <button onClick={() => handleTabChange('workflows')} className={`px-3.5 py-1.5 rounded-xl text-xs transition-all ${activeTab === 'workflows' ? 'bg-accent-lime text-black font-bold shadow-[0_0_15px_rgba(132,204,22,0.4)]' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>{t.navWorkflows}</button>
          <button onClick={() => handleTabChange('prompts')} className={`px-3.5 py-1.5 rounded-xl text-xs transition-all ${activeTab === 'prompts' ? 'bg-accent-lime text-black font-bold shadow-[0_0_15px_rgba(132,204,22,0.4)]' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>{t.navPrompts}</button>
          <button onClick={() => handleTabChange('pricing')} className={`px-3.5 py-1.5 rounded-xl text-xs transition-all ${activeTab === 'pricing' ? 'bg-accent-lime text-black font-bold shadow-[0_0_15px_rgba(132,204,22,0.4)]' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>{t.navPricing}</button>
          <button onClick={() => handleTabChange('faq')} className={`px-3.5 py-1.5 rounded-xl text-xs transition-all ${activeTab === 'faq' ? 'bg-accent-lime text-black font-bold shadow-[0_0_15px_rgba(132,204,22,0.4)]' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>{t.navFAQ}</button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setLang(lang === 'en' ? 'vi' : 'en')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-white/15 rounded-xl hover:border-white/40 text-text-muted hover:text-white transition-all bg-white/5">
            <Globe size={13} />
            <span>{lang.toUpperCase()}</span>
          </button>
          <button onClick={onOpenWorkflow} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent-lime text-black font-semibold text-xs hover:brightness-110 shadow-[0_0_20px_rgba(132,204,22,0.4)] transition-all hover:scale-105 active:scale-95">
            <span>{t.getStarted}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* PAGE CONTENT BODY */}
      <main className="pt-28 pb-20">
        
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div>
            <section className="relative pt-8 pb-16 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
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
                <button 
                  onClick={() => handleTabChange('workflows')}
                  className="px-6 py-3.5 rounded-2xl border border-white/20 hover:border-white/40 text-white font-semibold text-sm hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <Workflow size={15} />
                  <span>{t.navWorkflows}</span>
                </button>
              </div>
            </section>

            <section className="px-6 max-w-7xl mx-auto mb-20">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-2">
                  {t.demoTitle}
                </h2>
                <p className="text-xs md:text-sm text-text-muted">
                  {t.demoSubtitle}
                </p>
              </div>

              <DemoCanvas scrollProgress={1} isVisible={true} />
            </section>

            <section className="px-6 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div 
                  onClick={() => handleTabChange('features')}
                  className="bg-[#14141A] border border-white/10 hover:border-accent-lime/50 p-8 rounded-3xl flex flex-col gap-4 cursor-pointer group transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Cpu size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white flex items-center justify-between">
                    <span>{t.feature1Title}</span>
                    <ArrowUpRight size={16} className="opacity-40 group-hover:opacity-100 group-hover:text-accent-lime transition-all" />
                  </h4>
                  <p className="text-sm text-text-muted">{t.feature1Desc}</p>
                </div>

                <div 
                  onClick={() => handleTabChange('workflows')}
                  className="bg-[#14141A] border border-white/10 hover:border-accent-lime/50 p-8 rounded-3xl flex flex-col gap-4 cursor-pointer group transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-accent-lime/20 text-accent-lime flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Layers size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white flex items-center justify-between">
                    <span>{t.feature2Title}</span>
                    <ArrowUpRight size={16} className="opacity-40 group-hover:opacity-100 group-hover:text-accent-lime transition-all" />
                  </h4>
                  <p className="text-sm text-text-muted">{t.feature2Desc}</p>
                </div>

                <div 
                  onClick={() => handleTabChange('pricing')}
                  className="bg-[#14141A] border border-white/10 hover:border-accent-lime/50 p-8 rounded-3xl flex flex-col gap-4 cursor-pointer group transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white flex items-center justify-between">
                    <span>{t.feature3Title}</span>
                    <ArrowUpRight size={16} className="opacity-40 group-hover:opacity-100 group-hover:text-accent-lime transition-all" />
                  </h4>
                  <p className="text-sm text-text-muted">{t.feature3Desc}</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: FEATURES */}
        {activeTab === 'features' && (
          <section className="px-6 max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-medium mb-4">
                {t.featuresTag}
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                {t.featuresTitle}
              </h2>
              <p className="text-text-muted text-base">
                {t.featuresSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-[#14141A] border border-white/10 p-8 rounded-3xl flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Cpu size={24} />
                </div>
                <h4 className="text-xl font-bold text-white">{t.feature1Title}</h4>
                <p className="text-sm text-text-muted leading-relaxed">{t.feature1Desc}</p>
              </div>

              <div className="bg-[#14141A] border border-white/10 p-8 rounded-3xl flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-lime/20 text-accent-lime flex items-center justify-center">
                  <Layers size={24} />
                </div>
                <h4 className="text-xl font-bold text-white">{t.feature2Title}</h4>
                <p className="text-sm text-text-muted leading-relaxed">{t.feature2Desc}</p>
              </div>

              <div className="bg-[#14141A] border border-white/10 p-8 rounded-3xl flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="text-xl font-bold text-white">{t.feature3Title}</h4>
                <p className="text-sm text-text-muted leading-relaxed">{t.feature3Desc}</p>
              </div>
            </div>

            <div className="bg-[#14141A] border border-white/10 p-8 md:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                  {lang === 'vi' ? 'Sẵn sàng trải nghiệm ngay trên Trình duyệt?' : 'Ready to Build Your AI Pipeline?'}
                </h3>
                <p className="text-sm text-text-muted max-w-xl">
                  {lang === 'vi' ? 'Không cần cài đặt, không cần đăng ký tài khoản server. Mở Canvas và bắt đầu sáng tạo ngay lập tức.' : 'Zero installation required. Open the visual workflow canvas and start building immediately.'}
                </p>
              </div>
              <button
                onClick={onOpenWorkflow}
                className="px-8 py-4 rounded-2xl bg-accent-lime text-black font-bold text-sm hover:brightness-110 shadow-[0_0_30px_rgba(132,204,22,0.5)] transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                {t.openAppBtn}
              </button>
            </div>
          </section>
        )}

        {/* TAB 3: WORKFLOWS */}
        {activeTab === 'workflows' && (
          <section className="px-6 max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-lime/10 border border-accent-lime/30 text-accent-lime text-xs font-medium mb-4">
                {t.workflowsTag}
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                {t.workflowsTitle}
              </h2>
              <p className="text-text-muted text-base">
                {t.workflowsSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {workflowTemplates.map((template) => {
                const IconComp = template.icon;
                return (
                  <div 
                    key={template.id}
                    className="bg-[#14141A] border border-white/10 hover:border-accent-lime/50 p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between group hover:shadow-[0_0_40px_rgba(132,204,22,0.15)]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${template.color}`}>
                          <IconComp size={24} />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/70">
                          {template.nodesCount} Nodes
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-accent-lime uppercase tracking-wider mb-2 block">
                        {template.category}
                      </span>
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-accent-lime transition-colors">
                        {template.title}
                      </h3>
                      <p className="text-sm text-text-muted leading-relaxed mb-6">
                        {template.desc}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {template.models.map((m, idx) => (
                          <span key={idx} className="text-[10px] font-mono bg-black/60 border border-white/10 px-2.5 py-1 rounded-lg text-white/60">
                            {m}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={onOpenWorkflow}
                        className="px-4 py-2 rounded-xl bg-accent-lime/20 border border-accent-lime/40 text-accent-lime font-bold text-xs hover:bg-accent-lime hover:text-black transition-all flex items-center gap-1.5"
                      >
                        <span>{lang === 'vi' ? 'Mở Template' : 'Use Template'}</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 4: PROMPTS */}
        {activeTab === 'prompts' && (
          <section className="px-6 max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-medium mb-4">
                {t.promptsTag}
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                {t.promptsTitle}
              </h2>
              <p className="text-text-muted text-base">
                {t.promptsSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {showcaseCards.map((card) => (
                <div 
                  key={card.id}
                  className="bg-[#14141A] border border-white/10 hover:border-accent-lime/50 rounded-3xl p-6 transition-all duration-500 hover:shadow-[0_0_40px_rgba(132,204,22,0.15)] group"
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

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-accent-lime transition-colors">
                    {card.title}
                  </h3>

                  <div className="relative bg-black/40 border border-white/10 p-4 rounded-2xl flex items-start justify-between gap-3">
                    <p className="text-xs font-mono text-text-muted leading-relaxed">
                      💬 "{card.prompt}"
                    </p>
                    <button
                      onClick={() => handleCopyPrompt(card.id, card.prompt)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-accent-lime hover:text-black border border-white/15 text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5"
                    >
                      {copiedId === card.id ? (
                        <>
                          <CheckCircle2 size={13} className="text-accent-lime" />
                          <span>{t.copiedPromptBtn}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>{t.copyPromptBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 5: PRICING */}
        {activeTab === 'pricing' && (
          <section className="px-6 max-w-7xl mx-auto">
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
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
        )}

        {/* TAB 6: FAQ */}
        {activeTab === 'faq' && (
          <section className="px-6 max-w-7xl mx-auto">
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
        )}

      </main>

      {/* FOOTER */}
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
