import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Image as ImageIcon, ArrowRight, TrendingUp, Eye, Calendar,
  Plus, Activity, BarChart3, ArrowUpRight, Users, MousePointerClick, Sun, Moon, Coffee,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import type { AnalyticsEvent, GalleryItem } from '../../db/database';
import { fetchEvents } from '../lib/analyticsApi';
import { supabase } from '../../lib/supabase';
import GalleryThumb from '../components/GalleryThumb';
import Sparkline from '../components/Sparkline';
import PhotoPreviewModal from '../components/PhotoPreviewModal';

const ROOM_LABELS: Record<string, string> = {
  living: 'Залы',
  kitchen: 'Кухни',
  bedroom: 'Спальни',
  bathroom: 'Санузлы',
  office: 'Офисы',
};

const ROOM_COLORS: Record<string, string> = {
  living: 'bg-primary-500',
  kitchen: 'bg-purple-500',
  bedroom: 'bg-pink-500',
  bathroom: 'bg-cyan-500',
  office: 'bg-amber-500',
};

const SEO_TIPS = [
  'Title до 60 символов, ключевое слово в начале — даёт лучший CTR в выдаче.',
  'Description 120–160 символов, естественным языком — Google использует его как сниппет.',
  'OG-изображение 1200×630 — даёт красивые превью в Facebook, WhatsApp, Telegram.',
  'Уникальные мета-теги для каждой страницы и каждого языка — без дублей.',
  'Используйте hreflang — сообщает поисковикам о двуязычности сайта.',
  'Не забывайте про canonical — особенно если есть параметры в URL.',
  'Заголовок H1 на странице должен совпадать или быть близок к Title.',
  'Keywords уже не учитываются Google, но всё ещё актуальны для Yandex.',
  'Description дублируется между страницами? Поисковики могут показывать свой текст вместо вашего.',
  'Длина URL имеет значение: чем короче, тем лучше для запоминания и CTR.',
];

