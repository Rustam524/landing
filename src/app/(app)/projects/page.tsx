import { getCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { canManageProjects } from "@/lib/auth/permissions";
import { isTaskOverdue } from "@/lib/utils/deadline";
import { ProjectsClient } from "./projects-client";

export default async function ProjectsPage() {
  const session = await getCurrentProfile();
  if (!session) return null;

  const supabase = await createClient();
  const [{ data: projects }, { data: clients }, { data: tasks }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name"),
    supabase.from("tasks").select("id, project_id, status, deadline"),
  ]);

  const clientNames = new Map((clients ?? []).map((c) => [c.id, c.name]));

  const stats: Record<string, { total: number; done: number; overdue: number }> = {};
  for (const task of tasks ?? []) {
    if (!task.project_id) continue;
    const s = (stats[task.project_id] ??= { total: 0, done: 0, overdue: 0 });
    s.total += 1;
    if (task.status === "done") s.done += 1;
    if (isTaskOverdue(task.deadline, task.status)) {
      s.overdue += 1;
    }
  }

  return (
    <ProjectsClient
      projects={(projects ?? []).map((p) => ({
        ...p,
        clientName: p.client_id ? clientNames.get(p.client_id) ?? null : null,
        stats: stats[p.id] ?? { total: 0, done: 0, overdue: 0 },
      }))}
      clients={clients ?? []}
      canCreate={canManageProjects(session.profile.role)}
    />
  );
}
