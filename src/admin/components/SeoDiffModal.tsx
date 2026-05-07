import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import type { SeoData } from '../../db/database';
import { diffObjects } from '../lib/diff';

const FIELDS: { key: keyof SeoData; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'ogTitle', label: 'OG Title' },
  { key: 'ogDescription', label: 'OG Description' },
  { key: 'ogImage', label: 'OG Image' },
];

type Props = {
  open: boolean;
  before: SeoData;
  after: SeoData;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function SeoDiffModal({ open, before, after, onConfirm, onCancel }: Props) {
  const diffs = diffObjects(before, after, FIELDS.map((f) => f.key));

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
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' as const }}
            onClick={(e) => e.stopPropagation()}
            className="bg-dark-800 rounded-2xl max-w-2xl w-full p-6 border border-white/10 shadow-soft-lg max-h-[90vh] flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">Подтвердите изменения</h3>
                <p className="text-body text-sm">Что будет сохранено</p>
              </div>
              <button
                onClick={onCancel}
                className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-body hover:text-white transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-5">
              {diffs.length === 0 ? (
                <div className="text-center py-8 text-subtle text-sm">Нет изменений</div>
              ) : (
                diffs.map((d) => {
                  const fieldLabel = FIELDS.find((f) => f.key === d.field)?.label || d.field;
                  return (
                    <div key={d.field} className="rounded-xl bg-dark-900/60 border border-white/5 p-3">
                      <div className="text-xs text-primary-300 font-medium mb-2">{fieldLabel}</div>
                      <div className="space-y-1.5">
                        {d.from && (
                          <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5 break-words">
                            <span className="font-mono mr-1.5">−</span>{d.from}
                          </div>
                        )}
                        {d.to && (
                          <div className="text-xs text-green-300 bg-green-500/10 border border-green-500/20 rounded-lg px-2 py-1.5 break-words">
                            <span className="font-mono mr-1.5">+</span>{d.to}
                          </div>
                        )}
                        {!d.from && !d.to && <div className="text-xs text-subtle">(пусто)</div>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-white/5">
              <button onClick={onCancel} className="btn-secondary flex-1">Отмена</button>
              <button onClick={onConfirm} className="btn-primary flex-1 justify-center" disabled={diffs.length === 0}>
                <Save className="w-4 h-4" />
                Сохранить
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
