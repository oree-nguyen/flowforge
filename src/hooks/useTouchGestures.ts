import { useRef, useEffect } from 'react';
import { canvasEngine } from '../engine/canvasEngine';

export function useTouchGestures(
  containerRef: React.RefObject<HTMLDivElement | null>,
  zoom: number
) {
  const touchState = useRef<{
    initialDist: number;
    initialZoom: number;
    lastTouchPos: { x: number; y: number } | null;
    isPinching: boolean;
    isPanning: boolean;
  }>({
    initialDist: 0,
    initialZoom: 1,
    lastTouchPos: null,
    isPinching: false,
    isPanning: false,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Ignore if touch target is interactive element or inside node
      const target = e.target as HTMLElement;
      if (target.closest('[data-nodeid]') || target.closest('button, input, textarea, select')) {
        return;
      }

      if (e.touches.length === 2) {
        // Pinch Zoom start
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        touchState.current.initialDist = dist;
        touchState.current.initialZoom = zoom;
        touchState.current.isPinching = true;
        touchState.current.isPanning = false;
      } else if (e.touches.length === 1) {
        // Pan start
        const t = e.touches[0];
        touchState.current.lastTouchPos = { x: t.clientX, y: t.clientY };
        touchState.current.isPanning = true;
        touchState.current.isPinching = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const state = touchState.current;

      if (e.touches.length === 2 && state.isPinching) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

        if (state.initialDist > 0) {
          const rect = el.getBoundingClientRect();
          const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
          const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
          const scaleFactor = currentDist / state.initialDist;
          const newZoom = state.initialZoom * scaleFactor;

          canvasEngine.zoomTo(newZoom, midX, midY);
        }
      } else if (e.touches.length === 1 && state.isPanning && state.lastTouchPos) {
        // Prevent page scroll
        e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - state.lastTouchPos.x;
        const dy = t.clientY - state.lastTouchPos.y;

        state.lastTouchPos = { x: t.clientX, y: t.clientY };
        canvasEngine.panBy(dx, dy);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        touchState.current.isPinching = false;
      }
      if (e.touches.length === 0) {
        touchState.current.isPanning = false;
        touchState.current.lastTouchPos = null;
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [containerRef, zoom]);
}
