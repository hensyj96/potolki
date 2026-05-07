import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, RotateCcw, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toSeoHistory } from '../../lib/mappers';
import type { SeoData, SeoHistoryRecord } from '../../db/database';

type Props = {
  open: boolean;
  path: string;
  lang: 'ru' | 'ro';
  onClose: () => void;
  onRollback: (data: SeoData) => void;
};

export default function SeoHistoryModal({ open, path, lang, onClose, onRollback }: Props) {
  const [items, setItems] = useState<SeoHistoryRecord[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    supabase
      .from('seo_history')
      .select('*')
      .eq('path', path)
      .eq('lang', lang)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn('SEO history load failed:', error);
          setItems([]);
          return;
        }
        setItems((data || []).map(toSeoHistory));
      });
    return () => { cancelled = true; };
  }, [open, path, lang]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[150] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' as const }}
            onClick={(e) => e.stopPropagation()}
            className="bg-dark-800 rounded-2xl max-w-2xl w-full p-6 border border-white/10 shadow-soft-lg max-h-[90vh] flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600/15 border border-primary-500/25 flex items-center justify-center">
                  <History className="w-4 h-4 text-primary-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">История изменений</h3>
                  <p className="text-body text-sm">{path} · {lang.toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-body hover:text-white transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto -mx-2 px-2">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-8 h-8 text-faint mx-auto mb-2" />
                  <div className="text-muted text-sm">История пока пуста</div>
                  <div className="text-faint text-xs mt-1">Версии сохраняются при каждом изменении</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((h) => (
                    <div
                      key={h.id}
                      className="rounded-xl bg-dark-900/40 border border-white/5 p-3 hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <div className="text-xs text-subtle flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {new Date(h.createdAt).toLocaleString('ru-RU', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                        <button
                          onClick={() => { onRollback(h.data); onClose(); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 text-xs font-medium transition-colors"
                          title="Откатить к этой версии"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Откатить
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-white truncate">{h.data.title || '(без title)'}</div>
                        <div className="text-xs text-muted line-clamp-2">{h.data.description || '(без description)'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
