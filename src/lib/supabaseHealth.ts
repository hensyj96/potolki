import { supabase, isSupabaseConfigured } from './supabase';

export type SupabaseHealth =
  | { ok: true; latencyMs: number; sessionsCount: number; seoCount: number; tablesPresent: string[] }
  | { ok: false; stage: string; reason: string; hint: string };

/**
 * Развёрнутая диагностика связи с Supabase.
 * Показывает на каком шаге всё легло.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  // Stage 1: env
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      stage: '1. ENV',
      reason: 'VITE_SUPABASE_URL или VITE_SUPABASE_ANON_KEY не заданы',
      hint: 'Создайте .env.local в корне проекта и перезапустите dev-сервер',
    };
  }

  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  // Stage 2: голый fetch — проверяем что сеть отвечает (без supabase-js)
  const start = performance.now();
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok && res.status >= 500) {
      return {
        ok: false, stage: '2. Network',
        reason: `Сервер ответил ${res.status}`,
        hint: 'Проект Supabase может быть на паузе. Открой dashboard и нажми Resume.',
      };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false, stage: '2. Network',
      reason: `Запрос не дошёл до сервера: ${msg}`,
      hint: 'Возможно: проект paused / DNS-провайдер блокирует / расширения браузера. ' +
            'Открой URL в адресной строке: ' + url + '/rest/v1/',
    };
  }

  // Stage 3: чтение seo (RLS должен пускать всех)
  try {
    const seoRes = await supabase.from('seo').select('path', { count: 'exact', head: true });
    if (seoRes.error) {
      const code = seoRes.error.code;
      if (code === 'PGRST301' || seoRes.error.message.includes('JWT')) {
        return {
          ok: false, stage: '3. Auth',
          reason: `Ключ не принят: ${seoRes.error.message}`,
          hint: 'Перепроверь VITE_SUPABASE_ANON_KEY — он должен быть Publishable key (sb_publishable_...)',
        };
      }
      if (code === '42P01') {
        return {
          ok: false, stage: '4. Schema',
          reason: 'Таблица seo не найдена',
          hint: 'Запусти supabase/SETUP.sql в SQL Editor дашборда',
        };
      }
      return {
        ok: false, stage: '5. RLS',
        reason: `${code || ''} ${seoRes.error.message}`,
        hint: 'Проверь что выполнен блок RLS в SETUP.sql (политика seo_public_read)',
      };
    }

    // Stage 4: всё хорошо — собираем статистику
    const sessRes = await supabase.from('sessions').select('id', { count: 'exact', head: true });
    return {
      ok: true,
      latencyMs: Math.round(performance.now() - start),
      seoCount: seoRes.count || 0,
      sessionsCount: sessRes.count || 0,
      tablesPresent: ['seo', 'sessions'],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false, stage: '3. Query',
      reason: `Ошибка запроса: ${msg}`,
      hint: 'Откройте URL в адресной строке для проверки доступности',
    };
  }
}

/**
 * В DEV режиме экспонируем supabase в window для удобной отладки.
 */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any)._supabase = supabase;
  (window as any)._supabaseHealth = checkSupabaseHealth;
}
