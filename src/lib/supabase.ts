import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY не заданы. ' +
    'Создайте .env.local в корне проекта и заполните значения.'
  );
}

export const supabase = createClient<Database>(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'potolki-supabase-auth',
    },
    realtime: {
      params: { eventsPerSecond: 2 },
    },
  }
);

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Resolves a Storage object key to a CDN URL with optional image transforms.
 * Example: getStorageUrl('gallery-images', 'abc.webp', { width: 400 })
 */
export function getStorageUrl(
  bucket: string,
  path: string,
  transform?: { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' }
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, transform ? { transform } : undefined);
  return data.publicUrl;
}
