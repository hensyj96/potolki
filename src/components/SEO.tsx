import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../context/AdminContext';
import { useLocation } from 'react-router-dom';

export default function SEO() {
  const { i18n } = useTranslation();
  const { seoConfig } = useAdmin();
  const { pathname } = useLocation();

  const lang = (i18n.language === 'ro' ? 'ro' : 'ru') as 'ru' | 'ro';
  const config = seoConfig[pathname];
  const seo = config?.[lang];

  if (!seo) return null;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta property="og:title" content={seo.ogTitle || seo.title} />
      <meta property="og:description" content={seo.ogDescription || seo.description} />
      {seo.ogImage && <meta property="og:image" content={seo.ogImage} />}
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={lang === 'ru' ? 'ru_RU' : 'ro_MD'} />
      <link rel="canonical" href={`https://potolki.md${pathname}`} />
    </Helmet>
  );
}