function getGreeting(): { text: string; icon: typeof Sun } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: 'Доброе утро', icon: Coffee };
  if (h >= 12 && h < 18) return { text: 'Добрый день', icon: Sun };
  if (h >= 18 && h < 23) return { text: 'Добрый вечер', icon: Sun };
  return { text: 'Доброй ночи', icon: Moon };
}

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export default function Dashboard() {
  const { gallery } = useAdmin();
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

  const last7d = useMemo(() => Date.now() - 7 * 86400000, []);
  const [events, setEvents] = useState<AnalyticsEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchEvents(last7d)
        .then((evs) => { if (!cancelled) setEvents(evs); })
        .catch(() => { if (!cancelled) setEvents([]); });
    };
    load();
    const ch = supabase
      .channel('dashboard-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [last7d]);

  const greeting = useMemo(() => getGreeting(), []);
  const tipOfDay = useMemo(() => SEO_TIPS[dayOfYear(new Date()) % SEO_TIPS.length], []);

  const analyticsStats = useMemo(() => {
    const e = events || [];
    const pageViews = e.filter((ev) => ev.type === 'page_view').length;
    const uniqueVisitors = new Set(e.filter((ev) => ev.type === 'page_view').map((ev) => ev.sessionId)).size;
    const ctaTotal = e.filter((ev) => ev.type === 'cta_call' || ev.type === 'cta_whatsapp' || ev.type === 'cta_form').length;
    const conversion = uniqueVisitors > 0 ? (ctaTotal / uniqueVisitors) * 100 : 0;
    return { pageViews, uniqueVisitors, ctaTotal, conversion };
  }, [events]);

  // Per-day sparklines for last 7 days
  const sparklines = useMemo(() => {
    const e = events || [];
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      const start = d.getTime();
      const end = start + 86400000;
      const inDay = e.filter((ev) => ev.createdAt >= start && ev.createdAt < end);
      return {
        views: inDay.filter((ev) => ev.type === 'page_view').length,
        unique: new Set(inDay.filter((ev) => ev.type === 'page_view').map((ev) => ev.sessionId)).size,
        cta: inDay.filter((ev) => ev.type === 'cta_call' || ev.type === 'cta_whatsapp' || ev.type === 'cta_form').length,
      };
    });
    return {
      views: days.map((d) => d.views),
      unique: days.map((d) => d.unique),
      cta: days.map((d) => d.cta),
    };
  }, [events]);

  const recentItems = useMemo(
    () => [...gallery].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6),
    [gallery]
  );

  const distribution = useMemo(() => {
    if (gallery.length === 0) return [];
    const counts: Record<string, number> = {};
    gallery.forEach((item) => { counts[item.room] = (counts[item.room] || 0) + 1; });
    return Object.entries(counts).map(([room, count]) => ({
      room, count,
      label: ROOM_LABELS[room] || room,
      color: ROOM_COLORS[room] || 'bg-gray-500',
      percent: Math.round((count / gallery.length) * 100),
    })).sort((a, b) => b.count - a.count);
  }, [gallery]);

  const activity = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return { date: d, count: 0 };
    });
    gallery.forEach((item) => {
      const itemDay = new Date(item.createdAt);
      itemDay.setHours(0, 0, 0, 0);
      const idx = days.findIndex((d) => d.date.getTime() === itemDay.getTime());
      if (idx >= 0) days[idx].count += 1;
    });
    return days;
  }, [gallery]);

  const maxActivity = Math.max(...activity.map((d) => d.count), 1);

  const stats = [
    { label: 'Просмотры', value: analyticsStats.pageViews, change: 'за 7 дней', icon: Eye,
      color: 'from-primary-600 to-blue-500', bg: 'from-primary-600/10 to-blue-500/5',
      to: '/admin/analytics', spark: sparklines.views, sparkColor: 'text-primary-300' },
    { label: 'Посетителей', value: analyticsStats.uniqueVisitors, change: 'уникальных', icon: Users,
      color: 'from-purple-600 to-pink-500', bg: 'from-purple-600/10 to-pink-500/5',
      to: '/admin/analytics', spark: sparklines.unique, sparkColor: 'text-purple-300' },
    { label: 'Заявки (CTA)', value: analyticsStats.ctaTotal, change: `${analyticsStats.conversion.toFixed(1)}% конверсия`, icon: MousePointerClick,
      color: 'from-green-600 to-emerald-500', bg: 'from-green-600/10 to-emerald-500/5',
      to: '/admin/analytics', spark: sparklines.cta, sparkColor: 'text-green-300' },
    { label: 'Фото в галерее', value: gallery.length, change: `+${activity.reduce((s, d) => s + d.count, 0)} за 7д`, icon: ImageIcon,
      color: 'from-orange-600 to-amber-500', bg: 'from-orange-600/10 to-amber-500/5',
      to: '/admin/gallery', spark: activity.map((d) => d.count), sparkColor: 'text-amber-300' },
  ];

  const quickActions = [
    { title: 'Аналитика', desc: 'Посетители и заявки в реальном времени', icon: BarChart3, to: '/admin/analytics', color: 'bg-cyan-500/15 text-cyan-300' },
    { title: 'Добавить фото', desc: 'Загрузить новое в галерею', icon: Plus, to: '/admin/gallery', color: 'bg-purple-500/15 text-purple-300' },
    { title: 'Изменить SEO', desc: 'Управление мета-тегами', icon: Search, to: '/admin/seo', color: 'bg-primary-600/15 text-primary-300' },
  ];

  const GreetingIcon = greeting.icon;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' as const }}
        className="card rounded-2xl p-5 sm:p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary-300 text-sm font-medium mb-1">
              <GreetingIcon className="w-4 h-4" />
              {greeting.text}!
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
              Добро пожаловать, Администратор
            </h1>
            <p className="text-muted text-sm">
              Сегодня {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Link to="/admin/gallery" className="btn-primary justify-center self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            Добавить фото
          </Link>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => {
          const Wrapper: any = stat.to ? Link : 'div';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25, ease: 'easeOut' as const }}
            >
              <Wrapper
                to={stat.to}
                className={`block card rounded-2xl p-4 sm:p-5 relative overflow-hidden group ${stat.to ? 'card-hover' : ''}`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.bg} rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none`} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`inline-flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${stat.color} items-center justify-center shadow-soft`}>
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    {stat.to && (
                      <ArrowUpRight className="w-4 h-4 text-faint group-hover:text-primary-300 transition-colors" />
                    )}
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-white mb-0.5">{stat.value}</div>
                  <div className="text-muted text-xs sm:text-sm">{stat.label}</div>
                  {stat.spark && stat.spark.some((v) => v > 0) && (
                    <div className={`mt-2 -mx-1 ${stat.sparkColor}`}>
                      <Sparkline values={stat.spark} height={28} stroke="currentColor" fill="currentColor" />
                    </div>
                  )}
                  {stat.change && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary-300 px-2 py-0.5 rounded-md bg-primary-600/10 border border-primary-500/15">
                      {stat.change}
                    </div>
                  )}
                </div>
              </Wrapper>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Activity chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.25, ease: 'easeOut' as const }}
          className="lg:col-span-2 card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary-300" />
              </div>
              <div>
                <div className="text-white font-semibold">Добавления фото</div>
                <div className="text-subtle text-xs">Последние 7 дней</div>
              </div>
            </div>
            <span className="text-primary-300 font-bold">+{activity.reduce((s, d) => s + d.count, 0)}</span>
          </div>

          <div className="flex items-end justify-between gap-2 h-32 sm:h-40">
            {activity.map((day, i) => {
              const heightPct = (day.count / maxActivity) * 100;
              const isToday = day.date.toDateString() === new Date().toDateString();
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex-1 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct || 4}%` }}
                      transition={{ delay: 0.25 + i * 0.04, duration: 0.4 }}
                      className={`w-full rounded-lg ${
                        isToday ? 'bg-gradient-to-t from-primary-600 to-primary-400' : 'bg-gradient-to-t from-primary-700/40 to-primary-500/40'
                      } group-hover:from-primary-500 group-hover:to-primary-300 transition-colors relative`}
                    >
                      {day.count > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-dark-800 border border-white/10 rounded-md px-2 py-0.5 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {day.count}
                        </div>
                      )}
                    </motion.div>
                  </div>
                  <div className="text-[10px] text-subtle font-medium">
                    {day.date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Distribution chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.25, ease: 'easeOut' as const }}
          className="card rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <div className="text-white font-semibold">По категориям</div>
              <div className="text-subtle text-xs">Распределение фото</div>
            </div>
          </div>

          {distribution.length === 0 ? (
            <div className="text-center py-8 text-subtle text-sm">Пока нет фото</div>
          ) : (
            <div className="space-y-3">
              {distribution.map((item, i) => (
                <motion.div
                  key={item.room}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                >
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="text-muted">{item.label}</span>
                    <span className="text-subtle font-mono">{item.count} · {item.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ delay: 0.4 + i * 0.04, duration: 0.5 }}
                      className={`h-full ${item.color} rounded-full`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-white font-semibold text-base sm:text-lg mb-3">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.04, duration: 0.25 }}
            >
              <Link
                to={action.to}
                className="card card-hover rounded-2xl p-4 sm:p-5 flex items-start gap-4 group"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm sm:text-base mb-0.5">{action.title}</div>
                  <div className="text-muted text-xs sm:text-sm">{action.desc}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-faint group-hover:text-primary-300 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-base sm:text-lg">Последние фото</h2>
          <Link to="/admin/gallery" className="text-primary-300 hover:text-primary-200 text-xs sm:text-sm font-medium flex items-center gap-1">
            Все фото <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {recentItems.length === 0 ? (
          <div className="card rounded-2xl p-8 text-center text-muted text-sm">Пока нет фото в галерее</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentItems.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.04 }}
                onClick={() => setPreviewItem(item)}
                className="rounded-xl overflow-hidden bg-white/[0.04] border border-white/10 group text-left hover:border-primary-500/40 transition-colors"
              >
                <div className="aspect-square overflow-hidden">
                  <GalleryThumb src={item.src} thumbSrc={item.thumbSrc} alt={item.title} />
                </div>
                <div className="p-2">
                  <div className="text-white text-xs font-medium truncate">{item.title}</div>
                  <div className="text-subtle text-[10px] flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Tip of the day */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.25 }}
        className="card rounded-2xl p-5 border border-primary-500/20 bg-gradient-to-br from-primary-600/10 to-transparent"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-primary-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-primary-200 font-semibold text-sm mb-1">SEO-совет дня</div>
            <p className="text-body text-sm leading-relaxed">{tipOfDay}</p>
            <Link to="/admin/seo" className="inline-flex items-center gap-1 text-primary-300 hover:text-primary-200 text-xs font-medium mt-2 transition-colors">
              К SEO редактору <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </motion.div>

      <PhotoPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
}
