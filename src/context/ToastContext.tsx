import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export type ToastAction = {
  label: string;
  onClick: () => void;
};

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
};

type ToastContextType = {
  toast: (data: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  success: (title: string, message?: string, options?: { duration?: number; action?: ToastAction }) => string;
  error: (title: string, message?: string, options?: { duration?: number; action?: ToastAction }) => string;
  info: (title: string, message?: string, options?: { duration?: number; action?: ToastAction }) => string;
};

const ToastContext = createContext<ToastContextType | null>(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: 'border-green-500/30 bg-green-500/10',
  error:   'border-red-500/30 bg-red-500/10',
  info:    'border-primary-500/30 bg-primary-600/10',
};

const ICON_COLORS = {
  success: 'text-green-400 bg-green-500/20',
  error:   'text-red-400 bg-red-500/20',
  info:    'text-primary-400 bg-primary-600/20',
};

const ACTION_COLORS = {
  success: 'text-green-300 hover:bg-green-500/20',
  error:   'text-red-300 hover:bg-red-500/20',
  info:    'text-primary-200 hover:bg-primary-600/25',
};

const DEFAULT_DURATION = 3500;

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timersRef.current.get(id);
    if (t) {
      window.clearTimeout(t);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback((data: Omit<Toast, 'id'>) => {
    const id = genId();
    const duration = data.duration ?? DEFAULT_DURATION;
    setToasts((prev) => [...prev, { ...data, id, duration }]);
    if (duration > 0) {
      const handle = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timersRef.current.delete(id);
      }, duration);
      timersRef.current.set(id, handle);
    }
    return id;
  }, []);

  const success = useCallback(
    (title: string, message?: string, options?: { duration?: number; action?: ToastAction }) =>
      toast({ type: 'success', title, message, ...options }),
    [toast]
  );
  const error = useCallback(
    (title: string, message?: string, options?: { duration?: number; action?: ToastAction }) =>
      toast({ type: 'error', title, message, ...options }),
    [toast]
  );
  const info = useCallback(
    (title: string, message?: string, options?: { duration?: number; action?: ToastAction }) =>
      toast({ type: 'info', title, message, ...options }),
    [toast]
  );

  // Cleanup on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((handle) => window.clearTimeout(handle));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, success, error, info }}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[calc(100vw-2rem)] sm:w-auto sm:max-w-md pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 50, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.97, transition: { duration: 0.18 } }}
                transition={{ type: 'spring', duration: 0.35 }}
                className={`pointer-events-auto rounded-2xl p-3 pr-2 border ${COLORS[t.type]} bg-dark-800 flex items-start gap-3 shadow-soft-lg`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_COLORS[t.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <div className="text-white font-medium text-sm">{t.title}</div>
                  {t.message && <div className="text-body text-xs mt-0.5 leading-relaxed">{t.message}</div>}
                </div>
                {t.action && (
                  <button
                    onClick={() => {
                      t.action!.onClick();
                      dismiss(t.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 self-center ${ACTION_COLORS[t.type]}`}
                  >
                    {t.action.label}
                  </button>
                )}
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Закрыть"
                  className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-subtle hover:text-white transition-colors flex-shrink-0 self-start"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
