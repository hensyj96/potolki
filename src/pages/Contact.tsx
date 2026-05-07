import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, MessageCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { useAnalytics } from '../context/AnalyticsContext';
import { SITE_PHONE_DISPLAY, SITE_PHONE_HREF, SITE_WHATSAPP_HREF } from '../lib/siteContact';

export default function Contact() {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const [form, setForm] = useState({ name: '', phone: '', city: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    await new Promise(r => setTimeout(r, 1200));
    trackEvent('cta_form', { name: form.name, city: form.city });
    setStatus('success');
  };

  const infoItems = [
    { icon: Phone, label: t('contact.info.phoneCaption'), href: SITE_PHONE_HREF, value: SITE_PHONE_DISPLAY },
    { icon: Mail,   label: t('contact.info.email'),    href: 'mailto:info@potolki.md', value: 'info@potolki.md' },
    { icon: MapPin, label: t('contact.info.address'),  href: null,                   value: t('contact.info.address') },
    { icon: Clock,  label: t('contact.info.schedule'), href: null,                   value: t('contact.info.schedule') },
  ];

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
            <h1 className="section-title text-heading mb-4">{t('contact.title')}</h1>
            <p className="text-body text-lg max-w-2xl mx-auto">{t('contact.subtitle')}</p>
          </motion.div>
        </div>
      </section>

      {/* Main */}
      <section className="px-4 pb-16">
        <div className="container-custom mx-auto">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-3"
            >
              <div className="card p-6 md:p-8">
                <h2 className="text-white font-semibold text-xl mb-6">{t('contact.formSectionTitle')}</h2>

                {status === 'success' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                    </div>
                    <h3 className="text-white font-semibold text-xl mb-2">
                      {t('contact.form.success')}
                    </h3>
                    <p className="text-muted">{t('contact.callbackPrompt')}</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-muted text-sm mb-1.5">{t('contact.form.name')} *</label>
                        <input
                          id="name"
                          type="text" name="name"
                          value={form.name} onChange={handleChange}
                          required placeholder={t('contact.placeholderName')}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-muted text-sm mb-1.5">{t('contact.form.phone')} *</label>
                        <input
                          id="phone"
                          type="tel" name="phone"
                          value={form.phone} onChange={handleChange}
                          required placeholder={SITE_PHONE_DISPLAY}
                          className="input-field"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-muted text-sm mb-1.5">{t('contact.form.city')}</label>
                      <input
                        id="city"
                        type="text" name="city"
                        value={form.city} onChange={handleChange}
                        placeholder={t('contact.placeholderCity')}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-muted text-sm mb-1.5">{t('contact.form.message')}</label>
                      <textarea
                        id="message"
                        name="message"
                        value={form.message} onChange={handleChange}
                        rows={4}
                        placeholder={t('contact.form.messagePlaceholder')}
                        className="input-field resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="btn-gold w-full text-base py-3.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {status === 'sending' ? (
                        <>
                          <span className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                          {t('contact.sending')}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {t('contact.form.submit')}
                        </>
                      )}
                    </button>

                    <p className="text-subtle text-xs text-center">
                      {t('contact.privacyNote')}
                    </p>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="lg:col-span-2 space-y-3"
            >
              <a
                href={SITE_PHONE_HREF}
                onClick={() => trackEvent('cta_call', { source: 'contact-page' })}
                className="block card card-hover p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-[3.25rem] h-[3.25rem] rounded-2xl bg-primary-600/15 border border-primary-500/25 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary-300" />
                  </div>
                  <div>
                    <div className="text-muted text-sm mb-0.5">{t('contact.callCardHint')}</div>
                    <div className="text-white font-semibold text-lg">{SITE_PHONE_DISPLAY}</div>
                  </div>
                </div>
              </a>

              <a
                href={SITE_WHATSAPP_HREF}
                target="_blank" rel="noopener noreferrer"
                onClick={() => trackEvent('cta_whatsapp', { source: 'contact-page' })}
                className="block card p-5 border-emerald-500/20 hover:bg-emerald-500/[0.05] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-[3.25rem] h-[3.25rem] rounded-2xl bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-emerald-300" />
                  </div>
                  <div>
                    <div className="text-muted text-sm mb-0.5">{t('contact.whatsappLabel')}</div>
                    <div className="text-white font-semibold">{t('contact.whatsappChat')}</div>
                  </div>
                </div>
              </a>

              <div className="card p-5 space-y-4">
                {infoItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-600/12 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-primary-300" />
                    </div>
                    <div>
                      <div className="text-subtle text-xs">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} className="text-white text-sm font-medium hover:text-primary-300 transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <div className="text-white text-sm font-medium">{item.value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="card p-5">
                <div className="text-muted text-sm mb-3">{t('contact.social')}</div>
                <div className="flex gap-2">
                  {[
                    { label: 'IG', href: 'https://instagram.com',     hover: 'hover:bg-gradient-to-br hover:from-fuchsia-600 hover:to-pink-500' },
                    { label: 'FB', href: 'https://facebook.com',      hover: 'hover:bg-blue-600' },
                    { label: 'TG', href: 'https://t.me/potolki_md',   hover: 'hover:bg-sky-500' },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank" rel="noopener noreferrer"
                      aria-label={social.label}
                      className={`w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all text-sm font-bold ${social.hover}`}
                    >
                      {social.label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="px-4 pb-16">
        <div className="container-custom mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl overflow-hidden border border-white/10 shadow-soft-lg"
            style={{ height: '400px' }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d91316.8898826046!2d28.76448!3d47.01556!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40c97c3628b769a1%3A0x37d1d6305749dd3c!2sChi%C8%99in%C4%83u%2C%20Moldova!5e0!3m2!1sru!2s!4v1700000000000!5m2!1sru!2s"
              width="100%"
              height="400"
              style={{ border: 0, filter: 'invert(92%) hue-rotate(180deg) saturate(0.85)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={t('contact.mapTitle')}
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
