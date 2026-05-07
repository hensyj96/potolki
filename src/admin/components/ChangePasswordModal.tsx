import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, X } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';

type Props = { open: boolean; onClose: () => void };

export default function ChangePasswordModal({ open, onClose }: Props) {
  const { changePassword } = useAdmin();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCurrent(''); setNext(''); setConfirm('');
    setShowCurrent(false); setShowNext(false); setBusy(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      toast.error('Не совпадает', 'Новый пароль и подтверждение должны быть идентичны');
      return;
    }
    if (next.length < 6) {
      toast.error('Слишком короткий', 'Минимум 6 символов');
      return;
    }
    setBusy(true);
    const result = await changePassword(current, next);
    setBusy(false);
    if (result.ok) {
      toast.success('Пароль обновлён', 'Используйте новый пароль при следующем входе');
      reset();
      onClose();
    } else {
      toast.error('Не удалось сменить', result.error || 'Текущий пароль неверный');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => { reset(); onClose(); }}
          className="fixed inset-0 z-[160] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' as const }}
            onClick={(e) => e.stopPropagation()}
            className="bg-dark-800 rounded-2xl max-w-md w-full p-6 border border-white/10 shadow-soft-lg relative"
          >
            <button
              onClick={() => { reset(); onClose(); }}
              aria-label="Закрыть"
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.10] flex items-center justify-center text-white/65 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-primary-600/15 border border-primary-500/25 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-primary-300" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">Сменить пароль</h3>
            <p className="text-body text-sm mb-5">Минимум 6 символов</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-muted text-xs mb-1.5">Текущий пароль</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    required
                    autoFocus
                    className="input-field pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-white/70"
                    tabIndex={-1}
                    aria-label="Показать пароль"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-muted text-xs mb-1.5">Новый пароль</label>
                <div className="relative">
                  <input
                    type={showNext ? 'text' : 'password'}
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    required
                    minLength={6}
                    className="input-field pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNext((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-white/70"
                    tabIndex={-1}
                    aria-label="Показать пароль"
                  >
                    {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-muted text-xs mb-1.5">Подтвердите новый</label>
                <input
                  type={showNext ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  className="input-field"
                  autoComplete="new-password"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3">
                <button type="button" onClick={() => { reset(); onClose(); }} className="btn-secondary flex-1">
                  Отмена
                </button>
                <button type="submit" disabled={busy} className="btn-primary flex-1 justify-center disabled:opacity-60">
                  {busy ? 'Сохранение...' : 'Обновить пароль'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
