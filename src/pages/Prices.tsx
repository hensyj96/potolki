import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, Star, ArrowRight, Calculator, Phone, MessageCircle } from 'lucide-react';
import CTASection from '../components/CTASection';
import SEO from '../components/SEO';
import { SITE_PHONE_DISPLAY, SITE_PHONE_HREF, SITE_WHATSAPP_HREF } from '../lib/siteContact';

type TabKey = 'ceilings' | 'lighting' | 'extra';

export default function Prices() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('ceilings');

  const ceilings = t('prices.ceilings', { returnObjects: true }) as Array<{
    name: string; popular: boolean;
  }>;
  const lighting = t('prices.lighting', { returnObjects: true }) as Array<{ name: string }>;
  const extra = t('prices.extra', { returnObjects: true }) as Array<{ name: string }>;

  const categories = t('prices.categories', { returnObjects: true }) as {
    ceilings: string; lighting: string; extra: string;
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'ceilings', label: categories.ceilings },
    { key: 'lighting', label: categories.lighting },
    { key: 'extra',    label: categories.extra },
  ];

  const examples = t('prices.examples', { returnObjects: true }) as Array<{
    room: string; area: string; type: string;
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
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium mb-6">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('prices.heroBadge')}
            </span>
            <h1 className="section-title text-heading mb-4">{t('prices.title')}</h1>
            <p className="text-body text-lg max-w-2xl mx-auto">{t('prices.subtitle')}</p>
          </motion.div>
        </div>
      </section>

      {/* Discount banner */}
      <section className="px-4 pb-6">
        <div className="container-custom mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-gold-600/15 via-gold-500/8 to-transparent border border-gold-500/25"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
                <Star className="w-5 h-5 text-gold-300 fill-gold-300" />
              </div>
              <div>
                <div className="text-white font-semibold">{t('prices.discount')}</div>
                <div className="text-muted text-sm">{t('prices.discountHint')}</div>
              </div>
            </div>
            <Link to="/contact" className="btn-gold whitespace-nowrap">
              <Calculator className="w-4 h-4" />
              {t('prices.requestCalc')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4 pb-16">
        <div className="container-custom mx-auto">
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary-600 text-white shadow-soft'
                    : 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white border border-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="card overflow-hidden lg:flex lg:min-h-[320px]">
            <div className="lg:flex-1 lg:min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'ceilings' && (
                    <ul>
                      {ceilings.map((item, i) => (
                        <li
                          key={i}
                          className={`flex items-center justify-between gap-4 p-5 md:p-6 border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.03] ${
                            item.popular ? 'bg-primary-600/[0.05]' : ''
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="text-white font-medium">{item.name}</span>
                            {item.popular && (
                              <span className="ml-2 inline-flex px-2 py-0.5 rounded-full bg-primary-600/15 text-primary-200 text-xs border border-primary-500/25 align-middle">
                                {t('prices.popularBadge')}
                              </span>
                            )}
                          </div>
                          <a
                            href={SITE_PHONE_HREF}
                            className="lg:hidden shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-600/15 border border-primary-500/25 text-primary-300 hover:bg-primary-600/25 transition-colors"
                            aria-label={SITE_PHONE_DISPLAY}
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}

                  {activeTab === 'lighting' && (
                    <ul>
                      {lighting.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-4 p-5 md:p-6 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
                        >
                          <span className="text-white font-medium min-w-0">{item.name}</span>
                          <a
                            href={SITE_PHONE_HREF}
                            className="lg:hidden shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-600/15 border border-primary-500/25 text-primary-300 hover:bg-primary-600/25 transition-colors"
                            aria-label={SITE_PHONE_DISPLAY}
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}

                  {activeTab === 'extra' && (
                    <ul>
                      {extra.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-4 p-5 md:p-6 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
                        >
                          <span className="text-white font-medium min-w-0">{item.name}</span>
                          <a
                            href={SITE_PHONE_HREF}
                            className="lg:hidden shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-600/15 border border-primary-500/25 text-primary-300 hover:bg-primary-600/25 transition-colors"
                            aria-label={SITE_PHONE_DISPLAY}
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Десктоп: колонка справа вместо «пустых» цен */}
            <aside className="hidden lg:flex lg:flex-col lg:justify-center lg:gap-4 lg:w-80 xl:w-[22rem] shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-gradient-to-b from-primary-900/[0.12] via-dark-900/40 to-dark-950/80 p-8">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-300/90">
                {t('prices.sidebarTitle')}
              </p>
              <a
                href={SITE_PHONE_HREF}
                className="group inline-flex items-center gap-3 text-white hover:text-primary-200 transition-colors"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600/20 border border-primary-500/30 group-hover:bg-primary-600/30">
                  <Phone className="w-5 h-5 text-primary-300" />
                </span>
                <span className="font-display text-xl font-semibold tracking-tight">{SITE_PHONE_DISPLAY}</span>
              </a>
              <p className="text-muted text-sm leading-relaxed">{t('prices.sidebarHint')}</p>
              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={SITE_WHATSAPP_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200 hover:bg-emerald-500/15 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('prices.sidebarWhatsApp')}
                </a>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/85 hover:bg-white/[0.08] transition-colors"
                >
                  {t('prices.sidebarForm')}
                </Link>
              </div>
            </aside>
          </div>

          <p className="text-subtle text-sm mt-4 text-center">{t('prices.note')}</p>
        </div>
      </section>

      {/* Examples */}
      <section className="section-padding pt-0">
        <div className="container-custom mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="section-title text-heading mb-2">{t('prices.examplesTitle')}</h2>
            <p className="text-muted">{t('prices.examplesSubtitle')}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {examples.map((ex, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="card card-hover p-6 text-center"
              >
                <div className="text-subtle text-sm mb-1">{ex.room} · {ex.area}</div>
                <div className="text-white font-medium mb-4">{ex.type}</div>
                <p className="text-muted text-sm leading-relaxed">{t('prices.examplesCallHint')}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
            className="text-center mt-8"
          >
            <Link to="/contact" className="btn-primary text-base px-7 py-3.5">
              {t('prices.exactQuoteCta')} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <CTASection />
    </div>
  );
}
