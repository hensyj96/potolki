import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '../context/AnalyticsContext';
import { SITE_PHONE_HREF, SITE_WHATSAPP_HREF } from '../lib/siteContact';

export default function FloatingButtons() {
  const [open, setOpen] = useState(false);
  const { trackEvent } = useAnalytics();
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <>
            <motion.a
              href={SITE_WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('cta_whatsapp', { source: 'floating' })}
              initial={{ opacity: 0, y: 12, scale: 0.92 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.92 }}
              transition={{ duration: 0.18, delay: 0.04 }}
              className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl px-4 py-3 shadow-soft transition-colors"
              aria-label={t('contact.whatsappLabel')}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium pr-1">{t('contact.whatsappLabel')}</span>
            </motion.a>
            <motion.a
              href={SITE_PHONE_HREF}
              onClick={() => trackEvent('cta_call', { source: 'floating' })}
              initial={{ opacity: 0, y: 12, scale: 0.92 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.92 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl px-4 py-3 shadow-soft transition-colors"
              aria-label={t('nav.callNow')}
            >
              <Phone className="w-5 h-5" />
              <span className="text-sm font-medium pr-1">{t('nav.callNow')}</span>
            </motion.a>
          </>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Закрыть меню связи' : 'Открыть меню связи'}
        aria-expanded={open}
        className={`w-14 h-14 rounded-2xl shadow-soft-lg flex items-center justify-center transition-[background-color,transform] duration-200 active:scale-95 ${
          open
            ? 'bg-white/[0.06] border border-white/15 text-white'
            : 'bg-primary-600 hover:bg-primary-500 text-white'
        }`}
      >
        <span className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
          {open ? <X className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
        </span>
      </button>
    </div>
  );
}
