-- ================================================================
-- Potolki.md — Supabase setup (всё в одном файле)
--
-- ИНСТРУКЦИЯ:
-- 1. Открой https://supabase.com/dashboard/project/uhktflmhorkhrqxjtvgx/sql/new
-- 2. Скопируй ВЕСЬ этот файл (Ctrl+A → Ctrl+C в редакторе)
-- 3. Вставь в SQL Editor (Ctrl+V)
-- 4. Нажми Run (внизу справа) или Ctrl+Enter
-- 5. Жди ~3 секунды → должно быть "Success. No rows returned"
--
-- Если ошибка — скопируй её сюда в чат, я помогу.
-- ================================================================

-- Расширения
create extension if not exists "uuid-ossp";

-- ============== Enums ==============
do $$ begin
  if not exists (select 1 from pg_type where typname = 'lang') then
    create type lang as enum ('ru', 'ro');
  end if;
  if not exists (select 1 from pg_type where typname = 'room') then
    create type room as enum ('living', 'kitchen', 'bedroom', 'bathroom', 'office');
  end if;
  if not exists (select 1 from pg_type where typname = 'event_type') then
    create type event_type as enum ('page_view', 'cta_call', 'cta_whatsapp', 'cta_form', 'gallery_view', 'lang_switch');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_kind') then
    create type notification_kind as enum ('gallery_added', 'gallery_deleted', 'seo_changed', 'cta');
  end if;
end $$;

