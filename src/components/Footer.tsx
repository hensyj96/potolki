import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { SITE_PHONE_DISPLAY, SITE_PHONE_HREF, SITE_WHATSAPP_HREF } from '../lib/siteContact';

export default function Footer() {
  const { t } = useTranslation();

  const navLinks = [
    { path: '/',         label: t('nav.home') },
    { path: '/services', label: t('nav.services') },
    { path: '/gallery',  label: t('nav.gallery') },
    { path: '/prices',   label: t('nav.prices') },
    { path: '/about',    label: t('nav.about') },
    { path: '/contact',  label: t('nav.contact') },
  ];

  const services = t('footer.serviceItems', { returnObjects: true }) as string[];

  return (
    <footer className="bg-dark-950 border-t border-white/[0.06]">
      <div className="container-custom mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Бренд */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <span className="text-white font-bold text-lg leading-none">P</span>
              </div>
              <span className="font-display font-semibold text-xl text-white">
                Potolki<span className="text-primary-300">.md</span>
              </span>
            </Link>
            <p className="text-body text-sm leading-relaxed mb-6">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.10] border border-white/10 flex items-center justify-center text-white/65 hover:text-white transition-colors text-xs font-bold"
              >IG</a>
              <a
                href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.10] border border-white/10 flex items-center justify-center text-white/65 hover:text-white transition-colors text-xs font-bold"
              >FB</a>
              <a
                href={SITE_WHATSAPP_HREF} target="_blank" rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-emerald-600/30 border border-white/10 flex items-center justify-center text-white/65 hover:text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Ссылки */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.links')}</h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-muted hover:text-primary-300 text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary-500/50 group-hover:bg-primary-300 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Услуги */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.services')}</h4>
            <ul className="space-y-2">
              {services.map((s) => (
                <li key={s}>
                  <Link
                    to="/services"
                    className="text-muted hover:text-primary-300 text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary-500/50 group-hover:bg-primary-300 transition-colors" />
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.contacts')}</h4>
            <ul className="space-y-3">
              <li>
                <a href={SITE_PHONE_HREF} className="flex items-center gap-2.5 text-muted hover:text-primary-300 text-sm transition-colors group">
                  <span className="w-7 h-7 rounded-lg bg-primary-600/12 group-hover:bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-primary-300" />
                  </span>
                  {SITE_PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a href="mailto:info@potolki.md" className="flex items-center gap-2.5 text-muted hover:text-primary-300 text-sm transition-colors group">
                  <span className="w-7 h-7 rounded-lg bg-primary-600/12 group-hover:bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-primary-300" />
                  </span>
                  info@potolki.md
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-muted text-sm">
                <span className="w-7 h-7 rounded-lg bg-primary-600/12 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-primary-300" />
                </span>
                {t('contact.info.address')}
              </li>
              <li className="flex items-center gap-2.5 text-muted text-sm">
                <span className="w-7 h-7 rounded-lg bg-primary-600/12 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-primary-300" />
                </span>
                {t('contact.info.schedule')}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="container-custom mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-subtle text-xs">
            © {new Date().getFullYear()} Potolki.md. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-subtle hover:text-white/70 text-xs transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/admin/login" className="text-faint hover:text-white/60 text-xs transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
