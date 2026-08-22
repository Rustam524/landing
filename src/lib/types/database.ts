/**
 * Hand-written types mirroring the Supabase schema in supabase/migrations.
 *
 * Once a real Supabase project is connected, these can be regenerated with:
 *   npx supabase gen types typescript --project-id <id> > src/lib/types/database.ts
 * Keep the shape below in sync with the migrations until then.
 *
 * Note: these are declared as `type` (not `interface`) on purpose — the
 * Supabase client's generics require each Row/Insert/Update to structurally
 * satisfy `Record<string, unknown>`, which only plain object type literals
 * do (interfaces don't get an implicit index signature).
 */

export type UserRole =
  | "director"
  | "manager"
  | "smm"
  | "targetolog"
  | "mobilograf";

export type AccountStatus = "active" | "blocked";

export type AppLanguage = "ru" | "kk";

export type ProjectStatus =
  | "planning"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type TaskStatus =
  | "new"
  | "in_progress"
  | "review"
  | "needs_revision"
  | "done"
  | "cancelled";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  position: string | null;
  phone: string | null;
  language: AppLanguage;
  status: AccountStatus;
  must_change_password: boolean;
  created_at: string;
  last_login_at: string | null;
};

export type Client = {
  id: string;
  name: string;
  contact_info: string | null;
  status: "active" | "archived";
  created_by: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  client_id: string | null;
  name: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  social_links: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectMember = {
  project_id: string;
  user_id: string;
  added_at: string;
};

export type Task = {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  assignee_id: string | null;
  status: TaskStatus;
  deadline: string | null;
  complexity: 1 | 2 | 3;
  revision_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskComment = {
  id: string;
  task_id: string;
  author_id: string | null;
  text: string;
  hidden: boolean;
  created_at: string;
};

export type ActivityLogEntry = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; full_name: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      clients: {
        Row: Client;
        Insert: Partial<Client> & { name: string };
        Update: Partial<Client>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: Partial<Project> & { name: string };
        Update: Partial<Project>;
        Relationships: [];
      };
      project_members: {
        Row: ProjectMember;
        Insert: Partial<ProjectMember> & { project_id: string; user_id: string };
        Update: Partial<ProjectMember>;
        Relationships: [];
      };
      tasks: {
        Row: Task;
        Insert: Partial<Task> & { title: string };
        Update: Partial<Task>;
        Relationships: [];
      };
      task_comments: {
        Row: TaskComment;
        Insert: Partial<TaskComment> & { task_id: string; text: string };
        Update: Partial<TaskComment>;
        Relationships: [];
      };
      activity_log: {
        Row: ActivityLogEntry;
        Insert: Partial<ActivityLogEntry> & { action: string; entity_type: string };
        Update: Partial<ActivityLogEntry>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      account_status: AccountStatus;
      app_language: AppLanguage;
      project_status: ProjectStatus;
      task_status: TaskStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
