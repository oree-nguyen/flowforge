import { DemoCanvasScene } from './DemoCanvasScene';

interface DemoCanvasProps {
  scrollProgress?: number;
  isVisible?: boolean;
}

export function DemoCanvas({ scrollProgress = 1, isVisible = true }: DemoCanvasProps) {
  return <DemoCanvasScene scrollProgress={scrollProgress} isVisible={isVisible} />;
}
