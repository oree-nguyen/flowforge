import { DemoCanvasScene } from './DemoCanvasScene';

interface DemoCanvasProps {
  scrollProgress?: number;
  isVisible?: boolean;
  onRun?: () => void;
  onComplete?: () => void;
}

export function DemoCanvas({ scrollProgress = 1, isVisible = true, onRun, onComplete }: DemoCanvasProps) {
  return <DemoCanvasScene scrollProgress={scrollProgress} isVisible={isVisible} onRun={onRun} onComplete={onComplete} />;
}


