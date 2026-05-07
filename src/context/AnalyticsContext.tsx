import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import type { EventType, Lang } from '../db/database';

const SESSION_KEY = 'potolki_session_id';
const SESSION_TIMESTAMP_KEY = 'potolki_session_ts';
const FIRST_VISIT_KEY = 'potolki_first_visit';
const SESSION_TIMEOUT = 30 * 60 * 1000;

function getOrCreateSessionId(): { sessionId: string; isNew: boolean; isReturning: boolean } {
  const stored = localStorage.getItem(SESSION_KEY);
  const lastTs = parseInt(localStorage.getItem(SESSION_TIMESTAMP_KEY) || '0', 10);
  const now = Date.now();

  if (stored && now - lastTs < SESSION_TIMEOUT) {
    localStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString());
    return { sessionId: stored, isNew: false, isReturning: false };
  }

  const seenBefore = !!localStorage.getItem(FIRST_VISIT_KEY);
  if (!seenBefore) localStorage.setItem(FIRST_VISIT_KEY, now.toString());

  const sessionId = `s_${now}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(SESSION_KEY, sessionId);
  localStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString());

  return { sessionId, isNew: true, isReturning: seenBefore };
}

function getReferrerSource(): string {
  const ref = document.referrer;
  if (!ref) return 'direct';
  try {
    const url = new URL(ref);
    const host = url.hostname.replace('www.', '');
    if (host === window.location.hostname) return 'direct';
    if (host.includes('google')) return 'google';
    if (host.includes('yandex')) return 'yandex';
    if (host.includes('facebook') || host.includes('fb.')) return 'facebook';
    if (host.includes('instagram')) return 'instagram';
    if (host.includes('t.me') || host.includes('telegram')) return 'telegram';
    if (host.includes('youtube')) return 'youtube';
    return host;
  } catch {
    return 'direct';
  }
}

type AnalyticsContextType = {
  trackEvent: (type: EventType, meta?: Record<string, any>) => Promise<void>;
};

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

async function ensureSession(sessionId: string, source: string, isReturning: boolean) {
  const nowIso = new Date().toISOString();
  // Try update first; if 0 rows affected, insert.
  const { data: updated, error: updErr } = await supabase
    .from('sessions')
    .update({ last_seen: nowIso })
    .eq('id', sessionId)
    .select('id');
  if (!updErr && updated && updated.length > 0) return;

  await supabase.from('sessions').insert({
    id: sessionId,
    first_seen: nowIso,
    last_seen: nowIso,
    page_views: 0,
    is_returning: isReturning,
    source,
  });
}

async function bumpPageViews(sessionId: string) {
  // Supabase doesn't have atomic increment via REST without RPC. Read+write best-effort.
  const { data } = await supabase
    .from('sessions')
    .select('page_views')
    .eq('id', sessionId)
    .maybeSingle();
  await supabase
    .from('sessions')
    .update({ page_views: (data?.page_views ?? 0) + 1 })
    .eq('id', sessionId);
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { i18n } = useTranslation();
  const visitedPaths = useRef<Set<string>>(new Set());
  const sessionInitialized = useRef(false);

  const trackEvent = useCallback(async (type: EventType, meta?: Record<string, any>) => {
    try {
      if (location.pathname.startsWith('/admin')) return;

      const { sessionId, isReturning } = getOrCreateSessionId();
      const lang = (i18n.language === 'ro' ? 'ro' : 'ru') as Lang;
      const isUnique = type === 'page_view' && !visitedPaths.current.has(location.pathname);
      if (type === 'page_view') visitedPaths.current.add(location.pathname);

      const source = getReferrerSource();
      await ensureSession(sessionId, source, isReturning);

      await supabase.from('events').insert({
        type,
        path: location.pathname,
        lang,
        session_id: sessionId,
        is_unique: isUnique,
        referrer: source,
        meta: meta ?? null,
      });

      if (type === 'page_view') {
        bumpPageViews(sessionId).catch(() => { /* best effort */ });
      }
    } catch (err) {
      // Don't break the public site if analytics breaks
      console.warn('Track event error:', err);
    }
  }, [location.pathname, i18n.language]);

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    if (!sessionInitialized.current) {
      getOrCreateSessionId();
      sessionInitialized.current = true;
    }
    trackEvent('page_view');
  }, [location.pathname, trackEvent]);

  return (
    <AnalyticsContext.Provider value={{ trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    return { trackEvent: async () => {} } as AnalyticsContextType;
  }
  return ctx;
}
