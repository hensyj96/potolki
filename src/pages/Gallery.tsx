import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Image as ImageIcon } from 'lucide-react';
import CTASection from '../components/CTASection';
import SEO from '../components/SEO';
import SmartImage from '../components/SmartImage';
import { useAdmin } from '../context/AdminContext';
import type { GalleryItem } from '../context/AdminContext';
import { useAnalytics } from '../context/AnalyticsContext';

export default function Gallery() {
  const { t, i18n } = useTranslation();
  const { gallery } = useAdmin();
  const { trackEvent } = useAnalytics();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  const openLightbox = (item: GalleryItem) => {
    setLightbox(item);
    trackEvent('gallery_view', { imageId: item.id, room: item.room });
  };

  // Закрытие по Esc
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const filters = t('gallery.filters', { returnObjects: true }) as Record<string, string>;
  const isRo = i18n.language === 'ro';

  const filtered = activeFilter === 'all'
    ? gallery
    : gallery.filter(img => img.room === activeFilter);

  const getTitle = (item: GalleryItem) => (isRo && item.titleRo) ? item.titleRo : item.title;
  const getType = (item: GalleryItem) => (isRo && item.typeRo) ? item.typeRo : item.type;

  return (
    <div className="pt-20">
      <SEO />

      {/* Hero */}
      <section className="section-padding bg-dark-950 relative overflow-hidden">
        <div className="ambient-bg-soft" />
        <div className="container-custom mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' as const }}
          >
            <h1 className="section-title text-heading mb-4">{t('gallery.title')}</h1>
            <p className="text-body text-lg max-w-2xl mx-auto">{t('gallery.subtitle')}</p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 pb-8">
        <div className="container-custom mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(filters).map(([key, label]) => {
              const count = key === 'all' ? gallery.length : gallery.filter(g => g.room === key).length;
              const active = activeFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFilter(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary-600 text-white shadow-soft'
                      : 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white border border-white/10'
                  }`}
                >
                  {label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    active ? 'bg-white/20' : 'bg-white/[0.08]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Masonry */}
      <section className="px-4 pb-16">
        <div className="container-custom mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon className="w-12 h-12 text-faint mx-auto mb-3" />
              <p className="text-muted">{t('gallery.emptyCategory')}</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
              {filtered.map((img, i) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.03 }}
                  className="break-inside-avoid mb-4 rounded-2xl overflow-hidden cursor-pointer group relative bg-dark-800"
                  onClick={() => openLightbox(img)}
                >
                  <SmartImage
                    src={img.thumbSrc || img.src}
                    alt={getTitle(img)}
                    loading="lazy"
                    decoding="async"
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/0 via-dark-900/0 to-dark-900/0 group-hover:from-dark-900/85 group-hover:via-dark-900/30 transition-all duration-300 flex flex-col items-center justify-end p-4">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-1">
                      <ZoomIn className="w-6 h-6 text-white mb-1" />
                      <div className="text-white text-sm font-medium text-center">
                        {getTitle(img)}
                      </div>
                      <div className="text-white/70 text-xs text-center">
                        {getType(img)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1,    opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' as const }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightbox(null)}
                aria-label="Закрыть"
                className="absolute -top-4 -right-4 z-10 w-10 h-10 rounded-full bg-dark-900 border border-white/15 flex items-center justify-center text-white hover:bg-white/[0.10] transition-colors shadow-soft"
              >
                <X className="w-5 h-5" />
              </button>
              <SmartImage
                src={lightbox.src.startsWith('blob:') ? lightbox.src : lightbox.src.replace('w=800', 'w=1400')}
                alt={getTitle(lightbox)}
                className="w-full rounded-2xl shadow-soft-lg"
              />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="card px-4 py-3 inline-flex flex-col">
                  <span className="text-white font-medium text-sm">{getTitle(lightbox)}</span>
                  <span className="text-subtle text-xs">{getType(lightbox)}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CTASection />
    </div>
  );
}
