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
import { VideoEditorWorkspace } from './components/VideoEditorWorkspace';
import { useWorkflowStore } from './store/workflowStore';
import { useAutoSave } from './hooks/useAutoSave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ToastContainer } from './components/ToastContainer';
import { LoadingScreen } from './components/LoadingScreen';
import { useRouteLoading } from './hooks/useRouteLoading';

function App() {
  const {
    route,
    isLoadingVisible,
    isFadingOut,
    loadingTagline,
    navigateWithLoading,
  } = useRouteLoading();

  const isSettingsOpen = useWorkflowStore(state => state.isSettingsOpen);
  const setIsSettingsOpen = useWorkflowStore(state => state.setIsSettingsOpen);
  const openVideoEditorNodeId = useWorkflowStore(state => state.openVideoEditorNodeId);
  const setOpenVideoEditorNodeId = useWorkflowStore(state => state.setOpenVideoEditorNodeId);
  const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useAutoSave();
  useKeyboardShortcuts(() => setIsGuideOpen(prev => !prev));

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

  return (
    <>
      {/* Full-screen Loading Screen Overlay for Case 1 (boot) & Case 2 (3s navigation) */}
      <LoadingScreen
        visible={isLoadingVisible || !hydrated}
        fadeOut={isFadingOut}
        tagline={loadingTagline}
      />

      {route === 'landing' ? (
        <LandingPage onOpenWorkflow={() => navigateWithLoading('workflow')} />
      ) : (
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
          {openVideoEditorNodeId && (
            <VideoEditorWorkspace
              nodeId={openVideoEditorNodeId}
              onClose={() => setOpenVideoEditorNodeId(null)}
            />
          )}
          <ToastContainer />
        </div>
      )}
    </>
  );
}

export default App;
