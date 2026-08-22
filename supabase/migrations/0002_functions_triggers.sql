-- Helper functions, triggers and guards.

-- ---------------------------------------------------------------------
-- New account provisioning
-- ---------------------------------------------------------------------
-- The director creates accounts via supabase.auth.admin.createUser() with
-- user_metadata carrying full_name/role/position/phone/language (see
-- src/app/api/employees/route.ts). This trigger turns that into a profile
-- row automatically, so there is never a signed-in user without one.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, "position", phone, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email, 'Новый сотрудник'),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'smm'),
    new.raw_user_meta_data ->> 'position',
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'language')::public.app_language, 'ru')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS helper functions (security definer so they can read profiles
-- without recursing through the profiles policies themselves)
-- ---------------------------------------------------------------------
create or replace function public.current_role_is(target public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = target
  );
$$;

create or replace function public.is_director()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_is('director');
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_is('manager');
$$;

create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- Guard: only a director may change someone else's role/status/name, and
-- nobody may grant themselves director/manager privileges.
-- ---------------------------------------------------------------------
create or replace function public.guard_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_director() then
    return new;
  end if;

  if new.id <> auth.uid() then
    raise exception 'Only a director may edit another employee''s profile';
  end if;

  if new.role is distinct from old.role
    or new.status is distinct from old.status
    or new."position" is distinct from old."position" then
    raise exception 'Only a director may change role, status or position';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_privilege_escalation
  before update on public.profiles
  for each row execute function public.guard_profile_privilege_escalation();

-- ---------------------------------------------------------------------
-- Guard: task status transitions must follow the workflow in TZ §4.3
-- (Новая → В работе → На проверке → Выполнена / Нужны правки → …).
-- ---------------------------------------------------------------------
create or replace function public.guard_task_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_privileged boolean;
  is_assignee boolean;
begin
  if new.status = old.status then
    return new;
  end if;

  is_privileged := public.is_director() or public.is_manager();
  is_assignee := old.assignee_id is not null and old.assignee_id = auth.uid();

  if old.status = 'new' and new.status = 'in_progress' then
    if not (is_privileged or is_assignee) then
      raise exception 'Only the assignee, director or manager can start this task';
    end if;
  elsif old.status = 'in_progress' and new.status = 'review' then
    if not (is_privileged or is_assignee) then
      raise exception 'Only the assignee can submit this task for review';
    end if;
  elsif old.status = 'review' and new.status in ('done', 'needs_revision') then
    if not is_privileged then
      raise exception 'Only a director or manager can accept work or request revisions';
    end if;
    if new.status = 'needs_revision' then
      new.revision_count := old.revision_count + 1;
    end if;
  elsif old.status = 'needs_revision' and new.status = 'in_progress' then
    if not (is_privileged or is_assignee) then
      raise exception 'Only the assignee can resume work after revisions';
    end if;
  elsif new.status = 'cancelled' then
    if not is_privileged then
      raise exception 'Only a director or manager can cancel a task';
    end if;
  else
    raise exception 'Illegal task status transition: % -> %', old.status, new.status;
  end if;

  return new;
end;
$$;

create trigger tasks_guard_status_transition
  before update on public.tasks
  for each row execute function public.guard_task_status_transition();

-- ---------------------------------------------------------------------
-- Guard: task comments are append-only for their author (TZ §4.5) — once
-- posted, only a director may hide one (soft-moderation, keeps the log).
-- ---------------------------------------------------------------------
create or replace function public.guard_comment_immutability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_director() then
    return new;
  end if;

  if new.text <> old.text or new.task_id <> old.task_id or new.author_id is distinct from old.author_id then
    raise exception 'Comments cannot be edited after posting';
  end if;

  return new;
end;
$$;

create trigger task_comments_guard_immutability
  before update on public.task_comments
  for each row execute function public.guard_comment_immutability();
