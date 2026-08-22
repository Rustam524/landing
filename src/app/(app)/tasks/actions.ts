"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageProjects } from "@/lib/auth/permissions";
import { TASK_STATUS_TRANSITIONS } from "@/lib/constants";
import type { TaskStatus } from "@/lib/types/database";

async function requireUser() {
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
  if (!profile) return null;

  return { supabase, userId: user.id, role: profile.role };
}

export type TaskFormState = { error?: string } | undefined;

export async function createTask(
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const ctx = await requireUser();
  if (!ctx || !canManageProjects(ctx.role)) return { error: "forbidden" };

  const title = String(formData.get("title") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "") || null;
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const deadlineRaw = String(formData.get("deadline") ?? "");
  const complexityRaw = Number(formData.get("complexity") ?? 1);
  const complexity: 1 | 2 | 3 = complexityRaw === 2 ? 2 : complexityRaw === 3 ? 3 : 1;

  if (!title) return { error: "required" };

  const { data: task, error } = await ctx.supabase
    .from("tasks")
    .insert({
      title,
      description,
      project_id: projectId,
      assignee_id: assigneeId,
      deadline: deadlineRaw ? new Date(deadlineRaw).toISOString() : null,
      complexity,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error || !task) return { error: error?.message ?? "unknown" };

  await ctx.supabase.from("activity_log").insert({
    user_id: ctx.userId,
    action: "task_created",
    entity_type: "task",
    entity_id: task.id,
    details: { title },
  });

  revalidatePath("/tasks");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  redirect(`/tasks/${task.id}`);
}

export type StatusChangeState = { error?: string } | undefined;

export async function updateTaskStatus(
  _prevState: StatusChangeState,
  formData: FormData,
): Promise<StatusChangeState> {
  const ctx = await requireUser();
  if (!ctx) return { error: "forbidden" };

  const taskId = String(formData.get("taskId") ?? "");
  const nextStatus = String(formData.get("status") ?? "") as TaskStatus;
  const comment = String(formData.get("comment") ?? "").trim();

  const { data: task } = await ctx.supabase
    .from("tasks")
    .select("id, project_id, status")
    .eq("id", taskId)
    .single();

  if (!task) return { error: "notFound" };

  const allowed = TASK_STATUS_TRANSITIONS[task.status as TaskStatus] ?? [];
  if (!allowed.includes(nextStatus)) return { error: "illegalTransition" };

  if (nextStatus === "needs_revision" && !comment) {
    return { error: "commentRequiredForRevision" };
  }

  const { error } = await ctx.supabase
    .from("tasks")
    .update({ status: nextStatus })
    .eq("id", taskId);

  if (error) return { error: error.message };

  if (comment) {
    await ctx.supabase.from("task_comments").insert({
      task_id: taskId,
      author_id: ctx.userId,
      text: comment,
    });
  }

  await ctx.supabase.from("activity_log").insert({
    user_id: ctx.userId,
    action: "task_status_changed",
    entity_type: "task",
    entity_id: taskId,
    details: { from: task.status, to: nextStatus },
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");
  if (task.project_id) revalidatePath(`/projects/${task.project_id}`);
  return undefined;
}

export type CommentFormState = { error?: string } | undefined;

export async function addComment(
  _prevState: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const ctx = await requireUser();
  if (!ctx) return { error: "forbidden" };

  const taskId = String(formData.get("taskId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "required" };

  const { error } = await ctx.supabase.from("task_comments").insert({
    task_id: taskId,
    author_id: ctx.userId,
    text,
  });

  if (error) return { error: error.message };

  revalidatePath(`/tasks/${taskId}`);
  return undefined;
}
