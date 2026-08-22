# Подключение Supabase

Код уже написан и ждёт реальный проект Supabase. Ниже — что нужно сделать,
чтобы приложение заработало.

## 1. Создать проект Supabase

1. Зайдите на [supabase.com](https://supabase.com/dashboard) → **New project**.
2. Выберите регион (лучше ближе к Казахстану — например, Frankfurt/Singapore).
3. Дождитесь создания проекта.

## 2. Применить миграции базы данных

В папке `supabase/migrations/` лежат три SQL-файла — применяйте их **по
порядку** через **SQL Editor** в панели Supabase (Project → SQL Editor →
New query, вставить содержимое файла → Run):

1. `0001_schema.sql` — таблицы, enum'ы, индексы.
2. `0002_functions_triggers.sql` — автосоздание профиля при регистрации,
   защита от повышения прав, контроль переходов статуса задачи.
3. `0003_rls.sql` — политики доступа (Row Level Security) по ролям.

Либо, если у вас установлен [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <ваш-project-ref>
supabase db push
```

## 3. Настроить переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните:

```bash
cp .env.example .env.local
```

Значения берутся в Project Settings → API:

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key.
- `SUPABASE_SERVICE_ROLE_KEY` — service_role key (⚠️ секретный, не публикуйте,
  используется только на сервере для создания аккаунтов сотрудников).
- `NEXT_PUBLIC_SITE_URL` — адрес приложения (для локальной разработки —
  `http://localhost:3000`, на проде — ваш домен).

## 4. Настроить Auth

В Authentication → URL Configuration:

- **Site URL** — адрес вашего приложения.
- **Redirect URLs** — добавьте `<ваш-домен>/auth/callback`.

В Authentication → Providers оставьте только **Email**. Самостоятельная
регистрация не используется — все аккаунты создаёт директор из интерфейса
приложения (раздел «Сотрудники»), поэтому в Authentication → Sign In / Providers
можно отключить публичную регистрацию (Email → «Confirm email» можно оставить
включённым — новые аккаунты создаются уже подтверждёнными через admin API).

## 5. Создать первого директора

Первый аккаунт нужно создать вручную (дальше директор создаёт остальных сам
из интерфейса):

1. Authentication → Users → **Add user** → **Create new user**, укажите
   email и пароль, включите **Auto Confirm User**.
2. В SQL Editor выполните (подставив email директора):

   ```sql
   update public.profiles
   set role = 'director',
       full_name = 'Имя Фамилия',
       must_change_password = false
   where id = (select id from auth.users where email = 'director@example.com');
   ```

   (Триггер `handle_new_user` уже создал строку в `profiles` со значениями
   по умолчанию — этот `update` просто назначает роль директора.)

## 6. Запуск

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000/login` и войдите под директором.

## Что дальше по ТЗ

Этот билд закрывает Этапы 1–2 из ТЗ (авторизация и роли, сотрудники,
клиенты, проекты, задачи со статусами, комментарии). Следующие этапы —
дашборды/фильтры/история (Этап 3), Telegram и Google Calendar (Этап 4),
таблицы/PDF-отчёты (Этап 5), интеграция Instagram (Этап 6) — не входят в
этот билд и добавляются отдельно.
