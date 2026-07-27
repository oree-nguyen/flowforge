import { useState, useEffect } from 'react';
import type { RefObject } from 'react';

export function useDemoScroll(containerRef: RefObject<HTMLElement | null>) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // IntersectionObserver for entrance animation trigger (when 20% visible)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);

    // Scroll listener for calculating progress inside sticky section
    let rafId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollableHeight = rect.height - windowHeight;

      if (totalScrollableHeight <= 0) return;

      // Current distance scrolled inside the sticky container
      const currentScroll = -rect.top;
      const rawProgress = currentScroll / totalScrollableHeight;
      const clampedProgress = Math.max(0, Math.min(1, rawProgress));

      rafId = requestAnimationFrame(() => {
        setScrollProgress(clampedProgress);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [containerRef]);

  return { scrollProgress, isVisible };
}
