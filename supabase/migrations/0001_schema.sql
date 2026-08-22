-- ALGORITM platform — core schema (Этапы 1–2: авторизация, сотрудники,
-- клиенты, проекты, задачи, статусы, комментарии).
-- See TZ_ALGORITM_app.docx sections 2–4 for the requirements this encodes.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------

create type public.user_role as enum (
  'director',      -- Директор
  'manager',       -- Руководитель проектов
  'smm',           -- SMM-специалист
  'targetolog',    -- Таргетолог
  'mobilograf'     -- Мобилограф
);

create type public.account_status as enum ('active', 'blocked');

create type public.app_language as enum ('ru', 'kk');

create type public.project_status as enum (
  'planning', 'active', 'paused', 'completed', 'archived'
);

create type public.task_status as enum (
  'new', 'in_progress', 'review', 'needs_revision', 'done', 'cancelled'
);

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- One row per auth.users row. Accounts are created by the director only
-- (see handle_new_user below) — there is no public sign-up.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'smm',
  "position" text,
  phone text,
  language public.app_language not null default 'ru',
  status public.account_status not null default 'active',
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_info text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  name text not null,
  status public.project_status not null default 'planning',
  start_date date,
  end_date date,
  social_links text,
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid references public.profiles (id) on delete set null,
  status public.task_status not null default 'new',
  deadline timestamptz,
  complexity smallint not null default 1 check (complexity between 1 and 3),
  revision_count int not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  text text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------

create index projects_client_id_idx on public.projects (client_id);
create index project_members_user_id_idx on public.project_members (user_id);
create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);
create index tasks_status_idx on public.tasks (status);
create index task_comments_task_id_idx on public.task_comments (task_id);
create index activity_log_entity_idx on public.activity_log (entity_type, entity_id);
create index activity_log_created_at_idx on public.activity_log (created_at desc);
