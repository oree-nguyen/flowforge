import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { TopBar } from './components/TopBar';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { ZoomControls } from './components/ZoomControls';
import { RecenterButton } from './components/RecenterButton';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SettingsModal } from './components/SettingsModal';
import { ImageLibraryModal } from './components/ImageLibraryModal';
import { ShortcutGuide } from './components/ShortcutGuide';
import { useWorkflowStore } from './store/workflowStore';
import { useAutoSave } from './hooks/useAutoSave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ToastContainer } from './components/ToastContainer';

function App() {
  // Simple Hash-based routing: #/landing, #/workflow, or path based
  const [route, setRoute] = useState<'landing' | 'workflow'>(() => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    if (hash === '#/workflow' || path.endsWith('/workflow')) return 'workflow';
    return 'landing'; // Default page is Landing Page
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash === '#/workflow' || path.endsWith('/workflow')) {
        setRoute('workflow');
      } else {
        setRoute('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigateTo = (page: 'landing' | 'workflow') => {
    setRoute(page);
    window.location.hash = page === 'workflow' ? '#/workflow' : '#/landing';
  };

  // Hooks
  useAutoSave();
  useKeyboardShortcuts(() => setIsGuideOpen(prev => !prev));

  // Wait for zustand/persist hydration to complete before rendering canvas
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useWorkflowStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useWorkflowStore.persist.onFinishHydration(() => {
        setHydrated(true);
      });
      return unsub;
    }
  }, []);

  if (route === 'landing') {
    return <LandingPage onOpenWorkflow={() => navigateTo('workflow')} />;
  }

  if (!hydrated) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-canvas text-text-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent-lime border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-muted">Restoring workflow...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-canvas text-text-primary overflow-hidden">
      <TopBar />
      <div className="relative flex-1 w-full h-full">
        <Canvas />
        <Toolbar 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          onOpenImageLibrary={() => setIsImageLibraryOpen(true)}
        />
        <PropertiesPanel />
        <div className="absolute bottom-6 left-6 z-10 flex items-center gap-4">
          <ZoomControls />
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <RecenterButton />
        </div>
        <ShortcutGuide isOpen={isGuideOpen} onToggle={() => setIsGuideOpen(!isGuideOpen)} />
      </div>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ImageLibraryModal isOpen={isImageLibraryOpen} onClose={() => setIsImageLibraryOpen(false)} />
      <ToastContainer />
    </div>
  );
}

export default App;
