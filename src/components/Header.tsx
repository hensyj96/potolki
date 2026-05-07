import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Phone, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalytics } from '../context/AnalyticsContext';
import { SITE_PHONE_HREF } from '../lib/siteContact';

export default function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { trackEvent } = useAnalytics();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const currentLang = i18n.language;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Закрываем мобильное меню при клике по ссылкам — без setState в useEffect
  const closeMenus = useCallback(() => {
    setMenuOpen(false);
    setLangOpen(false);
  }, []);

  const switchLang = (lang: string) => {
    const from = i18n.language;
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
    setLangOpen(false);
    trackEvent('lang_switch', { from, to: lang });
  };

  const navLinks = [
    { path: '/',         label: t('nav.home') },
    { path: '/services', label: t('nav.services') },
    { path: '/gallery',  label: t('nav.gallery') },
    { path: '/prices',   label: t('nav.prices') },
    { path: '/about',    label: t('nav.about') },
    { path: '/contact',  label: t('nav.contact') },
  ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
        scrolled
          ? 'bg-dark-900/85 backdrop-blur-md shadow-soft border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="container-custom mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-[72px]">
          {/* Лого */}
          <Link to="/" onClick={closeMenus} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-soft group-hover:shadow-glow-primary transition-shadow">
              <span className="text-white font-bold text-lg leading-none">P</span>
            </div>
            <div className="leading-tight">
              <span className="font-display font-semibold text-xl text-white">
                Potolki<span className="text-primary-300">.md</span>
              </span>
              <p className="text-[10px] text-subtle hidden sm:block">{t('header.tagline')}</p>
            </div>
          </Link>

          {/* Десктоп-навигация */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3.5 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  isActive(link.path)
                    ? 'text-white'
                    : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {isActive(link.path) && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-lg bg-primary-600/18 border border-primary-500/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Правый блок */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Переключатель языков */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(v => !v)}
                aria-haspopup="menu"
                aria-expanded={langOpen}
                aria-label="Переключить язык"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-sm font-medium text-white/85 transition-colors"
              >
                <span className="text-base leading-none">{currentLang === 'ru' ? '🇷🇺' : '🇲🇩'}</span>
                <span className="uppercase text-xs tracking-wide">{currentLang}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setLangOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0,  scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.14, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-36 bg-dark-800 border border-white/10 rounded-xl overflow-hidden shadow-soft-lg z-40"
                      role="menu"
                    >
                      {['ru', 'ro'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => switchLang(lang)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                            currentLang === lang
                              ? 'bg-primary-600/15 text-primary-200'
                              : 'text-white/75 hover:bg-white/[0.06] hover:text-white'
                          }`}
                          role="menuitem"
                        >
                          <span>{lang === 'ru' ? '🇷🇺' : '🇲🇩'}</span>
                          <span>{lang === 'ru' ? 'Русский' : 'Română'}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* CTA-телефон */}
            <a
              href={SITE_PHONE_HREF}
              onClick={() => trackEvent('cta_call', { source: 'header' })}
              className="hidden md:flex btn-primary text-sm py-2 px-4"
            >
              <Phone className="w-4 h-4" />
              {t('nav.callNow')}
            </a>

            {/* Мобильный тогглер */}
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={menuOpen}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Мобильное меню */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="lg:hidden overflow-hidden bg-dark-900/95 backdrop-blur-md border-t border-white/[0.06]"
          >
            <div className="container-custom mx-auto px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMenus}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-primary-600/18 text-primary-200 border border-primary-500/25'
                      : 'text-white/75 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2">
                <a
                  href={SITE_PHONE_HREF}
                  onClick={() => {
                    trackEvent('cta_call', { source: 'mobile-menu' });
                    closeMenus();
                  }}
                  className="btn-primary w-full"
                >
                  <Phone className="w-4 h-4" />
                  {t('nav.callNow')}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
