import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Award, Users, Target, Handshake, CheckCircle2 } from 'lucide-react';
import CTASection from '../components/CTASection';
import SEO from '../components/SEO';

const VALUE_ICONS = [Target, Award, CheckCircle2, Handshake];

export default function About() {
  const { t } = useTranslation();
  const values = t('about.values', { returnObjects: true }) as Array<{ title: string; desc: string }>;
  const team = t('about.team.members', { returnObjects: true }) as Array<{
    name: string; role: string; exp: string;
  }>;
  const certs = t('about.certificates.items', { returnObjects: true }) as string[];

  return (
    <div className="pt-20">
      <SEO />

      {/* Hero */}
      <section className="section-padding bg-dark-950 relative overflow-hidden">
        <div className="ambient-bg-soft" />
        <div className="container-custom mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' as const }}
            >
              <span className="chip-primary mb-6">
                <Award className="w-3.5 h-3.5" />
                {t('about.heroBadge')}
              </span>
              <h1 className="section-title text-heading mb-6">{t('about.title')}</h1>
              <p className="text-body text-lg leading-relaxed">{t('about.story.text')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' as const }}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { num: '5000+', label: t('about.metrics.projects') },
                { num: '10+', label: t('about.metrics.experience') },
                { num: '15', label: t('about.metrics.guarantee') },
                { num: '35+', label: t('about.metrics.cities') },
              ].map((stat, i) => (
                <div key={i} className="card p-6 text-center">
                  <div className="font-display text-3xl font-bold gradient-text mb-1.5">{stat.num}</div>
                  <div className="text-muted text-sm">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-dark-900">
        <div className="container-custom mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="section-title text-heading mb-3">{t('about.valuesTitle')}</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((val, i) => {
              const Icon = VALUE_ICONS[i];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: i * 0.06, ease: 'easeOut' as const }}
                  className="card card-hover p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary-600/12 border border-primary-500/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-5 h-5 text-primary-300" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{val.title}</h3>
                  <p className="text-body text-sm">{val.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding">
        <div className="container-custom mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="section-title text-heading mb-3">{t('about.team.title')}</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: i * 0.06, ease: 'easeOut' as const }}
                className="card overflow-hidden"
              >
                <div className="h-40 bg-gradient-to-br from-primary-900/40 to-dark-950 flex items-center justify-center relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl font-display shadow-soft">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-white font-semibold mb-1">{member.name}</h3>
                  <p className="text-primary-300 text-sm mb-2">{member.role}</p>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-faint" />
                    <span className="text-subtle text-xs">{member.exp}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certificates */}
      <section className="section-padding bg-dark-950">
        <div className="container-custom mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="section-title text-heading mb-3">{t('about.certificates.title')}</h2>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3">
            {certs.map((cert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="card px-6 py-4 flex items-center gap-3"
              >
                <Award className="w-5 h-5 text-gold-400" />
                <span className="text-white font-medium">{cert}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding">
        <div className="container-custom mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="section-title text-heading mb-2">{t('about.timelineTitle')}</h2>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {(t('about.timeline', { returnObjects: true }) as Array<{ year: string; title: string; desc: string }>).map((event, i, arr) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="flex gap-5 mb-6 last:mb-0"
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary-600/15 border border-primary-500/30 flex items-center justify-center text-primary-300 font-bold text-xs flex-shrink-0">
                    {event.year.slice(2)}
                  </div>
                  {i < arr.length - 1 && <div className="w-px flex-1 bg-primary-600/15 mt-2" />}
                </div>
                <div className="card p-5 flex-1">
                  <div className="text-primary-300 text-sm font-medium mb-1">{event.year}</div>
                  <h3 className="text-white font-semibold mb-1">{event.title}</h3>
                  <p className="text-body text-sm">{event.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </div>
  );
}
