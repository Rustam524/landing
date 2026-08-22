import { getCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { canManageProjects } from "@/lib/auth/permissions";
import { ClientsClient } from "./clients-client";

export default async function ClientsPage() {
  const session = await getCurrentProfile();
  if (!session) return null;

  const supabase = await createClient();
  const [{ data: clients }, { data: projects }] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, client_id"),
  ]);

  const projectCounts: Record<string, number> = {};
  for (const p of projects ?? []) {
    if (!p.client_id) continue;
    projectCounts[p.client_id] = (projectCounts[p.client_id] ?? 0) + 1;
  }

  return (
    <ClientsClient
      clients={clients ?? []}
      projectCounts={projectCounts}
      canCreate={canManageProjects(session.profile.role)}
    />
  );
}
