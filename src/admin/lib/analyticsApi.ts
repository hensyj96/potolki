import { supabase } from '../../lib/supabase';
import { toEvent, toSession } from '../../lib/mappers';
import type { AnalyticsEvent, Session } from '../../db/database';

const PAGE_SIZE = 1000;

/** Fetches all events newer than `sinceMs` (ms epoch). Pages through 1000-row chunks. */
export async function fetchEvents(sinceMs: number): Promise<AnalyticsEvent[]> {
  const sinceIso = new Date(sinceMs).toISOString();
  const all: AnalyticsEvent[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data.map(toEvent));
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

export async function fetchSessions(sinceMs: number): Promise<Session[]> {
  const sinceIso = new Date(sinceMs).toISOString();
  const all: Session[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .gte('first_seen', sinceIso)
      .order('first_seen', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data.map(toSession));
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

/** Returns realtime online users count via RPC. */
export async function fetchOnlineCount(sinceMs = 5 * 60 * 1000): Promise<number> {
  const { data, error } = await supabase.rpc('online_users_count', { since_ms: sinceMs });
  if (error) {
    console.warn('online_users_count RPC failed:', error.message);
    return 0;
  }
  return (data as number) || 0;
}

/** Removes all analytics rows (admin only via RLS). */
export async function clearAnalytics(): Promise<void> {
  // Delete events first (FK -> sessions)
  await supabase.from('events').delete().gt('id', 0);
  await supabase.from('sessions').delete().neq('id', '');
}

/**
 * Seeds the database with 30-days worth of demo data.
 * Inserts both sessions and events (admin only).
 */
export async function seedDemoAnalytics(): Promise<void> {
  await clearAnalytics();

  const paths = ['/', '/services', '/gallery', '/prices', '/about', '/contact'];
  const langs: ('ru' | 'ro')[] = ['ru', 'ro'];
  const sources = ['google', 'facebook', 'direct', 'instagram', 'google'];

  const sessions: Array<{
    id: string; first_seen: string; last_seen: string;
    page_views: number; is_returning: boolean; source: string;
  }> = [];

  const events: Array<{
    type: AnalyticsEvent['type']; path: string; lang: 'ru' | 'ro';
    session_id: string; is_unique: boolean; referrer: string | null; meta: any;
    created_at: string;
  }> = [];

  for (let day = 30; day >= 0; day--) {
    const dayStart = Date.now() - day * 86400000;
    const visitorsToday = Math.floor(Math.random() * 25) + 15;
    for (let v = 0; v < visitorsToday; v++) {
      const sessionId = `demo_${day}_${v}_${Math.random().toString(36).slice(2, 8)}`;
      const sessionStart = dayStart + Math.random() * 86400000;
      const source = sources[Math.floor(Math.random() * sources.length)];
      const lang = langs[Math.floor(Math.random() * langs.length)];
      const pageCount = Math.floor(Math.random() * 4) + 1;
      const visited = new Set<string>();
      let lastSeen = sessionStart;

      for (let p = 0; p < pageCount; p++) {
        const path = paths[Math.floor(Math.random() * paths.length)];
        const isUnique = !visited.has(path);
        visited.add(path);
        const eventTime = sessionStart + p * (60_000 + Math.random() * 180_000);
        lastSeen = eventTime;
        events.push({
          type: 'page_view', path, lang, session_id: sessionId,
          is_unique: isUnique, referrer: source, meta: null,
          created_at: new Date(eventTime).toISOString(),
        });
        if (Math.random() < 0.15) {
          const ctaTypes: AnalyticsEvent['type'][] = ['cta_call', 'cta_whatsapp', 'cta_form'];
          events.push({
            type: ctaTypes[Math.floor(Math.random() * ctaTypes.length)],
            path, lang, session_id: sessionId, is_unique: false,
            referrer: source, meta: null,
            created_at: new Date(eventTime + 30000).toISOString(),
          });
        }
      }

      sessions.push({
        id: sessionId,
        first_seen: new Date(sessionStart).toISOString(),
        last_seen: new Date(lastSeen).toISOString(),
        page_views: pageCount,
        is_returning: Math.random() < 0.3,
        source,
      });
    }
  }

  // Sessions first (events have FK to sessions)
  // Chunked to keep payload size manageable.
  for (let i = 0; i < sessions.length; i += 500) {
    const chunk = sessions.slice(i, i + 500);
    const { error } = await supabase.from('sessions').upsert(chunk);
    if (error) throw error;
  }
  for (let i = 0; i < events.length; i += 500) {
    const chunk = events.slice(i, i + 500);
    const { error } = await supabase.from('events').insert(chunk);
    if (error) throw error;
  }
}
