import type {
  UserRole,
  ProjectStatus,
  TaskStatus,
  AccountStatus,
  AppLanguage,
} from "@/lib/types/database";

export const USER_ROLES: UserRole[] = [
  "director",
  "manager",
  "smm",
  "targetolog",
  "mobilograf",
];

export const PROJECT_STATUSES: ProjectStatus[] = [
  "planning",
  "active",
  "paused",
  "completed",
  "archived",
];

export const TASK_STATUSES: TaskStatus[] = [
  "new",
  "in_progress",
  "review",
  "needs_revision",
  "done",
  "cancelled",
];

export const ACCOUNT_STATUSES: AccountStatus[] = ["active", "blocked"];

export const APP_LANGUAGES: AppLanguage[] = ["ru", "kk"];

/** Legal next statuses a task can move to from its current status (mirrors the DB trigger). */
export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  new: ["in_progress", "cancelled"],
  in_progress: ["review", "cancelled"],
  review: ["done", "needs_revision", "cancelled"],
  needs_revision: ["in_progress", "cancelled"],
  done: [],
  cancelled: [],
};
