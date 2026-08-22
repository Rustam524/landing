import type { Task } from "@/lib/types/database";

export type TaskWithRelations = Task & {
  project: { id: string; name: string } | null;
  assignee: { id: string; full_name: string } | null;
};
