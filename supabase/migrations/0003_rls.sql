-- Row Level Security — enforces TZ §2 "Правило доступа": a director sees
-- everything, everyone else only sees clients/projects/tasks they are a
-- member of.

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.activity_log enable row level security;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
-- Every signed-in employee can see the team directory (names/roles are
-- needed for assignee pickers, comment authors, etc.) — no salary or
-- contact-sensitive data lives on this table.
create policy profiles_select_authenticated on public.profiles
  for select to authenticated
  using (true);

-- Inserts only happen via the handle_new_user trigger (security definer),
-- so there is deliberately no insert policy for regular clients.

create policy profiles_update_self_or_director on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_director())
  with check (id = auth.uid() or public.is_director());
-- Field-level restrictions (role/status/position require director) are
-- enforced by guard_profile_privilege_escalation in migration 0002.

-- ---------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------
create policy clients_select on public.clients
  for select to authenticated
  using (
    public.is_director()
    or public.is_manager()
    or exists (
      select 1 from public.projects p
      where p.client_id = clients.id and public.is_project_member(p.id)
    )
  );

create policy clients_insert on public.clients
  for insert to authenticated
  with check (public.is_director() or public.is_manager());

create policy clients_update on public.clients
  for update to authenticated
  using (public.is_director() or public.is_manager())
  with check (public.is_director() or public.is_manager());

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
create policy projects_select on public.projects
  for select to authenticated
  using (public.is_director() or public.is_project_member(id));

create policy projects_insert on public.projects
  for insert to authenticated
  with check (public.is_director() or public.is_manager());

create policy projects_update on public.projects
  for update to authenticated
  using (public.is_director() or (public.is_manager() and public.is_project_member(id)))
  with check (public.is_director() or (public.is_manager() and public.is_project_member(id)));

-- ---------------------------------------------------------------------
-- project_members
-- ---------------------------------------------------------------------
create policy project_members_select on public.project_members
  for select to authenticated
  using (public.is_director() or public.is_project_member(project_id));

create policy project_members_insert on public.project_members
  for insert to authenticated
  with check (
    public.is_director()
    or (public.is_manager() and public.is_project_member(project_id))
    -- bootstrap case: the manager who just created the project adding
    -- themselves as its first member (they aren't a member yet at that point)
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.created_by = auth.uid()
    )
  );

create policy project_members_delete on public.project_members
  for delete to authenticated
  using (
    public.is_director()
    or (public.is_manager() and public.is_project_member(project_id))
  );

-- ---------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------
-- project_id is nullable (a task doesn't have to belong to a project — TZ
-- doesn't rule out internal/admin tasks), so these also cover that case:
-- a manager may use any project-less task, and an assignee can always see
-- and work their own task regardless of its project.
create policy tasks_select on public.tasks
  for select to authenticated
  using (
    public.is_director()
    or assignee_id = auth.uid()
    or (project_id is not null and public.is_project_member(project_id))
    or (project_id is null and public.is_manager())
  );

create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (
    public.is_director()
    or (public.is_manager() and (project_id is null or public.is_project_member(project_id)))
  );

create policy tasks_update on public.tasks
  for update to authenticated
  using (
    public.is_director()
    or (public.is_manager() and (project_id is null or public.is_project_member(project_id)))
    or assignee_id = auth.uid()
  )
  with check (
    public.is_director()
    or (public.is_manager() and (project_id is null or public.is_project_member(project_id)))
    or assignee_id = auth.uid()
  );
-- Which status transitions an assignee may make is enforced by
-- guard_task_status_transition in migration 0002.

-- ---------------------------------------------------------------------
-- task_comments
-- ---------------------------------------------------------------------
create policy task_comments_select on public.task_comments
  for select to authenticated
  using (
    public.is_director()
    or exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id
        and (
          t.assignee_id = auth.uid()
          or (t.project_id is not null and public.is_project_member(t.project_id))
          or (t.project_id is null and public.is_manager())
        )
    )
  );

create policy task_comments_insert on public.task_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id
        and (
          t.assignee_id = auth.uid()
          or (t.project_id is not null and public.is_project_member(t.project_id))
          or (t.project_id is null and public.is_manager())
        )
    )
  );

create policy task_comments_update on public.task_comments
  for update to authenticated
  using (public.is_director())
  with check (public.is_director());
-- Only director may hide a comment; guard_comment_immutability blocks
-- editing the text itself even for directors.

-- ---------------------------------------------------------------------
-- activity_log
-- ---------------------------------------------------------------------
create policy activity_log_select on public.activity_log
  for select to authenticated
  using (public.is_director() or public.is_manager());

create policy activity_log_insert on public.activity_log
  for insert to authenticated
  with check (user_id = auth.uid());
