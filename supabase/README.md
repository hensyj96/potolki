# Подключение Supabase

## Шаг 1. Получи ключи из дашборда

1. Открой свой проект.
2. Слева внизу — иконка шестерёнки → **Settings → API**.
3. Скопируй два значения:
   - **Project URL** (например `https://uhktflmhorkhrqxjtvgx.supabase.co`)
   - **Publishable / anon** ключ (`sb_publishable_...` или `eyJ...`)

> ❗ `service_role` ключ — НЕ используем во frontend! Только `anon` / `publishable`.

## Шаг 2. Создай `.env.local`

В корне проекта (рядом с `package.json`):

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

После этого перезапусти dev-сервер (`npm run dev`).

## Шаг 3. Создай таблицы (один SQL файл)

В дашборде: **SQL Editor → + New query**.

Скопируй содержимое `supabase/SETUP.sql` целиком и нажми **Run**.

Это создаст:

- таблицы `gallery`, `seo`, `seo_history`, `events`, `sessions`, `notifications`, `audit_log`;
- enum-типы (`lang`, `room`, `event_type`, `notification_kind`);
- триггеры `updated_at` и snapshot SEO в историю;
- RPC `online_users_count`, helper `is_admin()`;
- RLS-политики (публичное чтение для `seo`/`gallery`, write — только admin);
- bucket `gallery-images` со всеми политиками;
- 12 SEO-записей по умолчанию.

После выполнения: `Success. No rows returned`.

**Если админка ругается на сохранение / сброс SEO (`seo_history`, 403, 42501)** — открой **`supabase/FIX_SEO_SAVE.sql`**, скопируй файл целиком в SQL Editor и нажми **Run** (один раз на проект). Потом выйди из `/admin` и войди снова.

## Шаг 4. Создай первого админа

1. **Authentication → Users → Add user → Create new user**.
2. Email: например `admin@potolki.md`, пароль — придумай сильный.
3. Поставь галку «Auto Confirm User» — иначе нужно подтверждать email.
4. В **SQL Editor** выполни:

```sql
update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{role}', '"admin"'
)
where email = 'admin@potolki.md';
```

Это даёт роль `admin`, которую RLS проверяет через `is_admin()`.

## Шаг 5. Войди в админку

1. Открой `/admin/login` на сайте.
2. Введи email и пароль из шага 4.
3. После входа автоматически:
   - подгружается галерея и SEO из Supabase;
   - запускаются realtime-подписки на `gallery`, `seo`, `notifications`;
   - online-счётчик дёргает RPC `online_users_count` каждые 30 сек.

## Шаг 6. Загрузи фото

Галерея → **Добавить фото**. Файл будет:

1. Сжат до 1920×1080 webp + 480×360 thumb.
2. Загружен в Storage `gallery-images`.
3. URL сохранён в `gallery.src` / `gallery.thumb_src`.
4. Realtime-каналом тут же обновится в публичной части сайта.

## Шаг 7. Проверка связи (DEV)

В DevTools → консоль:

```js
await window._supabaseHealth();
// → { ok: true, latencyMs: <ms>, seoCount: 12, sessionsCount: 0, tablesPresent: [...] }
```

Проверить JWT и роль в DEV (клиент называется **`_supabase`**, не `supabase`):

```js
const { data: { session } } = await window._supabase.auth.getSession();
console.log(session?.user?.app_metadata);
```

### Если сохранение SEO падает: `seo_history` / код 42501

Выполни в SQL Editor файл **`supabase/FIX_SEO_SAVE.sql`** целиком (см. шаг 3 выше), затем перезайди в админку.

---

## Что под капотом

- `src/context/AdminContext.tsx` — auth (signInWithPassword/onAuthStateChange/updateUser), CRUD галереи и SEO, realtime-подписки.
- `src/context/AnalyticsContext.tsx` — публичный трекинг страниц/CTA, anon-insert в `events`/`sessions`.
- `src/admin/lib/imageStore.ts` — оптимизация webp + загрузка в Storage.
- `src/admin/lib/analyticsApi.ts` — пагинированный fetch событий (1000 в чанке), RPC `online_users_count`, demo-сид.
- `src/lib/database.types.ts` — типы строго по схеме SQL.
- `src/lib/mappers.ts` — snake_case ↔ camelCase.

## Бэкап

Free план: ручной dump.

```bash
npx supabase db dump \
  --db-url 'postgresql://postgres:[PASSWORD]@db.YOUR-REF.supabase.co:5432/postgres' \
  > backup.sql
```

Pro план ($25/мес): ежедневные бэкапы 7 дней + Point-in-Time Recovery.
