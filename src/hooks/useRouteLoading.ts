import { useState, useEffect, useCallback, useRef } from 'react';
import { preloadAssets } from '../services/assetCache';
import { GLOBAL_ASSETS, WORKFLOW_ASSETS } from '../services/assetManifest';

const MIN_WORKFLOW_LOADING_MS = 3000; // Case 2 requirement: minimum 3000ms

export function useRouteLoading() {
  const [route, setRoute] = useState<'landing' | 'workflow'>(() => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    if (hash === '#/workflow' || path.endsWith('/workflow')) return 'workflow';
    return 'landing';
  });

  const [isLoadingVisible, setIsLoadingVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [loadingTagline, setLoadingTagline] = useState<string | undefined>();
  const isNavigatingRef = useRef(false);

  // -------------------------------------------------------------
  // CASE 1: Initial App Boot / First Visit Preload
  // -------------------------------------------------------------
  useEffect(() => {
    let alive = true;
    const initBoot = async () => {
      try {
        const globalUrls = GLOBAL_ASSETS.map((a) => a.url);
        // Preload global assets into Cache API
        await preloadAssets(globalUrls);
      } catch (err) {
        console.warn('[useRouteLoading] Case 1 preload error:', err);
      } finally {
        if (alive) {
          // Trigger smooth fade out
          setIsFadingOut(true);
          setTimeout(() => {
            if (alive) {
              setIsLoadingVisible(false);
              setIsFadingOut(false);
            }
          }, 500);
        }
      }
    };

    initBoot();
    return () => {
      alive = false;
    };
  }, []);

  // -------------------------------------------------------------
  // CASE 2: Controlled Navigation to Route (e.g. #/workflow)
  // -------------------------------------------------------------
  const navigateWithLoading = useCallback(
    async (targetRoute: 'landing' | 'workflow') => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      if (targetRoute === 'workflow') {
        // Show loading screen immediately
        setIsLoadingVisible(true);
        setIsFadingOut(false);
        setLoadingTagline('Initializing AI workflow canvas...');

        const startTime = Date.now();

        // 1. Min 3000ms delay requirement
        const minDelayPromise = new Promise<void>((resolve) =>
          setTimeout(resolve, MIN_WORKFLOW_LOADING_MS)
        );

        // 2. Preload workflow specific assets
        const workflowUrls = WORKFLOW_ASSETS.map((a) => a.url);
        const preloadPromise = preloadAssets(workflowUrls);

        // Wait for max(3000ms, preloadDuration)
        await Promise.all([minDelayPromise, preloadPromise]);

        // Route change
        setRoute('workflow');
        window.location.hash = '#/workflow';
        document.body.dataset.page = 'workflow';

        // Trigger smooth fade out
        setIsFadingOut(true);
        setTimeout(() => {
          setIsLoadingVisible(false);
          setIsFadingOut(false);
          setLoadingTagline(undefined);
          isNavigatingRef.current = false;
        }, 500);
      } else {
        // Navigate back to landing
        setRoute('landing');
        window.location.hash = '#/landing';
        document.body.dataset.page = 'landing';
        isNavigatingRef.current = false;
      }
    },
    []
  );

  // -------------------------------------------------------------
  // Listen for browser back/forward or manual hash change
  // -------------------------------------------------------------
  useEffect(() => {
    const handleHashChange = () => {
      if (isNavigatingRef.current) return;
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash === '#/workflow' || path.endsWith('/workflow')) {
        navigateWithLoading('workflow');
      } else {
        setRoute('landing');
        document.body.dataset.page = 'landing';
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [navigateWithLoading]);

  return {
    route,
    isLoadingVisible,
    isFadingOut,
    loadingTagline,
    navigateWithLoading,
  };
}
