import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: ReactNode;
  /**
   * For destructive actions: require typing this exact word to enable confirm.
   * If unset — uses an arming delay instead (600ms for danger, 0ms otherwise).
   */
  requireType?: string;
  /**
   * Extra delay (ms) before the confirm button activates. Defaults to
   * 600ms for danger and 0 for others. Helps prevent accidental clicks.
   */
  armDelayMs?: number;
  onConfirm: () => void;
  onCancel: () => void;
};

const VARIANT_STYLES = {
  danger: {
    iconBg: 'bg-red-500/15 border border-red-500/25',
    iconColor: 'text-red-300',
    btn: 'bg-red-500 hover:bg-red-400 text-white',
  },
  warning: {
    iconBg: 'bg-amber-500/15 border border-amber-500/25',
    iconColor: 'text-amber-300',
    btn: 'bg-amber-500 hover:bg-amber-400 text-dark-950',
  },
  info: {
    iconBg: 'bg-primary-600/15 border border-primary-500/25',
    iconColor: 'text-primary-300',
    btn: 'bg-primary-600 hover:bg-primary-500 text-white',
  },
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'danger',
  icon,
  requireType,
  armDelayMs,
  onConfirm,
  onCancel,
}: Props) {
  const styles = VARIANT_STYLES[variant];
  const [armed, setArmed] = useState(false);
  const [typed, setTyped] = useState('');
  const confirmRef = useRef<HTMLButtonElement>(null);

  const effectiveDelay = armDelayMs ?? (variant === 'danger' && !requireType ? 600 : 0);

  useEffect(() => {
    if (!open) {
      setArmed(false);
      setTyped('');
      return;
    }
    if (effectiveDelay <= 0) {
      setArmed(true);
      return;
    }
    const t = window.setTimeout(() => setArmed(true), effectiveDelay);
    return () => window.clearTimeout(t);
  }, [open, effectiveDelay]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && !requireType && armed) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          onConfirm();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel, onConfirm, armed, requireType]);

  const canConfirm = armed && (!requireType || typed.trim() === requireType);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}
          className="fixed inset-0 z-[150] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' as const }}
            onClick={(e) => e.stopPropagation()}
            className="bg-dark-800 rounded-2xl max-w-md w-full p-6 border border-white/10 shadow-soft-lg relative"
          >
            <button
              onClick={onCancel}
              aria-label="Закрыть"
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.10] flex items-center justify-center text-white/65 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className={`w-12 h-12 rounded-2xl ${styles.iconBg} flex items-center justify-center mb-4`}>
              {icon || <AlertTriangle className={`w-5 h-5 ${styles.iconColor}`} />}
            </div>

            <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
            {description && (
              <p className="text-body text-sm mb-5 leading-relaxed">{description}</p>
            )}

            {requireType && (
              <div className="mb-4">
                <label className="block text-xs text-muted mb-1.5">
                  Чтобы подтвердить, введите <code className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">{requireType}</code>
                </label>
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  className="input-field"
                  autoFocus
                  spellCheck={false}
                />
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button onClick={onCancel} className="btn-secondary flex-1">
                {cancelText}
              </button>
              <button
                ref={confirmRef}
                onClick={onConfirm}
                disabled={!canConfirm}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${styles.btn} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
