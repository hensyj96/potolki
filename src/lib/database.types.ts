/**
 * Database types compatible with @supabase/postgrest-js typings.
 * Each table requires `Relationships: []`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Lang = 'ru' | 'ro';
export type Room = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'office';
export type EventType = 'page_view' | 'cta_call' | 'cta_whatsapp' | 'cta_form' | 'gallery_view' | 'lang_switch';
export type NotificationKind = 'gallery_added' | 'gallery_deleted' | 'seo_changed' | 'cta';

export type Database = {
  public: {
    Tables: {
      gallery: {
        Row: {
          id: string;
          src: string;
          thumb_src: string | null;
          title: string;
          title_ro: string | null;
          type: string;
          type_ro: string | null;
          room: Room;
          order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          src: string;
          thumb_src?: string | null;
          title: string;
          title_ro?: string | null;
          type?: string;
          type_ro?: string | null;
          room?: Room;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          src?: string;
          thumb_src?: string | null;
          title?: string;
          title_ro?: string | null;
          type?: string;
          type_ro?: string | null;
          room?: Room;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      seo: {
        Row: {
          path: string;
          lang: Lang;
          data: { title: string; description: string; keywords?: string; ogTitle?: string; ogDescription?: string; ogImage?: string };
          updated_at: string;
        };
        Insert: {
          path: string;
          lang: Lang;
          data: { title: string; description: string; keywords?: string; ogTitle?: string; ogDescription?: string; ogImage?: string };
          updated_at?: string;
        };
        Update: {
          path?: string;
          lang?: Lang;
          data?: { title: string; description: string; keywords?: string; ogTitle?: string; ogDescription?: string; ogImage?: string };
          updated_at?: string;
        };
        Relationships: [];
      };
      seo_history: {
        Row: {
          id: number;
          path: string;
          lang: Lang;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          path: string;
          lang: Lang;
          data: Json;
          created_at?: string;
        };
        Update: {
          id?: number;
          path?: string;
          lang?: Lang;
          data?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: number;
          type: EventType;
          path: string;
          lang: Lang;
          session_id: string;
          is_unique: boolean;
          referrer: string | null;
          meta: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          type: EventType;
          path: string;
          lang: Lang;
          session_id: string;
          is_unique?: boolean;
          referrer?: string | null;
          meta?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          type?: EventType;
          path?: string;
          lang?: Lang;
          session_id?: string;
          is_unique?: boolean;
          referrer?: string | null;
          meta?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'events_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          }
        ];
      };
      sessions: {
        Row: {
          id: string;
          first_seen: string;
          last_seen: string;
          page_views: number;
          is_returning: boolean;
          source: string | null;
        };
        Insert: {
          id: string;
          first_seen?: string;
          last_seen?: string;
          page_views?: number;
          is_returning?: boolean;
          source?: string | null;
        };
        Update: {
          id?: string;
          first_seen?: string;
          last_seen?: string;
          page_views?: number;
          is_returning?: boolean;
          source?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: number;
          kind: NotificationKind;
          title: string;
          meta: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          kind: NotificationKind;
          title: string;
          meta?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          kind?: NotificationKind;
          title?: string;
          meta?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          user_id: string | null;
          action: string;
          entity: string | null;
          entity_id: string | null;
          meta: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          action: string;
          entity?: string | null;
          entity_id?: string | null;
          meta?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          action?: string;
          entity?: string | null;
          entity_id?: string | null;
          meta?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      online_users_count: {
        Args: { since_ms?: number };
        Returns: number;
      };
    };
    Enums: {
      lang: Lang;
      room: Room;
      event_type: EventType;
      notification_kind: NotificationKind;
    };
  };
};
