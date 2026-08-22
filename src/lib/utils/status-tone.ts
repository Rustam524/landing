import type { AccountStatus, ProjectStatus, TaskStatus } from "@/lib/types/database";

export function taskStatusTone(status: TaskStatus) {
  switch (status) {
    case "new":
      return "neutral" as const;
    case "in_progress":
      return "info" as const;
    case "review":
      return "warning" as const;
    case "needs_revision":
      return "danger" as const;
    case "done":
      return "success" as const;
    case "cancelled":
      return "neutral" as const;
  }
}

export function projectStatusTone(status: ProjectStatus) {
  switch (status) {
    case "planning":
      return "neutral" as const;
    case "active":
      return "success" as const;
    case "paused":
      return "warning" as const;
    case "completed":
      return "info" as const;
    case "archived":
      return "neutral" as const;
  }
}

export function accountStatusTone(status: AccountStatus) {
  return status === "active" ? ("success" as const) : ("danger" as const);
}
