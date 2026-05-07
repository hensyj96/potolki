# Potolki.md

Публичный сайт и админка: React 19, TypeScript, Vite, Tailwind, Supabase.

## Запуск

```bash
npm install
npm run dev
```

## Сборка

```bash
npm run build
npm run preview
```

## Окружение

Создай файл `.env.local` в корне проекта:

```
VITE_SUPABASE_URL=<url проекта Supabase>
VITE_SUPABASE_ANON_KEY=<anon / publishable key>
```

Без этих переменных клиент Supabase не подключится.

## База и SQL

Схема и начальные данные — в каталоге `supabase/` (см. `supabase/README.md`, `supabase/SETUP.sql`).

## Линт

```bash
npm run lint
```
