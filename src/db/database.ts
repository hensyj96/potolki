/**
 * Frontend types (camelCase) for the admin panel.
 * Backed by Supabase tables in `public.*` (snake_case).
 * Conversion happens in `AdminContext` and `AnalyticsContext`.
 *
 * NOTE: Dexie/IndexedDB has been retired. This file no longer creates a
 * database. It only exports types and seed data.
 */

export type Lang = 'ru' | 'ro';
export type Room = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'office';

export type GalleryItem = {
  id: string;
  src: string;
  thumbSrc?: string;
  title: string;
  titleRo?: string;
  type: string;
  typeRo?: string;
  room: Room;
  order: number;
  createdAt: number;
  updatedAt: number;
};

export type SeoData = {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
};

export type SeoRecord = {
  id: string;
  path: string;
  lang: Lang;
  data: SeoData;
  updatedAt: number;
};

export type SeoHistoryRecord = {
  id?: number;
  path: string;
  lang: Lang;
  data: SeoData;
  createdAt: number;
};

export type EventType = 'page_view' | 'cta_call' | 'cta_whatsapp' | 'cta_form' | 'gallery_view' | 'lang_switch';

export type AnalyticsEvent = {
  id?: number;
  type: EventType;
  path: string;
  lang: Lang;
  sessionId: string;
  isUnique: boolean;
  referrer?: string;
  meta?: Record<string, any>;
  createdAt: number;
};

export type Session = {
  id: string;
  firstSeen: number;
  lastSeen: number;
  pageViews: number;
  isReturning: boolean;
  source?: string;
};

export type NotificationKind = 'gallery_added' | 'gallery_deleted' | 'seo_changed' | 'cta';

export type NotificationRecord = {
  id?: number;
  kind: NotificationKind;
  title: string;
  meta?: Record<string, any>;
  read: boolean;
  createdAt: number;
};

export const DEFAULT_SEO: Record<string, { ru: SeoData; ro: SeoData }> = {
  '/': {
    ru: {
      title: 'Potolki.md — Натяжные потолки в Молдове | Кишинёв',
      description: 'Натяжные потолки премиум-класса в Молдове. Бесплатный замер, гарантия 15 лет, монтаж за 1 день. Стоимость — после расчёта у менеджера.',
      keywords: 'натяжные потолки молдова, кишинев, потолки цена, монтаж потолков, натяжной потолок',
      ogTitle: 'Potolki.md — Натяжные потолки в Молдове',
      ogDescription: 'Лучшие натяжные потолки в Молдове. Бесплатный замер, гарантия 15 лет.',
    },
    ro: {
      title: 'Potolki.md — Tavane extensibile în Moldova | Chișinău',
      description: 'Tavane extensibile de lux în Moldova. Măsurare gratuită, garanție 15 ani, montaj în 1 zi. Costul — după calcul cu managerul.',
      keywords: 'tavane extensibile moldova, chisinau, tavan pret, montaj tavane, tavan extensibil',
      ogTitle: 'Potolki.md — Tavane extensibile în Moldova',
      ogDescription: 'Cele mai bune tavane extensibile din Moldova.',
    },
  },
  '/services': {
    ru: { title: 'Услуги — Натяжные потолки | Potolki.md', description: 'Матовые, глянцевые, сатиновые, тканевые, фотопечать, многоуровневые. Консультация и расчёт у менеджера.', keywords: 'виды натяжных потолков, матовые, глянцевые, сатиновые, тканевые, фотопечать' },
    ro: { title: 'Servicii — Tavane extensibile | Potolki.md', description: 'Mate, lucioase, satinate, textile, fotoimprimare, multinivel. Consultare și deviz cu managerul.', keywords: 'tipuri tavane extensibile, mate, lucioase, satinate' },
  },
  '/gallery': {
    ru: { title: 'Галерея работ — Potolki.md | Натяжные потолки Молдова', description: 'Фотогалерея реализованных проектов натяжных потолков по всей Молдове. Кишинёв, Бельцы, Тирасполь и другие города.', keywords: 'натяжные потолки фото, галерея потолков, дизайн потолков молдова' },
    ro: { title: 'Galerie lucrări — Potolki.md | Tavane extensibile Moldova', description: 'Galerie foto cu proiecte realizate de tavane extensibile în toată Moldova.', keywords: 'tavane extensibile foto, galerie tavane, design tavan moldova' },
  },
  '/prices': {
    ru: { title: 'Цены — Натяжные потолки в Молдове | Potolki.md', description: 'Каталог позиций без фиксированных цен на сайте. Итоговую сумму назовёт менеджер после бесплатного замера.', keywords: 'цены натяжные потолки, расчёт молдова, стоимость монтажа' },
    ro: { title: 'Prețuri — Tavane extensibile | Potolki.md', description: 'Catalog orientativ, fără tarife fixe online. Suma finală de la manager după măsurare gratuită.', keywords: 'preturi tavane extensibile, calcul moldova, cost montaj' },
  },
  '/about': {
    ru: { title: 'О компании — Potolki.md', description: 'Компания Potolki.md работает с 2014 года. Более 5000 выполненных проектов в Молдове. Гарантия 15 лет.', keywords: 'о компании, история, команда, сертификаты, натяжные потолки' },
    ro: { title: 'Despre companie — Potolki.md', description: 'Compania Potolki.md activează din 2014. Peste 5000 de proiecte realizate în Moldova. Garanție 15 ani.', keywords: 'despre companie, istorie, echipa, certificate, tavane extensibile' },
  },
  '/contact': {
    ru: { title: 'Контакты — Potolki.md', description: 'Свяжитесь с нами: +373 611 80 060. Бесплатный замер по всей Молдове. Перезвоним в течение 30 минут.', keywords: 'контакты, телефон, заказать замер, кишинев' },
    ro: { title: 'Contact — Potolki.md', description: 'Contactează-ne: +373 611 80 060. Măsurare gratuită în toată Moldova.', keywords: 'contact, telefon, comanda masurare, chisinau' },
  },
};
