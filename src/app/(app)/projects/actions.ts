"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageProjects } from "@/lib/auth/permissions";
import type { ProjectStatus } from "@/lib/types/database";

async function requireProjectManager() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !canManageProjects(profile.role)) return null;
  return { supabase, userId: user.id };
}

export type ProjectFormState = { error?: string } | undefined;

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const ctx = await requireProjectManager();
  if (!ctx) return { error: "forbidden" };

  const name = String(formData.get("name") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "") || null;
  const startDate = String(formData.get("startDate") ?? "") || null;
  const endDate = String(formData.get("endDate") ?? "") || null;
  const socialLinks = String(formData.get("socialLinks") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name) return { error: "required" };

  const { data: project, error } = await ctx.supabase
    .from("projects")
    .insert({
      name,
      client_id: clientId,
      start_date: startDate,
      end_date: endDate,
      social_links: socialLinks,
      description,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error || !project) return { error: error?.message ?? "unknown" };

  await ctx.supabase.from("project_members").insert({
    project_id: project.id,
    user_id: ctx.userId,
  });

  await ctx.supabase.from("activity_log").insert({
    user_id: ctx.userId,
    action: "project_created",
    entity_type: "project",
    entity_id: project.id,
    details: { name },
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  const ctx = await requireProjectManager();
  if (!ctx) return;

  await ctx.supabase.from("projects").update({ status }).eq("id", projectId);
  await ctx.supabase.from("activity_log").insert({
    user_id: ctx.userId,
    action: "project_status_changed",
    entity_type: "project",
    entity_id: projectId,
    details: { status },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}

export async function addProjectMember(projectId: string, userId: string) {
  const ctx = await requireProjectManager();
  if (!ctx) return;

  await ctx.supabase.from("project_members").insert({ project_id: projectId, user_id: userId });
  await ctx.supabase.from("activity_log").insert({
    user_id: ctx.userId,
    action: "project_member_added",
    entity_type: "project",
    entity_id: projectId,
    details: { member_id: userId },
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function removeProjectMember(projectId: string, userId: string) {
  const ctx = await requireProjectManager();
  if (!ctx) return;

  await ctx.supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  await ctx.supabase.from("activity_log").insert({
    user_id: ctx.userId,
    action: "project_member_removed",
    entity_type: "project",
    entity_id: projectId,
    details: { member_id: userId },
  });

  revalidatePath(`/projects/${projectId}`);
}
