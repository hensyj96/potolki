import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, LogOut } from 'lucide-react';

type Props = {
  open: boolean;
  /** Seconds remaining until forced logout */
  totalSeconds: number;
  onExtend: () => void;
  onLogout: () => void;
};

export default function IdleWarningModal({ open, totalSeconds, onExtend, onLogout }: Props) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (!open) {
      setRemaining(totalSeconds);
      return;
    }
    setRemaining(totalSeconds);
    const start = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const left = Math.max(0, totalSeconds - elapsed);
      setRemaining(left);
      if (left <= 0) window.clearInterval(tick);
    }, 250);
    return () => window.clearInterval(tick);
  }, [open, totalSeconds]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[190] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' as const }}
            className="bg-dark-800 rounded-2xl max-w-md w-full p-6 border border-white/10 shadow-soft-lg"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5 text-amber-300" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Сессия истекает</h3>
            <p className="text-body text-sm mb-4 leading-relaxed">
              Из-за бездействия вы будете автоматически выйдены через
              <span className="text-amber-300 font-semibold"> {remaining} сек</span>.
            </p>

            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-200"
                style={{ width: `${Math.max(0, (remaining / totalSeconds) * 100)}%` }}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button onClick={onLogout} className="btn-secondary flex-1">
                <LogOut className="w-4 h-4" />
                Выйти сейчас
              </button>
              <button onClick={onExtend} className="btn-primary flex-1 justify-center">
                Продолжить работу
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
