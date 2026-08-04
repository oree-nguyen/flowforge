import { useState, useEffect, useRef } from 'react';
import logoUrl from '../../public/logo.png';
import heroBg from '../../public/hero-bg.jpg';
import {
  Globe,
  ArrowRight,
  Play,
  Check,
  Lock,
  Server,
  DollarSign,
  Sparkles,
  ChevronDown,
  Zap,
  Shield,
  GitBranch,
} from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { DemoCanvas } from './DemoCanvas';
import { useDemoScroll } from '../hooks/useDemoScroll';

interface LandingPageProps {
  onOpenWorkflow: () => void;
}

// ── Reusable motion variants ─────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, delay: i * 0.08 },
  }),
};

// ── Magnetic Button ──────────────────────────────────────────
function MagneticButton({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.3);
    y.set((e.clientY - cy) * 0.3);
  };
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.button>
  );
}

// ── Glowing Orb component ────────────────────────────────────
function GlowOrb({ size, color, x, y, blur, opacity }: { size: number; color: string; x: string; y: string; blur: number; opacity: number }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size, height: size,
        background: color, left: x, top: y,
        filter: `blur(${blur}px)`,
        opacity,
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}

export function LandingPage({ onOpenWorkflow }: LandingPageProps) {
  const [lang, setLang] = useState<'en' | 'vi'>('en');
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const demoScrollRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollProgress, isVisible } = useDemoScroll(demoScrollRef);

  // Parallax hero image
  const { scrollY } = useScroll();
  const heroImgY = useTransform(scrollY, [0, 600], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  // ── i18n ──────────────────────────────────────────────────
  const t = {
    en: {
      navFeatures: 'Features',
      navWorkflows: 'Workflows',
      navPrompts: 'Showcase',
      navPricing: 'Pricing',
      navFAQ: 'FAQ',
      getStarted: 'Open App',
      heroEyebrow: 'Visual AI Orchestration',
      heroTitle: 'Build AI Workflows at the Speed of Thought',
      heroSubtitle: 'Connect 400+ AI models — text, image, video, audio — into visual DAG pipelines that run directly in your browser.',
      openAppBtn: 'Launch Workflow Editor',
      demoVideoBtn: 'See It Live',
      scrollHint: '↓ Scroll to build a live workflow',
      showcaseTitle: 'Real-Time AI Pipelines',
      showcaseSubtitle: 'FlowForge streams outputs across text, image, and video models simultaneously.',
      feature1Title: '400+ AI Models',
      feature1Desc: 'Every LLM, image gen, and video gen model — all in one canvas.',
      feature2Title: 'Visual DAG Engine',
      feature2Desc: 'Topologically sorted execution respects your node dependencies.',
      feature3Title: 'Zero Backend',
      feature3Desc: 'Your API key never touches our servers. Pure browser execution.',
      pricingTitle: '$0 Forever',
      pricingSubtitle: 'No subscriptions. No markup. Just raw OpenRouter token pricing.',
      planFeatures: [
        '100% Client-Side — runs fully in your browser',
        'Zero data leaves your device without your action',
        'BYOK — connect your own OpenRouter API key',
        'Zero markup — pay exact OpenRouter rates',
        'Unlimited nodes & workflows',
        'Export / Import full JSON anytime',
      ],
      pricingCta: 'Start Building — Free',
      securityPillar1Title: 'Local Execution',
      securityPillar1Desc: 'All logic runs inside your browser. No backend intercepts your workflow.',
      securityPillar2Title: 'Zero-Knowledge',
      securityPillar2Desc: 'API keys never touch FlowForge servers. HTTPS direct to OpenRouter.',
      securityPillar3Title: 'Pay-As-You-Go',
      securityPillar3Desc: 'Deposit credits on OpenRouter. Pay pennies per generation, nothing per month.',
      openRouterTag: 'OpenRouter Integration',
      openRouterTitle: 'Pay Only What You Generate',
      openRouterDesc: 'Plug in your personal OpenRouter key and access top-tier models at exact pay-as-you-go rates.',
      faqTitle: 'Questions',
      faqs: [
        { q: 'Why is FlowForge free?', a: 'We run zero backend infrastructure. No servers, no DB clusters — so there is nothing to bill you for the platform.' },
        { q: 'Are my API keys safe?', a: 'Yes. Keys are stored in your browser\'s IndexedDB or Google Drive only. They never reach our servers.' },
        { q: 'How am I billed for AI?', a: 'You pay OpenRouter directly for tokens used per node. FlowForge adds 0% markup.' },
        { q: 'Can I use it offline?', a: 'You can design workflows offline. Internet is needed only when triggering live API nodes.' },
      ],
      footerRights: 'FlowForge. All rights reserved.',
    },
    vi: {
      navFeatures: 'Tính năng',
      navWorkflows: 'Quy trình',
      navPrompts: 'Showcase',
      navPricing: 'Bảng giá',
      navFAQ: 'FAQ',
      getStarted: 'Mở App',
      heroEyebrow: 'Điều Phối AI Trực Quan',
      heroTitle: 'Xây Dựng Quy Trình AI Nhanh Như Tư Duy',
      heroSubtitle: 'Kết nối 400+ model AI — văn bản, hình ảnh, video, âm thanh — thành pipeline DAG trực quan chạy trực tiếp trong trình duyệt.',
      openAppBtn: 'Mở Workflow Editor',
      demoVideoBtn: 'Xem Trực Tiếp',
      scrollHint: '↓ Cuộn để xây workflow trực tiếp',
      showcaseTitle: 'Pipeline AI Thời Gian Thực',
      showcaseSubtitle: 'FlowForge stream output song song qua các model văn bản, hình ảnh, video.',
      feature1Title: '400+ Model AI',
      feature1Desc: 'Mọi LLM, image gen, video gen — tất cả trên một canvas duy nhất.',
      feature2Title: 'DAG Engine Trực Quan',
      feature2Desc: 'Thực thi theo thứ tự topology, tôn trọng mọi dependency giữa các node.',
      feature3Title: 'Không Backend',
      feature3Desc: 'API key không bao giờ chạm server của chúng tôi. Thuần browser.',
      pricingTitle: '$0 Vĩnh Viễn',
      pricingSubtitle: 'Không subscription. Không markup. Chỉ trả theo giá OpenRouter gốc.',
      planFeatures: [
        '100% Client-Side — chạy hoàn toàn trong trình duyệt',
        'Dữ liệu không rời khỏi thiết bị của bạn',
        'BYOK — dùng OpenRouter API key của chính bạn',
        'Zero markup — đúng giá gốc OpenRouter',
        'Vô hạn node & workflow',
        'Export / Import JSON toàn bộ bất cứ lúc nào',
      ],
      pricingCta: 'Bắt Đầu Miễn Phí',
      securityPillar1Title: 'Thực Thi Cục Bộ',
      securityPillar1Desc: 'Toàn bộ logic chạy trong trình duyệt. Không server nào can thiệp.',
      securityPillar2Title: 'Zero-Knowledge',
      securityPillar2Desc: 'API key không bao giờ tới server FlowForge. HTTPS thẳng tới OpenRouter.',
      securityPillar3Title: 'Dùng Bao Nhiêu - Trả Bấy Nhiêu',
      securityPillar3Desc: 'Nạp credit trên OpenRouter. Trả vài xu mỗi lần gen, không mất gì hàng tháng.',
      openRouterTag: 'Tích Hợp OpenRouter',
      openRouterTitle: 'Chỉ Trả Theo Mức Dùng',
      openRouterDesc: 'Nhập OpenRouter key cá nhân, truy cập mọi model cao cấp theo đúng giá pay-as-you-go.',
      faqTitle: 'Câu Hỏi Thường Gặp',
      faqs: [
        { q: 'Tại sao FlowForge miễn phí?', a: 'Chúng tôi không chạy backend. Không server, không DB — nên không có gì để tính phí platform.' },
        { q: 'API key của tôi có an toàn không?', a: 'Có. Key chỉ lưu trong IndexedDB trình duyệt hoặc Google Drive của bạn. Không bao giờ tới server chúng tôi.' },
        { q: 'Tôi trả phí AI như thế nào?', a: 'Bạn trả trực tiếp cho OpenRouter theo token dùng mỗi node. FlowForge không thu thêm bất kỳ % nào.' },
        { q: 'Dùng offline được không?', a: 'Thiết kế workflow offline hoàn toàn được. Chỉ cần mạng khi chạy node API trực tiếp.' },
      ],
      footerRights: 'FlowForge. Bảo lưu mọi quyền.',
    },
  }[lang];

  // ── Feature cards ────────────────────────────────────────
  const features = [
    { icon: Zap, title: t.feature1Title, desc: t.feature1Desc, color: '#84cc16' },
    { icon: GitBranch, title: t.feature2Title, desc: t.feature2Desc, color: '#22d3ee' },
    { icon: Shield, title: t.feature3Title, desc: t.feature3Desc, color: '#a78bfa' },
  ];

  // ── Showcase cards ──────────────────────────────────────
  const videoCards = [
    { id: 1, title: 'Image → 8s Video', tag: 'AI Video Gen', model: 'MiniMax Video-01', gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZhcTBxaTFhZWhwZHA3dWxpdnRmcDVwZnkyZXRocDRnZnZhbWVzZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svvjDDy267/giphy.gif', prompt: 'Cinematic dolly zoom, golden hour lighting' },
    { id: 2, title: 'Stylized 3D Render', tag: 'AI Image Gen', model: 'FLUX.1 Schnell', gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNG1ycnhidTRyZjEwNmNzMTFwbGF6M2NpdTczZGt5cmJtdnhidWFmaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26tn33aiTi1jkl6H6/giphy.gif', prompt: 'Futuristic Neo Tokyo, 8k octane render' },
    { id: 3, title: 'Neon Billboard Gen', tag: 'AI Image Gen', model: 'FLUX Pro', gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnZza29rNGlna284d3JqN3lhdWZ3NXgxaGJtN25sd2I3NmFnNXZnZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3vR1v8TjR5r3aM40/giphy.gif', prompt: 'Glossy magazine cover, vibrant neon colors' },
    { id: 4, title: 'Voice Narration Pipeline', tag: 'AI Audio Gen', model: 'OpenAI TTS-1 HD', gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2JqOW9ldmtscGFxZHMyaWFzaDFoc3gxbGJtNmR0eHkyazlnNnB5MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT9IgzoKnwFNmISR8I/giphy.gif', prompt: 'Studio voiceover, warm acoustics, crisp range' },
  ];

  // Particle dots background
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 8 + 4,
    delay: Math.random() * 4,
  }));

  const showcaseRef = useRef<HTMLDivElement>(null);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          videoCards.forEach((card, idx) => {
            setTimeout(() => {
              setVisibleCards(prev => [...new Set([...prev, card.id])]);
            }, idx * 150);
          });
        }
      });
    }, { threshold: 0.1 });
    if (showcaseRef.current) observer.observe(showcaseRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-[#0A0A0C] text-white font-sans selection:bg-accent-lime selection:text-black overflow-x-hidden">

      {/* ═══ PARTICLE FIELD (Fixed, always on) ═══ */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-[#84cc16]"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: 0.25 }}
            animate={{ y: [0, -30, 0], opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        {/* Large ambient glow orbs */}
        <GlowOrb size={600} color="rgba(132,204,22,0.06)" x="20%" y="10%" blur={120} opacity={1} />
        <GlowOrb size={500} color="rgba(34,211,238,0.04)" x="80%" y="40%" blur={120} opacity={1} />
        <GlowOrb size={400} color="rgba(132,204,22,0.05)" x="50%" y="80%" blur={100} opacity={1} />
      </div>

      {/* ═══ NAVBAR ═══ */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#0A0A0C]/80 backdrop-blur-2xl"
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 group"
        >
          <div className="relative">
            <img src={logoUrl} alt="FlowForge" className="w-8 h-8 rounded-xl" />
            <div className="absolute inset-0 rounded-xl shadow-[0_0_20px_rgba(132,204,22,0.6)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">FlowForge</span>
        </button>

        <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-white/50">
          {[
            ['#features', t.navFeatures],
            ['#showcase', t.navPrompts],
            ['#pricing', t.navPricing],
            ['#faq', t.navFAQ],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="hover:text-white transition-colors duration-200 relative group"
            >
              {label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-accent-lime group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-white/10 rounded-lg hover:border-white/25 text-white/50 hover:text-white transition-all"
          >
            <Globe size={12} />
            {lang.toUpperCase()}
          </button>

          <MagneticButton
            onClick={onOpenWorkflow}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-lime text-black font-bold text-xs shadow-[0_0_25px_rgba(132,204,22,0.4)] hover:shadow-[0_0_40px_rgba(132,204,22,0.6)] transition-all duration-300"
          >
            {t.getStarted}
            <ArrowRight size={13} />
          </MagneticButton>
        </div>
      </motion.nav>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-20 pb-16 px-6 overflow-hidden">
        {/* Hero background image with parallax */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y: heroImgY, opacity: heroOpacity }}
        >
          <img
            src={heroBg}
            alt=""
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0C]/40 via-transparent to-[#0A0A0C]" />
        </motion.div>

        {/* Radial glow behind content */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(132,204,22,0.12) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Eyebrow */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-lime/30 bg-accent-lime/[0.07] text-accent-lime text-xs font-mono tracking-widest uppercase mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
            {t.heroEyebrow}
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
          >
            <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
              {t.heroTitle.split(' ').slice(0, -3).join(' ')}
            </span>{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-accent-lime to-emerald-400 bg-clip-text text-transparent">
                {t.heroTitle.split(' ').slice(-3).join(' ')}
              </span>
              {/* Green glow under last words */}
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-lime/60 to-transparent" />
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-base md:text-lg text-white/50 max-w-2xl mb-10 leading-relaxed"
          >
            {t.heroSubtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row items-center gap-4 mb-16"
          >
            <MagneticButton
              onClick={onOpenWorkflow}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-accent-lime text-black font-bold text-sm shadow-[0_0_40px_rgba(132,204,22,0.5)] hover:shadow-[0_0_70px_rgba(132,204,22,0.8)] transition-all duration-300"
            >
              <Play size={16} className="group-hover:scale-110 transition-transform" />
              {t.openAppBtn}
              <ArrowRight size={16} />
            </MagneticButton>

            <a
              href="#showcase"
              className="flex items-center gap-2 px-7 py-4 rounded-2xl border border-white/15 hover:border-white/35 text-white/70 hover:text-white text-sm font-medium transition-all duration-300 hover:bg-white/5"
            >
              {t.demoVideoBtn}
              <ChevronDown size={15} />
            </a>
          </motion.div>

          {/* Scroll badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="flex flex-col items-center gap-3 text-white/25 text-xs font-mono"
          >
            <span>{t.scrollHint}</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
            >
              <div className="w-1 h-2 rounded-full bg-accent-lime/60" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ DEMO CANVAS (scroll-driven) ═══ */}
      <div ref={demoScrollRef} className="relative w-full" style={{ height: '300vh' }}>
        <div className="sticky top-20 px-4 max-w-7xl mx-auto z-30 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-white/30 font-mono tracking-wide">{t.scrollHint}</p>
            <div className="flex items-center gap-2">
              <div className="w-24 h-0.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-accent-lime rounded-full"
                  style={{ width: `${scrollProgress * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-white/30 font-mono w-8 text-right">
                {Math.round(scrollProgress * 100)}%
              </span>
            </div>
          </div>
          <DemoCanvas
            scrollProgress={scrollProgress}
            isVisible={isVisible}
            onComplete={() => setDemoCompleted(true)}
          />
        </div>
      </div>

      {/* ═══ REST OF PAGE (unlocked after demo completes) ═══ */}
      <motion.div
        initial={false}
        animate={{ opacity: demoCompleted ? 1 : 0, height: demoCompleted ? 'auto' : 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >

        {/* ═══ FEATURES ═══ */}
        <section id="features" className="relative py-28 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Section glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-accent-lime/30 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  custom={i}
                  viewport={{ once: true, amount: 0.3 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative p-8 rounded-3xl border border-white/[0.07] bg-white/[0.025] hover:border-white/15 transition-colors duration-300 overflow-hidden"
                >
                  {/* Card glow on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${feat.color}15 0%, transparent 70%)` }}
                  />
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: `${feat.color}18`, border: `1px solid ${feat.color}30` }}
                  >
                    <feat.icon size={22} style={{ color: feat.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{feat.desc}</p>

                  {/* Bottom accent line */}
                  <div
                    className="absolute bottom-0 left-8 right-8 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(90deg, transparent, ${feat.color}60, transparent)` }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SHOWCASE ═══ */}
        <section id="showcase" ref={showcaseRef} className="relative py-28 px-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="max-w-6xl mx-auto">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
              className="mb-16"
            >
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
                {t.showcaseTitle}
              </h2>
              <p className="text-base text-white/45 max-w-lg">{t.showcaseSubtitle}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videoCards.map((card, i) => {
                const vis = visibleCards.includes(card.id);
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={vis ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -4 }}
                    className="group relative rounded-3xl border border-white/[0.07] bg-white/[0.02] overflow-hidden hover:border-accent-lime/30 transition-colors duration-300"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                      style={{ background: 'radial-gradient(circle at 50% 0%, rgba(132,204,22,0.08) 0%, transparent 70%)' }}
                    />
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={card.gifUrl}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-black/70 backdrop-blur-md border border-accent-lime/30 px-2.5 py-1 rounded-full text-[11px] font-semibold text-accent-lime">
                          {card.tag}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="bg-black/70 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full text-[11px] font-mono text-white/60">
                          {card.model}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-base font-bold text-white mb-2 group-hover:text-accent-lime transition-colors">{card.title}</h3>
                      <p className="text-[11px] font-mono text-white/35 bg-black/30 border border-white/5 p-2.5 rounded-xl leading-relaxed">
                        "{card.prompt}"
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══ PRICING ═══ */}
        <section id="pricing" className="relative py-28 px-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-accent-lime/20 to-transparent" />
          {/* Big glow behind pricing */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(132,204,22,0.07) 0%, transparent 70%)' }}
          />

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
              className="mb-16"
            >
              <h2 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-br from-accent-lime to-emerald-400 bg-clip-text text-transparent mb-4">
                {t.pricingTitle}
              </h2>
              <p className="text-base text-white/45 max-w-md">{t.pricingSubtitle}</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Main Pricing Card */}
              <motion.div
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                className="lg:col-span-7 relative rounded-3xl border border-accent-lime/25 bg-white/[0.02] p-8 overflow-hidden"
              >
                {/* Card inner glow */}
                <div className="absolute inset-0 rounded-3xl" style={{ background: 'radial-gradient(circle at 20% 0%, rgba(132,204,22,0.1) 0%, transparent 60%)' }} />
                {/* Corner badge */}
                <div className="absolute top-0 right-0 bg-accent-lime text-black text-[10px] font-black px-4 py-1.5 rounded-bl-2xl tracking-wider uppercase">
                  FREE FOREVER
                </div>

                <div className="relative z-10">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-6xl font-black text-white">$0</span>
                    <span className="text-sm font-semibold text-accent-lime">/ forever</span>
                  </div>
                  <p className="text-sm text-white/40 mb-8">Full access. No credit card needed.</p>

                  <div className="space-y-3 mb-10">
                    {t.planFeatures.map((feat, idx) => (
                      <motion.div
                        key={idx}
                        variants={fadeIn} initial="hidden" whileInView="visible" custom={idx}
                        viewport={{ once: true }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-5 h-5 rounded-full bg-accent-lime/15 border border-accent-lime/30 flex items-center justify-center shrink-0">
                          <Check size={11} className="text-accent-lime" />
                        </div>
                        <span className="text-sm text-white/70">{feat}</span>
                      </motion.div>
                    ))}
                  </div>

                  <MagneticButton
                    onClick={onOpenWorkflow}
                    className="w-full py-4 rounded-2xl bg-accent-lime text-black font-bold text-sm shadow-[0_0_30px_rgba(132,204,22,0.4)] hover:shadow-[0_0_60px_rgba(132,204,22,0.7)] transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {t.pricingCta}
                    <ArrowRight size={16} />
                  </MagneticButton>
                </div>
              </motion.div>

              {/* Side pillars */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {[
                  { icon: Server, title: t.securityPillar1Title, desc: t.securityPillar1Desc, color: '#22d3ee' },
                  { icon: Lock, title: t.securityPillar2Title, desc: t.securityPillar2Desc, color: '#84cc16' },
                  { icon: DollarSign, title: t.securityPillar3Title, desc: t.securityPillar3Desc, color: '#fbbf24' },
                ].map((pillar, i) => (
                  <motion.div
                    key={pillar.title}
                    variants={fadeUp} initial="hidden" whileInView="visible" custom={i}
                    viewport={{ once: true, amount: 0.3 }}
                    whileHover={{ x: 4 }}
                    className="group flex items-start gap-4 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/15 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${pillar.color}18`, border: `1px solid ${pillar.color}25` }}
                    >
                      <pillar.icon size={18} style={{ color: pillar.color }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">{pillar.title}</h4>
                      <p className="text-xs text-white/40 leading-relaxed">{pillar.desc}</p>
                    </div>
                  </motion.div>
                ))}

                {/* OpenRouter partner card */}
                <motion.div
                  variants={fadeUp} initial="hidden" whileInView="visible" custom={3}
                  viewport={{ once: true, amount: 0.3 }}
                  className="p-5 rounded-2xl border border-violet-500/25 bg-violet-500/5 relative overflow-hidden"
                >
                  <div className="absolute inset-0 rounded-2xl" style={{ background: 'radial-gradient(circle at 0% 50%, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
                  <div className="relative z-10 flex items-center gap-2 text-[11px] font-mono text-violet-400 mb-2">
                    <Sparkles size={12} />
                    {t.openRouterTag}
                  </div>
                  <h4 className="relative z-10 text-sm font-bold text-white mb-1">{t.openRouterTitle}</h4>
                  <p className="relative z-10 text-xs text-white/40 leading-relaxed">{t.openRouterDesc}</p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section id="faq" className="relative py-28 px-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="max-w-3xl mx-auto">
            <motion.h2
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
              className="text-4xl md:text-5xl font-black tracking-tight text-white mb-12"
            >
              {t.faqTitle}
            </motion.h2>

            <div className="flex flex-col gap-3">
              {t.faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp} initial="hidden" whileInView="visible" custom={i}
                  viewport={{ once: true, amount: 0.2 }}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.03] transition-colors group"
                  >
                    <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors flex items-center gap-3">
                      <span className="text-[11px] font-mono text-accent-lime/60 w-6 shrink-0">0{i + 1}</span>
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ChevronDown size={16} className="text-white/30 shrink-0 ml-4" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <p className="px-6 pb-5 text-sm text-white/45 leading-relaxed pl-15 border-t border-white/[0.05] pt-4" style={{ paddingLeft: '3.75rem' }}>
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FOOTER CTA + FOOTER ═══ */}
        <section className="relative py-28 px-6 text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-accent-lime/20 to-transparent" />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(132,204,22,0.1) 0%, transparent 60%)' }}
          />

          <div className="relative z-10 max-w-2xl mx-auto">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-lime/30 bg-accent-lime/[0.07] text-accent-lime text-xs font-mono tracking-widest uppercase mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
                Build Anything
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
                Ready to orchestrate<br />
                <span className="bg-gradient-to-r from-accent-lime to-emerald-400 bg-clip-text text-transparent">your AI pipeline?</span>
              </h2>
              <p className="text-white/40 text-base mb-10">Free forever. No account needed. Just your OpenRouter key.</p>
              <MagneticButton
                onClick={onOpenWorkflow}
                className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-accent-lime text-black font-bold text-sm shadow-[0_0_60px_rgba(132,204,22,0.5)] hover:shadow-[0_0_100px_rgba(132,204,22,0.8)] transition-all duration-300"
              >
                <Play size={18} />
                Launch Workflow Editor
                <ArrowRight size={18} />
              </MagneticButton>
            </motion.div>
          </div>
        </section>

        <footer className="py-10 px-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/25 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <img src={logoUrl} alt="FlowForge" className="w-6 h-6 rounded-lg" />
            <span className="font-semibold text-white/40">FlowForge</span>
          </div>
          <p>© 2026 {t.footerRights}</p>
          <button
            onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
            className="flex items-center gap-1.5 hover:text-white/50 transition-colors"
          >
            <Globe size={11} />
            {lang === 'en' ? 'Tiếng Việt' : 'English'}
          </button>
        </footer>

      </motion.div>
    </div>
  );
}
