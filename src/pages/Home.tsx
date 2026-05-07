import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Star, CheckCircle2, Zap, Shield, Ruler, Award, Palette, Layers, ChevronDown, HelpCircle, Quote,
} from 'lucide-react';
import CTASection from '../components/CTASection';
import SEO from '../components/SEO';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' as const },
  }),
};

const benefitIcons = [Zap, Shield, Ruler, Award, Star, Palette];

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80',
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
];

function FAQSection() {
  const { t } = useTranslation();
  const faqItems = t('home.faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>;
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="section-padding">
      <div className="container-custom mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="chip-primary mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            {t('home.faq.badge')}
          </span>
          <h2 className="section-title text-heading mb-2">{t('home.faq.title')}</h2>
          <p className="text-muted">{t('home.faq.subtitle')}</p>
        </motion.div>

        <div className="space-y-3">
          {faqItems.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className={`card overflow-hidden transition-colors ${
                  isOpen ? 'border-primary-500/30 bg-primary-600/[0.05]' : ''
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-white font-medium pr-2">{item.q}</span>
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      isOpen ? 'bg-primary-600 text-white rotate-180' : 'bg-white/[0.06] text-white/60'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-body leading-relaxed border-t border-white/5 pt-4">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const benefits = t('benefits.items', { returnObjects: true }) as Array<{ title: string; desc: string }>;
  const reviewItems = t('home.reviews.items', { returnObjects: true }) as Array<{
    name: string; city: string; text: string; service: string; rating: number;
  }>;

  return (
    <div>
      <SEO />

      {/* === HERO === */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-hero-pattern">
        <div className="ambient-bg" />
        <div className="grid-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-900 pointer-events-none" />

        <div className="container-custom mx-auto px-4 relative z-10 pt-28 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible">
              <motion.div variants={fadeUp} custom={0} className="mb-6">
                <span className="chip-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                  {t('hero.badge')}
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.05] tracking-tight mb-5"
              >
                {t('hero.title')}
                <br />
                <span className="gradient-text">{t('hero.titleAccent')}</span>
              </motion.h1>

              <motion.p variants={fadeUp} custom={2} className="text-body text-lg leading-relaxed mb-8 max-w-xl">
                {t('hero.subtitle')}
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 mb-12">
                <Link to="/contact" className="btn-gold text-base px-7 py-3.5">
                  {t('hero.cta')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/gallery" className="btn-secondary text-base px-7 py-3.5">
                  {t('hero.ctaSecondary')}
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { num: '5000+', label: t('hero.stats.projects') },
                  { num: '10+',   label: t('hero.stats.experience') },
                  { num: '15',    label: t('hero.stats.guarantee') },
                  { num: '35+',   label: t('hero.stats.cities') },
                ].map((stat) => (
                  <div key={stat.label} className="card p-3 text-center">
                    <div className="font-display text-2xl font-bold gradient-text">{stat.num}</div>
                    <div className="text-subtle text-xs mt-1 leading-tight">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Правая колонка: коллаж картинок без infinite-анимаций */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' as const }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                <div className="absolute top-0 left-0 w-4/5 aspect-video rounded-2xl overflow-hidden shadow-soft-lg border border-white/10 animate-float-soft">
                  <img
                    src="https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=900&q=80"
                    alt={t('home.heroAltCeiling')}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/30 to-transparent" />
                </div>

                <div
                  className="absolute bottom-0 right-0 w-3/5 aspect-video rounded-2xl overflow-hidden shadow-soft-lg border border-white/10 animate-float-soft"
                  style={{ animationDelay: '-3s' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=700&q=80"
                    alt={t('home.heroAltInterior')}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="absolute top-1/2 right-0 -translate-y-1/2 card p-3 shadow-soft">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gold-500/15 flex items-center justify-center">
                      <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                    </div>
                    <div>
                      <div className="text-white text-xs font-bold">4.9 / 5</div>
                      <div className="text-faint text-[10px]">{t('home.heroReviewsCount')}</div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-16 left-0 card p-3 shadow-soft">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    </div>
                    <div>
                      <div className="text-white text-xs font-bold">{t('home.heroInstallTitle')}</div>
                      <div className="text-faint text-[10px]">{t('home.heroInstallSub')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === BENEFITS === */}
      <section className="section-padding bg-dark-900 relative overflow-hidden">
        <div className="ambient-bg-soft" />
        <div className="container-custom mx-auto relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} custom={0} className="section-title text-heading mb-4">
              {t('benefits.title')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted text-lg max-w-2xl mx-auto">
              {t('benefits.subtitle')}
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((item, i) => {
              const Icon = benefitIcons[i];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: i * 0.06, ease: 'easeOut' as const }}
                  className="card card-hover p-6"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-600/12 border border-primary-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary-300" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-body text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* === SERVICES PREVIEW === */}
      <section className="section-padding bg-dark-950">
        <div className="container-custom mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4"
          >
            <div>
              <motion.h2 variants={fadeUp} custom={0} className="section-title text-heading mb-2">
                {t('services.title')}
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-muted max-w-xl">
                {t('services.subtitle')}
              </motion.p>
            </div>
            <motion.div variants={fadeUp} custom={2}>
              <Link to="/services" className="btn-secondary whitespace-nowrap">
                {t('nav.services')} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(t('services.items', { returnObjects: true }) as Array<{title:string;desc:string;badge:string}>)
              .slice(0, 3)
              .map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: i * 0.08, ease: 'easeOut' as const }}
                  className="card card-hover overflow-hidden group"
                >
                  <div className="h-48 relative overflow-hidden bg-dark-800">
                    <img
                      src={GALLERY_IMAGES[i] || GALLERY_IMAGES[0]}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/70 via-dark-900/10 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-primary-600/85 text-white text-xs font-medium">
                        {item.badge}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-white font-semibold text-lg leading-tight mb-2">{item.title}</h3>
                    <p className="text-body text-sm leading-relaxed line-clamp-3">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* === GALLERY PREVIEW === */}
      <section className="section-padding">
        <div className="container-custom mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4"
          >
            <div>
              <motion.h2 variants={fadeUp} custom={0} className="section-title text-heading mb-2">
                {t('gallery.title')}
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-muted">
                {t('gallery.subtitle')}
              </motion.p>
            </div>
            <motion.div variants={fadeUp} custom={2}>
              <Link to="/gallery" className="btn-secondary whitespace-nowrap">
                {t('nav.gallery')} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { src: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80', span: 'col-span-2 row-span-2' },
              { src: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=500&q=80', span: '' },
              { src: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80', span: '' },
              { src: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=80', span: '' },
              { src: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=500&q=80', span: '' },
            ].map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`${img.span} rounded-2xl overflow-hidden group cursor-pointer relative bg-dark-800`}
              >
                <div className="relative h-full min-h-[140px] sm:min-h-[180px]">
                  <img
                    src={img.src}
                    alt={`Interior ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-dark-900/0 group-hover:bg-dark-900/35 transition-colors duration-300 flex items-center justify-center">
                    <Layers className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === REVIEWS === */}
      <section className="section-padding bg-dark-950">
        <div className="container-custom mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <span className="chip-gold mb-4">
              <Star className="w-3.5 h-3.5 fill-gold-400" />
              {t('home.reviews.badge')}
            </span>
            <h2 className="section-title text-heading mb-2">{t('home.reviews.title')}</h2>
            <p className="text-muted">{t('home.reviews.subtitle')}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reviewItems.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: 'easeOut' as const }}
                className="card p-6 relative"
              >
                <Quote className="absolute top-4 right-4 w-7 h-7 text-primary-500/20" />
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-gold-400 fill-gold-400" />
                  ))}
                </div>
                <p className="text-body text-sm leading-relaxed mb-4">{review.text}</p>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {review.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-medium text-sm truncate">{review.name}</div>
                      <div className="text-subtle text-xs truncate">{review.city}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-primary-300 px-2 py-1 rounded-full bg-primary-600/12 border border-primary-500/20 whitespace-nowrap">
                    {review.service}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <FAQSection />

      <CTASection />
    </div>
  );
}
