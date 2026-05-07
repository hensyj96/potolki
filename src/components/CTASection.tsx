import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';
import { SITE_PHONE_HREF } from '../lib/siteContact';

export default function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="section-padding relative overflow-hidden bg-dark-950">
      <div className="ambient-bg" />

      <div className="container-custom mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut' as const }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="chip-gold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
            {t('cta.badge')}
          </span>

          <h2 className="section-title text-heading mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-body text-lg mb-8">
            {t('cta.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/contact" className="btn-gold w-full sm:w-auto text-base px-7 py-3.5">
              {t('cta.button')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href={SITE_PHONE_HREF} className="btn-secondary w-full sm:w-auto text-base px-7 py-3.5">
              <Phone className="w-4 h-4" />
              {t('cta.call')}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
