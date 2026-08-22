import type { Project } from "@/lib/types/database";

export type ProjectWithClient = Project & {
  client: { id: string; name: string } | null;
};
