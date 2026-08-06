import { useEffect, useRef } from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  visible?: boolean;
  fadeOut?: boolean;
  tagline?: string;
  onHide?: () => void;
  minDuration?: number; // ms before allowing fade out
}

const DEFAULT_TAGLINES = [
  'Initializing AI workflow engine...',
  'Preparing your creative workspace...',
  'Connecting to AI models...',
  'FlowForge is getting ready...',
];

export function LoadingScreen({
  visible = true,
  fadeOut = false,
  tagline,
  onHide,
  minDuration = 0,
}: LoadingScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLSpanElement>(null);
  const taglineIdx = useRef(0);

  // Cycle taglines with fade
  useEffect(() => {
    if (tagline) return; // If custom tagline is provided, don't cycle
    let alive = true;
    const cycle = () => {
      if (!alive || !taglineRef.current) return;
      taglineRef.current.style.opacity = '0';
      setTimeout(() => {
        if (!alive || !taglineRef.current) return;
        taglineIdx.current = (taglineIdx.current + 1) % DEFAULT_TAGLINES.length;
        taglineRef.current.textContent = DEFAULT_TAGLINES[taglineIdx.current];
        taglineRef.current.style.opacity = '1';
      }, 400);
    };
    const id = setInterval(cycle, 2800);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [tagline]);

  // Handle minDuration auto-hide if onHide prop is passed
  useEffect(() => {
    if (!onHide || minDuration <= 0) return;
    const t = setTimeout(() => {
      const el = rootRef.current;
      if (!el) {
        onHide();
        return;
      }
      el.style.opacity = '0';
      el.style.transform = 'scale(1.04)';
      el.style.filter = 'blur(4px)';
      setTimeout(onHide, 550);
    }, minDuration);
    return () => clearTimeout(t);
  }, [onHide, minDuration]);

  if (!visible) return null;

  return (
    <div
      className={`ff-loading-root ${fadeOut ? 'ff-loading-fade-out' : ''}`}
      ref={rootRef}
    >
      {/* Ambient glow layers */}
      <div className="ff-glow-outer" />
      <div className="ff-grid-bg" />

      {/* Center cluster */}
      <div className="ff-center">
        {/* Icon animation wrapper */}
        <div className="ff-icon-wrap" aria-label="FlowForge loading">
          {/* Glow halo behind icon */}
          <div className="ff-icon-halo" />

          {/* SVG icon — all animation driven by CSS keyframes */}
          <svg
            className="ff-icon-svg"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            overflow="visible"
          >
            {/* ── Square background (lime squircle) ── */}
            <rect
              className="ff-square-bg"
              x="2" y="2" width="96" height="96"
              rx="24" ry="24"
            />

            {/* ── Shape group (3 squares + 1 triangle) ── */}
            <g className="ff-shapes-group">
              {/* Large single square for state (*) */}
              <rect
                className="ff-merge-square"
                x="18" y="18" width="64" height="64"
                rx="10" ry="10"
              />

              {/* Top-left square */}
              <rect
                className="ff-sq ff-sq-tl"
                x="12" y="12" width="36" height="36"
                rx="8" ry="8"
              />

              {/* Top-right square */}
              <rect
                className="ff-sq ff-sq-tr"
                x="52" y="12" width="36" height="36"
                rx="8" ry="8"
              />

              {/* Bottom-left square */}
              <rect
                className="ff-sq ff-sq-bl"
                x="12" y="52" width="36" height="36"
                rx="8" ry="8"
              />

              {/* Bottom-right triangle (rounded right-triangle matching logo.png) */}
              <path
                className="ff-triangle"
                d="M 60,52 L 75,52 Q 88,52 79.5,60.5 L 60.5,79.5 Q 52,88 52,75 L 52,60 Q 52,52 60,52 Z"
              />
            </g>
          </svg>
        </div>

        {/* Wordmark */}
        <div className="ff-wordmark">
          <span className="ff-wordmark-flow">Flow</span>
          <span className="ff-wordmark-forge">Forge</span>
        </div>

        {/* Tagline */}
        <span className="ff-tagline" ref={taglineRef}>
          {tagline || DEFAULT_TAGLINES[0]}
        </span>

        {/* Dots */}
        <div className="ff-dots">
          <span className="ff-dot" />
          <span className="ff-dot" />
          <span className="ff-dot" />
        </div>
      </div>

      {/* Bottom progress bar */}
      <div className="ff-progress-bar" />
    </div>
  );
}
