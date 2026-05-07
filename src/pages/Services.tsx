import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import CTASection from '../components/CTASection';
import SEO from '../components/SEO';

const SERVICE_IMAGES = [
  'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=900&q=80',
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=900&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80',
  'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=900&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900&q=80',
];

// Все badge’и в одной мягкой системе акцентов: primary / gold / emerald
const BADGE_TONE: Record<string, string> = {
  // RU
  'Популярное':   'bg-primary-600/15 text-primary-200 border-primary-500/30',
  'Хит продаж':   'bg-gold-500/12   text-gold-300    border-gold-500/30',
  'Премиум':      'bg-gold-500/12   text-gold-300    border-gold-500/30',
  'Эко':          'bg-emerald-500/12 text-emerald-300 border-emerald-500/30',
  'Уникально':    'bg-primary-600/15 text-primary-200 border-primary-500/30',
  'Дизайн':       'bg-primary-600/15 text-primary-200 border-primary-500/30',
  // RO
  'Popular':      'bg-primary-600/15 text-primary-200 border-primary-500/30',
  'Best seller':  'bg-gold-500/12   text-gold-300    border-gold-500/30',
  'Premium':      'bg-gold-500/12   text-gold-300    border-gold-500/30',
  'Eco':          'bg-emerald-500/12 text-emerald-300 border-emerald-500/30',
  'Unic':         'bg-primary-600/15 text-primary-200 border-primary-500/30',
  'Design':       'bg-primary-600/15 text-primary-200 border-primary-500/30',
};

export default function Services() {
  const { t } = useTranslation();
  const items = t('services.items', { returnObjects: true }) as Array<{
    title: string; desc: string; badge: string;
  }>;

  const installBullets = t('services.installBullets', { returnObjects: true }) as string[];
  const processSteps = t('services.processSteps', { returnObjects: true }) as Array<{
    step: string; title: string; desc: string;
  }>;

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
            <span className="chip-primary mb-6">
              {t('services.heroBadge')}
            </span>
            <h1 className="section-title text-heading mb-4">
              {t('services.title')}
            </h1>
            <p className="text-body text-lg max-w-2xl mx-auto">
              {t('services.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services list */}
      <section className="section-padding pt-0">
        <div className="container-custom mx-auto">
          <div className="space-y-6">
            {items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, ease: 'easeOut' as const }}
                className={`card overflow-hidden flex flex-col ${
                  i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
              >
                <div className="lg:w-2/5 h-64 lg:h-auto relative overflow-hidden bg-dark-800">
                  <img
                    src={SERVICE_IMAGES[i] || SERVICE_IMAGES[0]}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-dark-900/30 hidden lg:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent lg:hidden" />
                </div>

                <div className="lg:w-3/5 p-7 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className={`px-3 py-1 rounded-full border text-xs font-medium ${BADGE_TONE[item.badge] || 'bg-primary-600/15 text-primary-200 border-primary-500/30'}`}>
                      {item.badge}
                    </span>
                  </div>

                  <h2 className="font-display text-2xl lg:text-3xl font-semibold text-white mb-3 tracking-tight">
                    {item.title}
                  </h2>

                  <p className="text-body leading-relaxed mb-6">{item.desc}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                    {installBullets.map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-sm text-muted">
                        <CheckCircle2 className="w-4 h-4 text-primary-300 flex-shrink-0" />
                        {feat}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/contact" className="btn-primary">
                      {t('services.ctaOrder')} <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link to="/contact" className="btn-secondary">
                      {t('services.ctaPrice')}
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section-padding bg-dark-950">
        <div className="container-custom mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="section-title text-heading mb-3">{t('services.processTitle')}</h2>
            <p className="text-muted">{t('services.processSubtitle')}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {processSteps.map((step, i, arr) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: i * 0.06, ease: 'easeOut' as const }}
                className="relative"
              >
                <div className="card p-6 h-full">
                  <div className="text-4xl font-display font-bold gradient-text mb-3 opacity-40">{step.step}</div>
                  <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-body text-sm">{step.desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 w-6 items-center justify-center z-10">
                    <ArrowRight className="w-5 h-5 text-primary-400/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </div>
  );
}