-- ============== Gallery ==============
create table if not exists public.gallery (
  id          uuid primary key default uuid_generate_v4(),
  src         text not null,
  thumb_src   text,
  title       text not null,
  title_ro    text,
  type        text not null default '',
  type_ro     text,
  room        room not null default 'living',
  "order"     integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists gallery_room_idx     on public.gallery (room);
create index if not exists gallery_order_idx    on public.gallery ("order");
create index if not exists gallery_created_idx  on public.gallery (created_at desc);

-- ============== SEO ==============
create table if not exists public.seo (
  path        text not null,
  lang        lang not null,
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  primary key (path, lang)
);

create table if not exists public.seo_history (
  id          bigserial primary key,
  path        text not null,
  lang        lang not null,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists seo_history_path_lang_idx on public.seo_history (path, lang, created_at desc);

-- ============== Analytics ==============
create table if not exists public.sessions (
  id            text primary key,
  first_seen    timestamptz not null default now(),
  last_seen     timestamptz not null default now(),
  page_views    integer not null default 0,
  is_returning  boolean not null default false,
  source        text
);
create index if not exists sessions_last_seen_idx on public.sessions (last_seen desc);

create table if not exists public.events (
  id          bigserial primary key,
  type        event_type not null,
  path        text not null,
  lang        lang not null,
  session_id  text not null references public.sessions (id) on delete cascade,
  is_unique   boolean not null default false,
  referrer    text,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists events_created_idx           on public.events (created_at desc);
create index if not exists events_type_idx              on public.events (type);
create index if not exists events_path_idx              on public.events (path);
create index if not exists events_session_idx           on public.events (session_id);
create index if not exists events_lang_idx              on public.events (lang);

-- ============== Notifications ==============
create table if not exists public.notifications (
  id          bigserial primary key,
  kind        notification_kind not null,
  title       text not null,
  meta        jsonb,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_created_idx on public.notifications (created_at desc);
create index if not exists notifications_unread_idx  on public.notifications (read) where read = false;

-- ============== Audit log (для админских действий) ==============
create table if not exists public.audit_log (
  id          bigserial primary key,
  user_id     uuid references auth.users (id) on delete set null,
  action      text not null,
  entity      text,
  entity_id   text,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

-- ============== Триггер обновления updated_at ==============
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_gallery_updated on public.gallery;
create trigger trg_gallery_updated
  before update on public.gallery
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_seo_updated on public.seo;
create trigger trg_seo_updated
  before update on public.seo
  for each row execute function public.touch_updated_at();

-- ============== Триггер: SEO history при изменении ==============
-- SECURITY DEFINER: INSERT/DELETE в seo_history иначе блокируются RLS
-- (политика ниже разрешает админу только SELECT).
create or replace function public.snapshot_seo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (old.data is distinct from new.data) then
    insert into public.seo_history (path, lang, data, created_at)
    values (old.path, old.lang, old.data, old.updated_at);

    -- Удаляем версии старше 10-й
    delete from public.seo_history sh
    where sh.path = old.path and sh.lang = old.lang
      and sh.id not in (
        select id from public.seo_history
        where path = old.path and lang = old.lang
        order by created_at desc
        limit 10
      );
  end if;
  return new;
end $$;

drop trigger if exists trg_seo_snapshot on public.seo;
create trigger trg_seo_snapshot
  before update on public.seo
  for each row execute function public.snapshot_seo();

-- ============== RPC: realtime online counter ==============
create or replace function public.online_users_count(since_ms integer default 300000)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.sessions
  where last_seen > (now() - make_interval(secs => since_ms / 1000.0));
$$;

-- ============== Helper: проверка что user — admin ==============
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() ->> 'role') = 'admin', false)
      or coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;
-- ================================================================
-- Row Level Security (RLS)
-- В этом файле уже включено: отдельный 01_initial_schema.sql не нужен
-- ================================================================

-- Включаем RLS на всех таблицах
alter table public.gallery        enable row level security;
alter table public.seo            enable row level security;
alter table public.seo_history    enable row level security;
alter table public.events         enable row level security;
alter table public.sessions       enable row level security;
alter table public.notifications  enable row level security;
alter table public.audit_log      enable row level security;

-- ============== Gallery ==============
-- Публичное чтение
drop policy if exists gallery_public_read on public.gallery;
create policy gallery_public_read on public.gallery
  for select using (true);

-- Только админы пишут
drop policy if exists gallery_admin_write on public.gallery;
create policy gallery_admin_write on public.gallery
  for all using (public.is_admin()) with check (public.is_admin());

-- ============== SEO ==============
drop policy if exists seo_public_read on public.seo;
create policy seo_public_read on public.seo
  for select using (true);

drop policy if exists seo_admin_write on public.seo;
create policy seo_admin_write on public.seo
  for all using (public.is_admin()) with check (public.is_admin());

-- История SEO: триггер snapshot_seo делает INSERT + DELETE — нужны отдельные политики
-- (одна только SELECT оставляет INSERT без права и даёт 42501 при сохранении SEO).
drop policy if exists seo_history_admin_only on public.seo_history;
drop policy if exists seo_history_admin_select on public.seo_history;
drop policy if exists seo_history_admin_insert on public.seo_history;
drop policy if exists seo_history_admin_delete on public.seo_history;

create policy seo_history_admin_select on public.seo_history
  for select using (public.is_admin());

create policy seo_history_admin_insert on public.seo_history
  for insert with check (public.is_admin());

create policy seo_history_admin_delete on public.seo_history
  for delete using (public.is_admin());

-- ============== Sessions ==============
-- Анонимы могут вставлять и обновлять собственные сессии
drop policy if exists sessions_insert_anon on public.sessions;
create policy sessions_insert_anon on public.sessions
  for insert with check (true);

drop policy if exists sessions_update_self on public.sessions;
create policy sessions_update_self on public.sessions
  for update using (true) with check (true);

-- Чтение только админам (для аналитики)
drop policy if exists sessions_admin_read on public.sessions;
create policy sessions_admin_read on public.sessions
  for select using (public.is_admin());

-- ============== Events ==============
-- Анонимы могут вставлять события (трекинг с публичной части)
drop policy if exists events_insert_anon on public.events;
create policy events_insert_anon on public.events
  for insert with check (true);

-- Чтение и удаление только админам
drop policy if exists events_admin_read on public.events;
create policy events_admin_read on public.events
  for select using (public.is_admin());

drop policy if exists events_admin_delete on public.events;
create policy events_admin_delete on public.events
  for delete using (public.is_admin());

-- ============== Notifications ==============
drop policy if exists notifications_admin_only on public.notifications;
create policy notifications_admin_only on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

-- ============== Audit log ==============
drop policy if exists audit_admin_read on public.audit_log;
create policy audit_admin_read on public.audit_log
  for select using (public.is_admin());

drop policy if exists audit_admin_insert on public.audit_log;
create policy audit_admin_insert on public.audit_log
  for insert with check (public.is_admin());
-- ================================================================
-- Storage bucket для фото галереи
-- В этом файле уже включено: отдельные миграции не нужны
-- Альтернативно: создать bucket 'gallery-images' через UI
--   Storage → New bucket → Public → Allowed MIME: image/*
-- ================================================================

-- Bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery-images',
  'gallery-images',
  true,
  20971520, -- 20 MB
  array['image/webp', 'image/jpeg', 'image/png', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Публичное чтение
drop policy if exists "gallery_images public read" on storage.objects;
create policy "gallery_images public read"
  on storage.objects for select
  using (bucket_id = 'gallery-images');

-- Загрузка / обновление / удаление — только админам
drop policy if exists "gallery_images admin write" on storage.objects;
create policy "gallery_images admin write"
  on storage.objects for insert
  with check (bucket_id = 'gallery-images' and public.is_admin());

drop policy if exists "gallery_images admin update" on storage.objects;
create policy "gallery_images admin update"
  on storage.objects for update
  using (bucket_id = 'gallery-images' and public.is_admin());

drop policy if exists "gallery_images admin delete" on storage.objects;
create policy "gallery_images admin delete"
  on storage.objects for delete
  using (bucket_id = 'gallery-images' and public.is_admin());
-- ================================================================
-- Сидим SEO defaults (можно править потом из админки)
-- ================================================================

insert into public.seo (path, lang, data) values
('/', 'ru', '{"title":"Potolki.md — Натяжные потолки в Молдове | Кишинёв","description":"Натяжные потолки премиум-класса в Молдове. Бесплатный замер, гарантия 15 лет, монтаж за 1 день. Цены от 130 лей/м².","keywords":"натяжные потолки молдова, кишинев, потолки цена, монтаж потолков","ogTitle":"Potolki.md — Натяжные потолки в Молдове","ogDescription":"Лучшие натяжные потолки в Молдове."}'::jsonb),
('/', 'ro', '{"title":"Potolki.md — Tavane extensibile în Moldova | Chișinău","description":"Tavane extensibile de lux în Moldova. Măsurare gratuită, garanție 15 ani, montaj în 1 zi. Prețuri de la 130 lei/m².","keywords":"tavane extensibile moldova, chisinau, tavan pret","ogTitle":"Potolki.md — Tavane extensibile","ogDescription":"Cele mai bune tavane extensibile din Moldova."}'::jsonb),

('/services', 'ru', '{"title":"Услуги — Натяжные потолки | Potolki.md","description":"Все виды натяжных потолков: матовые, глянцевые, сатиновые, тканевые, фотопечать, многоуровневые.","keywords":"виды натяжных потолков, матовые, глянцевые"}'::jsonb),
('/services', 'ro', '{"title":"Servicii — Tavane extensibile | Potolki.md","description":"Toate tipurile de tavane extensibile: mate, lucioase, satinate, textile, fotoimprimare, multinivel.","keywords":"tipuri tavane extensibile"}'::jsonb),

('/gallery', 'ru', '{"title":"Галерея работ — Potolki.md | Натяжные потолки Молдова","description":"Фотогалерея реализованных проектов натяжных потолков по всей Молдове.","keywords":"натяжные потолки фото, галерея потолков"}'::jsonb),
('/gallery', 'ro', '{"title":"Galerie lucrări — Potolki.md","description":"Galerie foto cu proiecte realizate de tavane extensibile în toată Moldova.","keywords":"tavane extensibile foto, galerie tavane"}'::jsonb),

('/prices', 'ru', '{"title":"Цены — Натяжные потолки в Молдове | Potolki.md","description":"Прайс-лист на натяжные потолки. Без скрытых доплат. От 130 лей/м².","keywords":"цены натяжные потолки, прайс молдова"}'::jsonb),
('/prices', 'ro', '{"title":"Prețuri — Tavane extensibile | Potolki.md","description":"Lista de prețuri pentru tavane extensibile. Fără taxe ascunse. De la 130 lei/m².","keywords":"preturi tavane extensibile"}'::jsonb),

('/about', 'ru', '{"title":"О компании — Potolki.md","description":"Компания Potolki.md работает с 2014 года. Более 5000 выполненных проектов.","keywords":"о компании, история, команда"}'::jsonb),
('/about', 'ro', '{"title":"Despre companie — Potolki.md","description":"Compania Potolki.md activează din 2014. Peste 5000 de proiecte realizate.","keywords":"despre companie, istorie, echipa"}'::jsonb),

('/contact', 'ru', '{"title":"Контакты — Potolki.md","description":"Свяжитесь с нами: +373 (60) 000-000. Бесплатный замер.","keywords":"контакты, телефон, заказать замер"}'::jsonb),
('/contact', 'ro', '{"title":"Contact — Potolki.md","description":"Contactează-ne: +373 (60) 000-000. Măsurare gratuită.","keywords":"contact, telefon, comanda masurare"}'::jsonb)

on conflict (path, lang) do nothing;
