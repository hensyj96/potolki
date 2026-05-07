import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { toGallery, toNotification } from '../lib/mappers';
import { deleteImageRefs } from '../admin/lib/imageStore';
import { DEFAULT_SEO } from '../db/database';
import type {
  GalleryItem,
  SeoData,
  NotificationRecord,
  NotificationKind,
  Lang,
} from '../db/database';

export type { GalleryItem, SeoData, NotificationRecord, NotificationKind };

export type SeoConfig = {
  [path: string]: { ru: SeoData; ro: SeoData };
};

type AdminContextType = {
  // SEO
  seoConfig: SeoConfig;
  updateSeo: (path: string, lang: Lang, data: SeoData) => Promise<void>;
  resetSeo: () => Promise<void>;
  resetSeoForPage: (path: string, lang: Lang) => Promise<void>;

  // Gallery
  gallery: GalleryItem[];
  addGalleryItem: (item: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<GalleryItem>;
  addGalleryItemRaw: (item: GalleryItem) => Promise<void>;
  updateGalleryItem: (id: string, data: Partial<GalleryItem>) => Promise<void>;
  deleteGalleryItem: (id: string, opts?: { keepImages?: boolean }) => Promise<GalleryItem | undefined>;
  reorderGallery: (orderedIds: string[]) => Promise<void>;

  // Notifications
  notifications: NotificationRecord[];
  addNotification: (n: Omit<NotificationRecord, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;

  // Auth
  isAuthenticated: boolean;
  authReady: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<{ ok: boolean; error?: string }>;

  // DB status
  dbReady: boolean;
};

const AdminContext = createContext<AdminContextType | null>(null);

const DEFAULT_SEO_DATA: SeoData = { title: '', description: '' };

function dbToCamel(row: Record<string, any>): GalleryItem {
  return toGallery(row as any);
}

function camelToDb(data: Partial<GalleryItem>): Record<string, any> {
  const out: Record<string, any> = {};
  if (data.id !== undefined) out.id = data.id;
  if (data.src !== undefined) out.src = data.src;
  if (data.thumbSrc !== undefined) out.thumb_src = data.thumbSrc ?? null;
  if (data.title !== undefined) out.title = data.title;
  if (data.titleRo !== undefined) out.title_ro = data.titleRo ?? null;
  if (data.type !== undefined) out.type = data.type;
  if (data.typeRo !== undefined) out.type_ro = data.typeRo ?? null;
  if (data.room !== undefined) out.room = data.room;
  if (data.order !== undefined) out.order = data.order;
  if (data.createdAt !== undefined) out.created_at = new Date(data.createdAt).toISOString();
  return out;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [dbReady, setDbReady] = useState(false);
  const [galleryRaw, setGalleryRaw] = useState<GalleryItem[]>([]);
  const [seoConfig, setSeoConfig] = useState<SeoConfig>({});
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  // ============== Auth bootstrap ==============
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data.session;
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email ?? null);
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email ?? null);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ============== Initial loads + realtime ==============
  // SEO is public-readable, so always load.
  useEffect(() => {
    let cancelled = false;

    async function loadSeo() {
      const { data, error } = await supabase.from('seo').select('path, lang, data');
      if (error) {
        console.error('SEO load failed:', error);
        return;
      }
      if (cancelled) return;
      const cfg: SeoConfig = {};
      (data || []).forEach((row) => {
        if (!cfg[row.path]) {
          cfg[row.path] = { ru: { ...DEFAULT_SEO_DATA }, ro: { ...DEFAULT_SEO_DATA } };
        }
        cfg[row.path][row.lang as Lang] = row.data as SeoData;
      });
      setSeoConfig(cfg);
    }

    async function loadGallery() {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('order', { ascending: true });
      if (error) {
        console.error('Gallery load failed:', error);
        return;
      }
      if (cancelled) return;
      setGalleryRaw((data || []).map(dbToCamel));
    }

    Promise.all([loadSeo(), loadGallery()]).finally(() => {
      if (!cancelled) setDbReady(true);
    });

    // Realtime subscriptions (work even for anon, since we only listen)
    const channel = supabase
      .channel('public-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, () => loadGallery())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seo' }, () => loadSeo())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Notifications — only for authenticated admins (RLS blocks anon)
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error || cancelled) return;
      setNotifications((data || []).map(toNotification));
    }
    load();

    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  const gallery = useMemo(() => {
    return [...galleryRaw].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return b.createdAt - a.createdAt;
    });
  }, [galleryRaw]);

  // ============== SEO ==============
  const updateSeo = useCallback(async (path: string, lang: Lang, data: SeoData) => {
    const { error } = await supabase
      .from('seo')
      .upsert({ path, lang, data }, { onConflict: 'path,lang' });
    if (error) throw error;
    // Update local cache immediately (do not rely solely on realtime delivery)
    setSeoConfig((prev) => {
      const current = prev[path] || { ru: { ...DEFAULT_SEO_DATA }, ro: { ...DEFAULT_SEO_DATA } };
      return { ...prev, [path]: { ...current, [lang]: data } };
    });
    // Realtime listener will refresh seoConfig.
    // Notification (best effort)
    await supabase.from('notifications').insert({
      kind: 'seo_changed',
      title: `Обновлены мета-теги ${path} (${lang.toUpperCase()})`,
      meta: { path, lang },
      read: false,
    });
  }, []);

  const resetSeo = useCallback(async () => {
    const rows = Object.entries(DEFAULT_SEO).flatMap(([path, langs]) => [
      { path, lang: 'ru' as Lang, data: langs.ru },
      { path, lang: 'ro' as Lang, data: langs.ro },
    ]);
    const { error } = await supabase.from('seo').upsert(rows, { onConflict: 'path,lang' });
    if (error) throw error;
    // Immediate local reset
    setSeoConfig(DEFAULT_SEO);
  }, []);

  const resetSeoForPage = useCallback(async (path: string, lang: Lang) => {
    const defaults = DEFAULT_SEO[path]?.[lang];
    if (!defaults) return;
    const { error } = await supabase
      .from('seo')
      .upsert({ path, lang, data: defaults }, { onConflict: 'path,lang' });
    if (error) throw error;
    setSeoConfig((prev) => {
      const current = prev[path] || { ru: { ...DEFAULT_SEO_DATA }, ro: { ...DEFAULT_SEO_DATA } };
      return { ...prev, [path]: { ...current, [lang]: defaults } };
    });
  }, []);

  // ============== Gallery ==============
  const addGalleryItem = useCallback(
    async (item: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
      // Compute next order
      const { data: maxRow } = await supabase
        .from('gallery')
        .select('"order"')
        .order('order', { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextOrder = (maxRow?.order ?? -1) + 1;

      const insert = camelToDb({ ...item, order: nextOrder });
      const { data, error } = await supabase
        .from('gallery')
        .insert(insert)
        .select()
        .single();
      if (error) throw error;

      const created = dbToCamel(data);
      await supabase.from('notifications').insert({
        kind: 'gallery_added',
        title: `Добавлено фото: ${created.title}`,
        meta: { id: created.id },
        read: false,
      });
      return created;
    },
    []
  );

  const addGalleryItemRaw = useCallback(async (item: GalleryItem) => {
    const insert = camelToDb(item);
    const { error } = await supabase.from('gallery').upsert(insert);
    if (error) throw error;
  }, []);

  const updateGalleryItem = useCallback(async (id: string, data: Partial<GalleryItem>) => {
    const update = camelToDb(data) as Database['public']['Tables']['gallery']['Update'];
    const { error } = await supabase.from('gallery').update(update).eq('id', id);
    if (error) throw error;
  }, []);

  const deleteGalleryItem = useCallback(async (id: string, opts?: { keepImages?: boolean }) => {
    const { data: row, error: fetchErr } = await supabase
      .from('gallery')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr || !row) return undefined;

    const item = dbToCamel(row);

    const { error } = await supabase.from('gallery').delete().eq('id', id);
    if (error) throw error;

    if (!opts?.keepImages) {
      try { await deleteImageRefs(item); } catch { /* ignore */ }
    }

    await supabase.from('notifications').insert({
      kind: 'gallery_deleted',
      title: `Удалено фото: ${item.title}`,
      meta: { id },
      read: false,
    });

    return item;
  }, []);

  const reorderGallery = useCallback(async (orderedIds: string[]) => {
    // We need atomic-ish update. Supabase doesn't support tx via REST, so
    // upsert each row. They'll arrive together via realtime.
    const updates = orderedIds.map((id, i) =>
      supabase.from('gallery').update({ order: i }).eq('id', id)
    );
    const results = await Promise.all(updates);
    const firstErr = results.find((r) => r.error);
    if (firstErr?.error) throw firstErr.error;
  }, []);

  // ============== Notifications ==============
  const addNotification = useCallback(async (n: Omit<NotificationRecord, 'id' | 'createdAt' | 'read'>) => {
    await supabase.from('notifications').insert({
      kind: n.kind,
      title: n.title,
      meta: n.meta ?? null,
      read: false,
    });
  }, []);

  const markNotificationRead = useCallback(async (id: number) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    await supabase.from('notifications').update({ read: true }).eq('read', false);
  }, []);

  const clearNotifications = useCallback(async () => {
    await supabase.from('notifications').delete().gt('id', 0);
  }, []);

  // ============== Auth ==============
  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const changePassword = useCallback(async (current: string, next: string) => {
    if (next.length < 6) return { ok: false as const, error: 'Слишком короткий пароль' };
    // Re-verify current password to prevent session-hijack abuse.
    const { data: sess } = await supabase.auth.getUser();
    const email = sess.user?.email;
    if (!email) return { ok: false as const, error: 'Сессия не найдена' };

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (signInErr) return { ok: false as const, error: 'Текущий пароль неверный' };

    const { error: updErr } = await supabase.auth.updateUser({ password: next });
    if (updErr) return { ok: false as const, error: updErr.message };
    return { ok: true as const };
  }, []);

  return (
    <AdminContext.Provider
      value={{
        seoConfig,
        updateSeo,
        resetSeo,
        resetSeoForPage,
        gallery,
        addGalleryItem,
        addGalleryItemRaw,
        updateGalleryItem,
        deleteGalleryItem,
        reorderGallery,
        notifications,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        isAuthenticated,
        authReady,
        userEmail,
        login,
        logout,
        changePassword,
        dbReady,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
