import type { Database } from './database.types';
import type {
  GalleryItem,
  AnalyticsEvent,
  Session,
  NotificationRecord,
  SeoHistoryRecord,
  SeoData,
} from '../db/database';

type GalleryRow = Database['public']['Tables']['gallery']['Row'];
type SessionRow = Database['public']['Tables']['sessions']['Row'];
type EventRow = Database['public']['Tables']['events']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type SeoHistoryRow = Database['public']['Tables']['seo_history']['Row'];

export function toGallery(row: GalleryRow): GalleryItem {
  return {
    id: row.id,
    src: row.src,
    thumbSrc: row.thumb_src ?? undefined,
    title: row.title,
    titleRo: row.title_ro ?? undefined,
    type: row.type,
    typeRo: row.type_ro ?? undefined,
    room: row.room,
    order: row.order,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function toEvent(row: EventRow): AnalyticsEvent {
  return {
    id: row.id,
    type: row.type,
    path: row.path,
    lang: row.lang,
    sessionId: row.session_id,
    isUnique: row.is_unique,
    referrer: row.referrer ?? undefined,
    meta: (row.meta as Record<string, any> | null) ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    firstSeen: new Date(row.first_seen).getTime(),
    lastSeen: new Date(row.last_seen).getTime(),
    pageViews: row.page_views,
    isReturning: row.is_returning,
    source: row.source ?? undefined,
  };
}

export function toNotification(row: NotificationRow): NotificationRecord {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    meta: (row.meta as Record<string, any> | null) ?? undefined,
    read: row.read,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function toSeoHistory(row: SeoHistoryRow): SeoHistoryRecord {
  return {
    id: row.id,
    path: row.path,
    lang: row.lang,
    data: row.data as SeoData,
    createdAt: new Date(row.created_at).getTime(),
  };
}
