import { getCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { canManageProjects } from "@/lib/auth/permissions";
import { TasksClient } from "./tasks-client";
import type { TaskWithRelations } from "./types";

export default async function TasksPage() {
  const session = await getCurrentProfile();
  if (!session) return null;

  const supabase = await createClient();
  const [{ data: tasks }, { data: projects }, { data: employees }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, project:projects(id, name), assignee:profiles!tasks_assignee_id_fkey(id, full_name)")
      .order("deadline", { ascending: true, nullsFirst: false }),
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name, role").order("full_name"),
  ]);

  return (
    <TasksClient
      tasks={(tasks ?? []) as unknown as TaskWithRelations[]}
      projects={projects ?? []}
      employees={employees ?? []}
      currentUserId={session.userId}
      canCreate={canManageProjects(session.profile.role)}
    />
  );
}
