import { getCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { EmployeesClient } from "./employees-client";

export default async function EmployeesPage() {
  const session = await getCurrentProfile();
  if (!session) return null;

  const supabase = await createClient();
  const [{ data: employees }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*").order("full_name"),
    supabase.from("project_members").select("user_id"),
  ]);

  const projectCounts: Record<string, number> = {};
  for (const m of memberships ?? []) {
    projectCounts[m.user_id] = (projectCounts[m.user_id] ?? 0) + 1;
  }

  return (
    <EmployeesClient
      employees={employees ?? []}
      projectCounts={projectCounts}
      isDirector={session.profile.role === "director"}
      currentUserId={session.userId}
    />
  );
}
