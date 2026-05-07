import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

type Group = {
  title: string;
  items: { keys: string[]; label: string }[];
};

const GROUPS: Group[] = [
  {
    title: 'Навигация',
    items: [
      { keys: ['G', 'D'], label: 'Дашборд' },
      { keys: ['G', 'A'], label: 'Аналитика' },
      { keys: ['G', 'S'], label: 'SEO редактор' },
      { keys: ['G', 'G'], label: 'Галерея' },
    ],
  },
  {
    title: 'Действия',
    items: [
      { keys: ['Ctrl', 'K'], label: 'Командная палитра' },
      { keys: ['/'], label: 'Фокус на поиск' },
      { keys: ['N'], label: 'Добавить новое' },
      { keys: ['Ctrl', 'S'], label: 'Сохранить' },
      { keys: ['Esc'], label: 'Закрыть модалку' },
      { keys: ['?'], label: 'Показать шорткаты' },
    ],
  },
];

export default function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-[170] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' as const }}
            onClick={(e) => e.stopPropagation()}
            className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-soft-lg relative"
          >
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.10] flex items-center justify-center text-white/65 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-primary-600/15 border border-primary-500/25 flex items-center justify-center mb-4">
              <Keyboard className="w-5 h-5 text-primary-300" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">Горячие клавиши</h3>
            <p className="text-body text-sm mb-5">Ускоряют работу в админке</p>

            <div className="space-y-5">
              {GROUPS.map((g) => (
                <div key={g.title}>
                  <div className="text-[10px] uppercase tracking-wider text-faint font-medium mb-2">{g.title}</div>
                  <div className="space-y-1.5">
                    {g.items.map((it) => (
                      <div key={it.label} className="flex items-center justify-between text-sm">
                        <span className="text-muted">{it.label}</span>
                        <div className="flex items-center gap-1">
                          {it.keys.map((k) => (
                            <kbd
                              key={k}
                              className="text-[10px] text-white border border-white/15 bg-white/[0.05] rounded px-1.5 py-0.5 font-mono"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
