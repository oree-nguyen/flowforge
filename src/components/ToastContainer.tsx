import { useToastStore, type ToastItem } from '../store/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

const toastIcons = {
  success: <CheckCircle2 className="w-4 h-4 text-state-success shrink-0" />,
  error: <XCircle className="w-4 h-4 text-danger shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
  info: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
};

const toastBorders = {
  success: 'border-state-success/40',
  error: 'border-danger/40',
  warning: 'border-amber-400/40',
  info: 'border-sky-400/40',
};

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="fixed top-16 right-4 sm:top-20 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-[calc(100vw-32px)] w-[360px] pointer-events-none">
      <AnimatePresence>
        {toasts.map((t: ToastItem) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-2xl bg-panel/95 backdrop-blur-2xl border ${toastBorders[t.type]} shadow-[0_8px_30px_rgba(0,0,0,0.6)] text-xs text-text-primary overflow-hidden relative group`}
          >
            {toastIcons[t.type]}
            <span className="flex-1 leading-relaxed break-words">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-text-muted hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/10 shrink-0"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
