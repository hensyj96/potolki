-- =============================================================================
-- ОДИН РАЗ: починить сохранение / сброс SEO (ошибка seo_history, 403, 42501)
-- =============================================================================
-- Где: Supabase Dashboard → SQL Editor → New query → вставить всё → Run.
-- Потом: выйти из админки сайта и зайти снова, обновить страницу F5.
-- =============================================================================

-- Триггер пишет историю в seo_history; функция с правами владельца обходит RLS при записи.
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

-- На всякий случай: явные политики для админа (INSERT/DELETE, не только SELECT).
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
