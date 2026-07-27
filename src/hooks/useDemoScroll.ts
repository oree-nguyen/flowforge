import { useState, useEffect } from 'react';
import type { RefObject } from 'react';

export function useDemoScroll(containerRef: RefObject<HTMLElement | null>) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // IntersectionObserver: trigger isVisible when 10% of container is in view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);

    // Calculate scroll progress using window scroll (requires outer container to use natural scroll)
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollableHeight = rect.height - windowHeight;

      if (totalScrollableHeight <= 0) {
        // If section is shorter than viewport, use intersection ratio
        const ratio = Math.max(0, Math.min(1, 1 - (rect.bottom - windowHeight) / rect.height));
        setScrollProgress(ratio);
        return;
      }

      // How far user has scrolled INTO the container
      // rect.top = distance from top of viewport to top of element
      // When rect.top = 0 → user just reached the element → progress = 0
      // When rect.top = -(totalScrollableHeight) → user at bottom → progress = 1
      const currentScroll = -rect.top;
      const rawProgress = currentScroll / totalScrollableHeight;
      const clampedProgress = Math.max(0, Math.min(1, rawProgress));

      setScrollProgress(clampedProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef]);

  return { scrollProgress, isVisible };
}
