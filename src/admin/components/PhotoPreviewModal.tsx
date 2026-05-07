import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit, Calendar, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { GalleryItem } from '../../db/database';

type Props = {
  item: GalleryItem | null;
  onClose: () => void;
};

const ROOM_LABELS: Record<string, string> = {
  living: 'Зал',
  kitchen: 'Кухня',
  bedroom: 'Спальня',
  bathroom: 'Санузел',
  office: 'Офис',
};

export default function PhotoPreviewModal({ item, onClose }: Props) {
  const url = item?.src || '';

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[140] bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' as const }}
            onClick={(e) => e.stopPropagation()}
            className="bg-dark-800 rounded-2xl max-w-3xl w-full overflow-hidden border border-white/10 shadow-soft-lg"
          >
            <div className="aspect-video bg-dark-900 relative">
              {url && <img src={url} alt={item.title} className="w-full h-full object-contain" />}
              <button
                onClick={onClose}
                aria-label="Закрыть"
                className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-dark-900/80 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-white font-semibold text-lg truncate">{item.title}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-subtle">
                  <span className="flex items-center gap-1.5"><Tag className="w-3 h-3" />{ROOM_LABELS[item.room] || item.room}</span>
                  <span>·</span>
                  <span>{item.type}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{new Date(item.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
              <Link
                to="/admin/gallery"
                onClick={() => {
                  setTimeout(() => window.dispatchEvent(new CustomEvent('admin:edit-photo', { detail: { id: item.id } })), 50);
                  onClose();
                }}
                className="btn-primary text-sm py-2.5"
              >
                <Edit className="w-4 h-4" />
                Редактировать
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
