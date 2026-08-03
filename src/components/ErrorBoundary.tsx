import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { canvasEngine } from '../engine/canvasEngine';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[FlowForge ErrorBoundary caught exception]:', error, errorInfo);
  }

  private handleResetState = () => {
    try {
      localStorage.removeItem('flowforge-workflow-storage');
      canvasEngine.deserialize({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex items-center justify-center bg-[#08080c] text-text-primary p-6">
          <div className="max-w-md w-full p-6 bg-panel/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Đã xảy ra sự cố giao diện
              </h2>
              <p className="text-xs text-text-muted leading-relaxed">
                Ứng dụng vừa gặp lỗi xử lý khi thao tác dữ liệu workflow. Bạn có thể khôi phục lại trạng thái ban đầu bằng nút bên dưới.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full p-3 bg-black/40 border border-white/5 rounded-xl text-left font-mono text-[10px] text-red-300 max-h-24 overflow-y-auto custom-scrollbar">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col w-full gap-2 pt-2">
              <button
                onClick={this.handleResetState}
                className="w-full py-2.5 bg-accent-lime hover:bg-[#b8e62d] text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Khôi phục & Tạo Workflow Mới</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-medium transition-all cursor-pointer"
              >
                Tải lại trang (Reload)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
