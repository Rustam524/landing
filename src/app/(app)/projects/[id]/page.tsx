import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { canManageProjects } from "@/lib/auth/permissions";
import { ProjectDetailClient } from "./project-detail-client";
import type { TaskWithRelations } from "../../tasks/types";
import type { ProjectWithClient } from "../types";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentProfile();
  if (!session) return null;

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, client:clients(id, name)")
    .eq("id", id)
    .maybeSingle();

  if (!project) notFound();

  const [{ data: members }, { data: tasks }, { data: employees }] = await Promise.all([
    supabase
      .from("project_members")
      .select("user_id, profile:profiles(id, full_name, role)")
      .eq("project_id", id),
    supabase
      .from("tasks")
      .select("*, project:projects(id, name), assignee:profiles!tasks_assignee_id_fkey(id, full_name)")
      .eq("project_id", id)
      .order("deadline", { ascending: true, nullsFirst: false }),
    supabase.from("profiles").select("id, full_name, role").order("full_name"),
  ]);

  return (
    <ProjectDetailClient
      project={project as unknown as ProjectWithClient}
      members={(members ?? []) as unknown as { user_id: string; profile: { id: string; full_name: string; role: string } | null }[]}
      tasks={(tasks ?? []) as unknown as TaskWithRelations[]}
      allEmployees={employees ?? []}
      canManage={canManageProjects(session.profile.role)}
    />
  );
}
