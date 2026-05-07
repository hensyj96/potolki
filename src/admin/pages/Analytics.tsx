import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { AnalyticsEvent, Session } from '../../db/database';
import { fetchEvents, fetchSessions, clearAnalytics, seedDemoAnalytics } from '../lib/analyticsApi';
import { supabase } from '../../lib/supabase';
import {
  TrendingUp, Users, Eye, Phone, MessageCircle, FileText, Clock,
  Globe, ArrowUpRight, Activity, MapPin, MousePointerClick,
  Download, RefreshCcw, Trash2, Filter, X, Flame,
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { buildCsv } from '../lib/csv';
import { downloadFile } from '../lib/sitemap';

const RANGES = [
  { key: '24h', label: 'Сутки', ms: 24 * 60 * 60 * 1000 },
  { key: '7d', label: '7 дней', ms: 7 * 86400000 },
  { key: '30d', label: '30 дней', ms: 30 * 86400000 },
  { key: '90d', label: '90 дней', ms: 90 * 86400000 },
] as const;

type RangeKey = typeof RANGES[number]['key'];

const PAGE_LABELS: Record<string, string> = {
  '/': 'Главная', '/services': 'Услуги', '/gallery': 'Галерея',
  '/prices': 'Цены', '/about': 'О нас', '/contact': 'Контакты',
};

const SOURCE_ICONS: Record<string, string> = {
  google: '🔍', yandex: '🔍', facebook: '📘', instagram: '📷',
  telegram: '✈️', youtube: '▶️', direct: '🔗',
};

const EVENT_LABELS: Record<string, string> = {
  page_view: 'Просмотр страницы',
  cta_call: 'Клик на телефон',
  cta_whatsapp: 'WhatsApp',
  cta_form: 'Отправка формы',
  lang_switch: 'Смена языка',
  gallery_view: 'Просмотр фото',
};

const EVENTS_PER_PAGE = 25;

export default function Analytics() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const rangeKey = (searchParams.get('range') as RangeKey) || '7d';
  const filterPath = searchParams.get('path') || '';
  const filterSource = searchParams.get('source') || '';
  const filterLang = searchParams.get('lang') || '';
  const filterType = searchParams.get('type') || '';

  const [eventsPage, setEventsPage] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRefreshDemoConfirm, setShowRefreshDemoConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const range = RANGES.find((r) => r.key === rangeKey)!;
  const cutoff = Date.now() - range.ms;
  const prevCutoff = cutoff - range.ms;

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
    setEventsPage(0);
  };

  const [events, setEvents] = useState<AnalyticsEvent[] | null>(null);
  const [sessions, setSessions] = useState<Session[] | null>(null);

  const reload = useCallback(async () => {
    try {
      const [evs, ss] = await Promise.all([fetchEvents(prevCutoff), fetchSessions(prevCutoff)]);
      setEvents(evs);
      setSessions(ss);
    } catch (err) {
      console.error('Analytics load failed:', err);
      setEvents([]);
      setSessions([]);
    }
  }, [prevCutoff]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Realtime: refresh on any change to events / sessions
  useEffect(() => {
    const ch = supabase
      .channel('analytics-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => reload())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [reload]);

  const stats = useMemo(() => {
    if (!events || !sessions) return null;

    const filterEvent = (e: typeof events[number]) => {
      if (filterPath && e.path !== filterPath) return false;
      if (filterSource && (e.referrer || 'direct') !== filterSource) return false;
      if (filterLang && e.lang !== filterLang) return false;
      if (filterType && e.type !== filterType) return false;
      return true;
    };

    const filteredEvents = events.filter(filterEvent);

    const inRange = filteredEvents.filter((e) => e.createdAt >= cutoff);
    const inPrev = filteredEvents.filter((e) => e.createdAt >= prevCutoff && e.createdAt < cutoff);

    const sessionsInRange = sessions.filter((s) => s.firstSeen >= cutoff);
    const sessionsInPrev = sessions.filter((s) => s.firstSeen >= prevCutoff && s.firstSeen < cutoff);

    const pageViews = inRange.filter((e) => e.type === 'page_view');
    const pageViewsPrev = inPrev.filter((e) => e.type === 'page_view');

    const uniqueVisitors = new Set(pageViews.map((e) => e.sessionId)).size;
    const uniqueVisitorsPrev = new Set(pageViewsPrev.map((e) => e.sessionId)).size;

    const ctaCalls = inRange.filter((e) => e.type === 'cta_call').length;
    const ctaCallsPrev = inPrev.filter((e) => e.type === 'cta_call').length;
    const ctaWhatsapp = inRange.filter((e) => e.type === 'cta_whatsapp').length;
    const ctaForms = inRange.filter((e) => e.type === 'cta_form').length;
    const totalCta = ctaCalls + ctaWhatsapp + ctaForms;
    const conversionRate = uniqueVisitors > 0 ? (totalCta / uniqueVisitors) * 100 : 0;

    const bounced = sessionsInRange.filter((s) => s.pageViews <= 1).length;
    const bounceRate = sessionsInRange.length > 0 ? (bounced / sessionsInRange.length) * 100 : 0;

    const totalDuration = sessionsInRange.reduce((acc, s) => acc + (s.lastSeen - s.firstSeen), 0);
    const avgDuration = sessionsInRange.length > 0 ? totalDuration / sessionsInRange.length : 0;

    const pageViewMap: Record<string, number> = {};
    pageViews.forEach((e) => { pageViewMap[e.path] = (pageViewMap[e.path] || 0) + 1; });
    const topPages = Object.entries(pageViewMap)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views);

    const sourcesMap: Record<string, number> = {};
    sessionsInRange.forEach((s) => {
      const src = s.source || 'direct';
      sourcesMap[src] = (sourcesMap[src] || 0) + 1;
    });
    const sources = Object.entries(sourcesMap)
      .map(([source, count]) => ({
        source, count,
        percent: sessionsInRange.length > 0 ? (count / sessionsInRange.length) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const langMap: Record<string, number> = {};
    pageViews.forEach((e) => { langMap[e.lang] = (langMap[e.lang] || 0) + 1; });

    const isHourly = rangeKey === '24h';
    const buckets = isHourly ? 24 : range.ms / 86400000;
    const bucketMs = isHourly ? 3600000 : 86400000;
    const series = Array.from({ length: buckets }, (_, i) => {
      const start = cutoff + i * bucketMs;
      const end = start + bucketMs;
      const dayPv = pageViews.filter((e) => e.createdAt >= start && e.createdAt < end);
      const dayUnique = new Set(dayPv.map((e) => e.sessionId)).size;
      return { date: new Date(start), views: dayPv.length, unique: dayUnique };
    });

    const ctaBreakdown = [
      { label: 'Звонки', count: ctaCalls, icon: Phone, color: 'text-primary-300', bg: 'bg-primary-600/20' },
      { label: 'WhatsApp', count: ctaWhatsapp, icon: MessageCircle, color: 'text-green-300', bg: 'bg-green-500/20' },
      { label: 'Формы', count: ctaForms, icon: FileText, color: 'text-purple-300', bg: 'bg-purple-500/20' },
    ];

    const newVisitors = sessionsInRange.filter((s) => !s.isReturning).length;
    const returningVisitors = sessionsInRange.filter((s) => s.isReturning).length;

    // Hour×Day heatmap (last 7 days)
    const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
    const heatmapStart = Date.now() - 7 * 86400000;
    pageViews.forEach((e) => {
      if (e.createdAt < heatmapStart) return;
      const d = new Date(e.createdAt);
      const dayOfWeek = (d.getDay() + 6) % 7; // Mon=0..Sun=6
      heatmap[dayOfWeek][d.getHours()] += 1;
    });
    const heatmapMax = heatmap.flat().reduce((m, v) => Math.max(m, v), 0);

    const change = (cur: number, prev: number) => {
      if (prev === 0) return cur > 0 ? 100 : 0;
      return ((cur - prev) / prev) * 100;
    };

    return {
      pageViews: pageViews.length,
      uniqueVisitors,
      sessionsCount: sessionsInRange.length,
      bounceRate,
      avgDuration,
      conversionRate,
      ctaCalls, ctaWhatsapp, ctaForms, totalCta,
      pageViewsChange: change(pageViews.length, pageViewsPrev.length),
      uniqueVisitorsChange: change(uniqueVisitors, uniqueVisitorsPrev),
      ctaCallsChange: change(ctaCalls, ctaCallsPrev),
      sessionsChange: change(sessionsInRange.length, sessionsInPrev.length),
      topPages, sources, langMap, series, ctaBreakdown,
      newVisitors, returningVisitors,
      heatmap, heatmapMax,
      filteredEvents: filteredEvents.filter((e) => e.createdAt >= cutoff),
      newestAge: events.length > 0 ? Date.now() - Math.max(...events.map((e) => e.createdAt)) : 0,
      uniqueSources: Array.from(new Set(events.map((e) => e.referrer || 'direct'))),
      uniquePaths: Array.from(new Set(events.map((e) => e.path))),
    };
  }, [events, sessions, cutoff, prevCutoff, rangeKey, range.ms, filterPath, filterSource, filterLang, filterType]);

  const recentEventsPaged = useMemo(() => {
    if (!stats) return { items: [], total: 0, totalPages: 0 };
    const sorted = [...stats.filteredEvents].sort((a, b) => b.createdAt - a.createdAt);
    const totalPages = Math.ceil(sorted.length / EVENTS_PER_PAGE);
    const items = sorted.slice(eventsPage * EVENTS_PER_PAGE, (eventsPage + 1) * EVENTS_PER_PAGE);
    return { items, total: sorted.length, totalPages };
  }, [stats, eventsPage]);

  const handleExport = () => {
    if (!stats) return;
    const headers = ['Type', 'Path', 'Lang', 'SessionId', 'Source', 'Date'];
    const rows = stats.filteredEvents.map((e) => [
      e.type,
      e.path,
      e.lang,
      e.sessionId,
      e.referrer || '',
      new Date(e.createdAt).toISOString(),
    ]);
    const csv = buildCsv([headers, ...rows], { bom: true });
    downloadFile(csv, `analytics-${rangeKey}-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
    toast.success('Готово', `Экспортировано: ${rows.length} событий`);
  };

  const handleClearAll = async () => {
    setShowResetConfirm(false);
    setRefreshing(true);
    try {
      await clearAnalytics();
      await reload();
      toast.success('Очищено', 'Аналитика сброшена');
    } catch (err) {
      console.error(err);
      toast.error('Ошибка', 'Не удалось очистить — нужны права администратора');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshDemo = async () => {
    setShowRefreshDemoConfirm(false);
    setRefreshing(true);
    try {
      await seedDemoAnalytics();
      await reload();
      toast.success('Обновлено', 'Демо-данные пересозданы');
    } catch (err) {
      console.error(err);
      toast.error('Ошибка', 'Не удалось засеять демо-данные — нужны права администратора');
    } finally {
      setRefreshing(false);
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}м ${s}с` : `${s}с`;
  };

  const maxSeriesValue = Math.max(...stats.series.map((s) => s.views), 1);

  const mainStats = [
    { label: 'Просмотры', value: stats.pageViews, change: stats.pageViewsChange, icon: Eye,
      gradient: 'from-primary-600 to-blue-500', bg: 'from-primary-600/10 to-blue-500/5' },
    { label: 'Уникальные', value: stats.uniqueVisitors, change: stats.uniqueVisitorsChange, icon: Users,
      gradient: 'from-purple-600 to-pink-500', bg: 'from-purple-600/10 to-pink-500/5' },
    { label: 'Заявки', value: stats.totalCta, change: stats.ctaCallsChange, icon: MousePointerClick,
      gradient: 'from-green-600 to-emerald-500', bg: 'from-green-600/10 to-emerald-500/5' },
    { label: 'Конверсия', value: `${stats.conversionRate.toFixed(1)}%`, change: 0, icon: TrendingUp,
      gradient: 'from-orange-600 to-amber-500', bg: 'from-orange-600/10 to-amber-500/5', hideChange: true },
  ];

  const isStale = stats.newestAge > 24 * 60 * 60 * 1000;
  const hasFilters = filterPath || filterSource || filterLang || filterType;

  return (
    <div className="space-y-5">
      {/* Range + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-muted text-sm">Реальная статистика посещений и заявок</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white/[0.04] border border-white/10 rounded-xl p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setFilter('range', r.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  rangeKey === r.key ? 'bg-primary-600 text-white' : 'text-body hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-body hover:text-white text-sm transition-colors"
            title="Экспорт CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={() => setShowRefreshDemoConfirm(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-body hover:text-white text-sm transition-colors disabled:opacity-60"
            title="Обновить демо-данные"
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-sm transition-colors"
            title="Полностью очистить аналитику"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stale data banner */}
      {isStale && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-amber-300 text-sm">
            <Clock className="w-4 h-4" />
            <span>Демо-данные устарели (больше 24 часов)</span>
          </div>
          <button
            onClick={() => setShowRefreshDemoConfirm(true)}
            className="text-xs text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1.5 rounded-md font-medium transition-colors sm:ml-auto"
          >
            Обновить сейчас
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card rounded-2xl p-3 flex flex-col sm:flex-row gap-2 flex-wrap items-start sm:items-center">
        <div className="flex items-center gap-1.5 text-faint text-xs px-1">
          <Filter className="w-3.5 h-3.5" />
          Фильтры:
        </div>
        <select
          value={filterPath}
          onChange={(e) => setFilter('path', e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none cursor-pointer"
        >
          <option value="">Все страницы</option>
          {stats.uniquePaths.map((p) => (
            <option key={p} value={p} className="bg-dark-800">{PAGE_LABELS[p] || p}</option>
          ))}
        </select>
        <select
          value={filterSource}
          onChange={(e) => setFilter('source', e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none cursor-pointer"
        >
          <option value="">Все источники</option>
          {stats.uniqueSources.map((s) => (
            <option key={s} value={s} className="bg-dark-800">{s}</option>
          ))}
        </select>
        <select
          value={filterLang}
          onChange={(e) => setFilter('lang', e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none cursor-pointer"
        >
          <option value="">Все языки</option>
          <option value="ru" className="bg-dark-800">Русский</option>
          <option value="ro" className="bg-dark-800">Română</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilter('type', e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none cursor-pointer"
        >
          <option value="">Все события</option>
          {Object.entries(EVENT_LABELS).map(([k, v]) => (
            <option key={k} value={k} className="bg-dark-800">{v}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setSearchParams(new URLSearchParams(rangeKey !== '7d' ? { range: rangeKey } : {}), { replace: true });
              setEventsPage(0);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs transition-colors"
          >
            <X className="w-3 h-3" />
            Сбросить
          </button>
        )}
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {mainStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25, ease: 'easeOut' as const }}
            className="card rounded-2xl p-4 sm:p-5 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.bg} rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none`} />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${stat.gradient} items-center justify-center shadow-soft`}>
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                {!stat.hideChange && stat.change !== 0 && (
                  <div className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md ${
                    stat.change >= 0
                      ? 'bg-green-500/10 text-green-300 border border-green-500/20'
                      : 'bg-red-500/10 text-red-300 border border-red-500/20'
                  }`}>
                    <ArrowUpRight className={`w-3 h-3 ${stat.change < 0 ? 'rotate-90' : ''}`} />
                    {Math.abs(stat.change).toFixed(0)}%
                  </div>
                )}
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-white mb-0.5">{stat.value}</div>
              <div className="text-muted text-xs sm:text-sm">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Series chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.25 }}
        className="card rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-300" />
            </div>
            <div>
              <div className="text-white font-semibold">Динамика посещений</div>
              <div className="text-subtle text-xs">{range.label}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-500" />
              <span className="text-body">Просмотры</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-body">Уникальные</span>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-1 h-40 sm:h-48 overflow-x-auto pb-2">
          {stats.series.map((d, idx) => {
            const viewsHeightPct = (d.views / maxSeriesValue) * 100;
            const uniqueHeightPct = (d.unique / maxSeriesValue) * 100;
            const isLast = idx === stats.series.length - 1;
            return (
              <div key={idx} className="flex-1 min-w-[8px] sm:min-w-[20px] flex flex-col items-center gap-1.5 group">
                <div className="relative w-full flex-1 flex items-end gap-0.5">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${viewsHeightPct || 2}%` }}
                    transition={{ delay: 0.2 + idx * 0.005, duration: 0.4 }}
                    className={`flex-1 rounded-t-md ${
                      isLast ? 'bg-gradient-to-t from-primary-600 to-primary-400' : 'bg-primary-600/40'
                    } group-hover:from-primary-500 group-hover:to-primary-300 group-hover:bg-primary-500 transition-colors relative`}
                  >
                    {d.views > 0 && (
                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-dark-800 border border-white/10 rounded-md px-2 py-1 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-soft-lg">
                        <div>Просмотры: {d.views}</div>
                        <div className="text-purple-300">Уник: {d.unique}</div>
                      </div>
                    )}
                  </motion.div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${uniqueHeightPct || 2}%` }}
                    transition={{ delay: 0.25 + idx * 0.005, duration: 0.4 }}
                    className="flex-1 rounded-t-md bg-purple-500/40 group-hover:bg-purple-400 transition-colors"
                  />
                </div>
                <div className="text-[9px] sm:text-[10px] text-subtle font-medium whitespace-nowrap">
                  {rangeKey === '24h'
                    ? d.date.getHours() + 'ч'
                    : d.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.25 }}
        className="card rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-300" />
          </div>
          <div>
            <div className="text-white font-semibold">Активность по часам и дням</div>
            <div className="text-subtle text-xs">7 дней · {stats.heatmapMax > 0 ? `пик: ${stats.heatmapMax}` : 'нет данных'}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex">
              <div className="w-12 flex-shrink-0" />
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="flex-1 text-center text-[9px] text-faint font-mono">
                  {h % 3 === 0 ? h : ''}
                </div>
              ))}
            </div>
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, dIdx) => (
              <div key={day} className="flex items-center gap-0.5">
                <div className="w-12 flex-shrink-0 text-[10px] text-subtle text-right pr-2">{day}</div>
                {stats.heatmap[dIdx].map((value, h) => {
                  const intensity = stats.heatmapMax > 0 ? value / stats.heatmapMax : 0;
                  const opacity = value === 0 ? 0.04 : 0.18 + intensity * 0.7;
                  return (
                    <div
                      key={h}
                      className="flex-1 aspect-square rounded-[3px] m-px relative group cursor-pointer"
                      style={{
                        background: value === 0 ? `rgba(255,255,255,${opacity})` : `rgba(53, 132, 234, ${opacity})`,
                      }}
                      title={`${day} ${h}:00 — ${value} просмотров`}
                    >
                      {value > 0 && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-dark-800 border border-white/10 rounded px-1.5 py-0.5 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-soft-lg">
                          {value}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-faint">
              <span>Меньше</span>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((o, i) => (
                <span key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(53, 132, 234, ${o})` }} />
              ))}
              <span>Больше</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top pages */}
        <div className="lg:col-span-2 card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-300" />
            </div>
            <div>
              <div className="text-white font-semibold">Популярные страницы</div>
              <div className="text-subtle text-xs">По количеству просмотров</div>
            </div>
          </div>
          {stats.topPages.length === 0 ? (
            <div className="text-center py-8 text-subtle text-sm">Нет данных</div>
          ) : (
            <div className="space-y-2">
              {stats.topPages.map((p, i) => {
                const maxViews = stats.topPages[0].views;
                const widthPct = (p.views / maxViews) * 100;
                return (
                  <button
                    key={p.path}
                    onClick={() => setFilter('path', filterPath === p.path ? '' : p.path)}
                    className={`relative w-full p-3 rounded-xl bg-white/3 border ${
                      filterPath === p.path ? 'border-primary-500/40 bg-primary-600/10' : 'border-white/5 hover:bg-white/5'
                    } overflow-hidden text-left transition-colors`}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-600/15 to-transparent"
                      style={{ width: `${widthPct}%` }}
                    />
                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-primary-600/20 flex items-center justify-center text-primary-300 text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-medium text-sm truncate">{PAGE_LABELS[p.path] || p.path}</div>
                          <div className="text-subtle text-xs font-mono truncate">{p.path}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-white font-bold">{p.views}</div>
                        <div className="text-subtle text-xs">просмотров</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sources */}
        <div className="card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <div className="text-white font-semibold">Источники</div>
              <div className="text-subtle text-xs">Откуда приходят</div>
            </div>
          </div>
          {stats.sources.length === 0 ? (
            <div className="text-center py-8 text-subtle text-sm">Нет данных</div>
          ) : (
            <div className="space-y-2.5">
              {stats.sources.slice(0, 6).map((s) => (
                <button
                  key={s.source}
                  onClick={() => setFilter('source', filterSource === s.source ? '' : s.source)}
                  className={`w-full text-left rounded-lg p-2 transition-colors ${
                    filterSource === s.source ? 'bg-primary-600/10 border border-primary-500/40' : 'hover:bg-white/3 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="text-muted flex items-center gap-1.5">
                      <span>{SOURCE_ICONS[s.source] || '🌐'}</span>
                      <span className="capitalize">{s.source}</span>
                    </span>
                    <span className="text-subtle font-mono">{s.count} · {s.percent.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${s.percent}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CTA Funnel */}
        <div className="card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4 text-green-300" />
            </div>
            <div>
              <div className="text-white font-semibold">Заявки</div>
              <div className="text-subtle text-xs">CTA взаимодействия</div>
            </div>
          </div>
          <div className="space-y-3">
            {stats.ctaBreakdown.map((cta) => (
              <div key={cta.label} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${cta.bg} flex items-center justify-center`}>
                    <cta.icon className={`w-4 h-4 ${cta.color}`} />
                  </div>
                  <span className="text-muted text-sm font-medium">{cta.label}</span>
                </div>
                <div className="text-white font-bold text-lg">{cta.count}</div>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Конверсия</span>
                <span className="text-green-300 font-bold">{stats.conversionRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Bounce rate</span>
                <span className="text-amber-300 font-bold">{stats.bounceRate.toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Среднее время</span>
                <span className="text-white font-bold">{formatDuration(stats.avgDuration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visitors split */}
        <div className="card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-pink-300" />
            </div>
            <div>
              <div className="text-white font-semibold">Посетители</div>
              <div className="text-subtle text-xs">Новые vs возвращающиеся</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-primary-600/10 border border-primary-500/20">
              <div className="text-primary-300 text-xs mb-1">Новые</div>
              <div className="font-display text-2xl font-bold text-white">{stats.newVisitors}</div>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="text-purple-300 text-xs mb-1">Вернулись</div>
              <div className="font-display text-2xl font-bold text-white">{stats.returningVisitors}</div>
            </div>
          </div>
          <div>
            <div className="text-faint text-xs uppercase tracking-wider font-medium mb-2">По языкам</div>
            {Object.keys(stats.langMap).length === 0 ? (
              <div className="text-subtle text-xs">Нет данных</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.langMap).map(([lang, count]) => {
                  const total = (stats.langMap['ru'] || 0) + (stats.langMap['ro'] || 0);
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={lang}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted flex items-center gap-1.5">
                          <span>{lang === 'ru' ? '🇷🇺' : '🇲🇩'}</span>
                          {lang === 'ru' ? 'Русский' : 'Română'}
                        </span>
                        <span className="text-subtle font-mono">{count} · {pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${lang === 'ru' ? 'bg-blue-500' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent events with pagination */}
        <div className="card rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold">События</div>
              <div className="text-subtle text-xs">{recentEventsPaged.total} всего</div>
            </div>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 -mr-1 flex-1">
            {recentEventsPaged.items.length === 0 ? (
              <div className="text-center py-6 text-subtle text-sm">Нет событий</div>
            ) : (
              recentEventsPaged.items.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/3 transition-colors"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    ev.type === 'page_view' ? 'bg-primary-600/20 text-primary-300' :
                    ev.type === 'cta_call' ? 'bg-green-500/20 text-green-300' :
                    ev.type === 'cta_whatsapp' ? 'bg-emerald-500/20 text-emerald-300' :
                    ev.type === 'cta_form' ? 'bg-purple-500/20 text-purple-300' :
                    ev.type === 'lang_switch' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-white/10 text-body'
                  }`}>
                    {ev.type === 'page_view' ? <Eye className="w-3.5 h-3.5" /> :
                     ev.type === 'cta_call' ? <Phone className="w-3.5 h-3.5" /> :
                     ev.type === 'cta_whatsapp' ? <MessageCircle className="w-3.5 h-3.5" /> :
                     ev.type === 'cta_form' ? <FileText className="w-3.5 h-3.5" /> :
                     ev.type === 'lang_switch' ? <Globe className="w-3.5 h-3.5" /> :
                     <MapPin className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">
                      {EVENT_LABELS[ev.type]} {ev.path && ev.type === 'page_view' ? `· ${PAGE_LABELS[ev.path] || ev.path}` : ''}
                    </div>
                    <div className="text-subtle text-[10px] flex items-center gap-1.5">
                      <span>{new Date(ev.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>·</span>
                      <span>{ev.lang.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {recentEventsPaged.totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <button
                onClick={() => setEventsPage((p) => Math.max(0, p - 1))}
                disabled={eventsPage === 0}
                className="text-xs text-body hover:text-white disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 rounded transition-colors"
              >
                ← Назад
              </button>
              <span className="text-faint text-[10px] font-mono">
                {eventsPage + 1} / {recentEventsPaged.totalPages}
              </span>
              <button
                onClick={() => setEventsPage((p) => Math.min(recentEventsPaged.totalPages - 1, p + 1))}
                disabled={eventsPage >= recentEventsPaged.totalPages - 1}
                className="text-xs text-body hover:text-white disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 rounded transition-colors"
              >
                Вперёд →
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showResetConfirm}
        title="Очистить аналитику?"
        description="Все события и сессии будут удалены. Это действие нельзя отменить."
        confirmText="Очистить всё"
        variant="danger"
        requireType="DELETE"
        icon={<Trash2 className="w-5 h-5 text-red-300" />}
        onConfirm={handleClearAll}
        onCancel={() => setShowResetConfirm(false)}
      />

      <ConfirmModal
        open={showRefreshDemoConfirm}
        title="Обновить демо-данные?"
        description="Текущие события и сессии будут заменены свежими демо-данными за последние 30 дней."
        confirmText="Обновить"
        variant="warning"
        icon={<RefreshCcw className="w-5 h-5 text-amber-300" />}
        onConfirm={handleRefreshDemo}
        onCancel={() => setShowRefreshDemoConfirm(false)}
      />
    </div>
  );
}
