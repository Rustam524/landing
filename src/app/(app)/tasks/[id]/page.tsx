import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { TaskDetailClient } from "./task-detail-client";
import type { TaskWithRelations } from "../types";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentProfile();
  if (!session) return null;

  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select(
      "*, project:projects(id, name), assignee:profiles!tasks_assignee_id_fkey(id, full_name), created_by_profile:profiles!tasks_created_by_fkey(id, full_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!task) notFound();

  const { data: comments } = await supabase
    .from("task_comments")
    .select("*, author:profiles(id, full_name)")
    .eq("task_id", id)
    .order("created_at", { ascending: true });

  return (
    <TaskDetailClient
      task={task as unknown as TaskWithRelations & { created_by_profile: { id: string; full_name: string } | null }}
      comments={
        (comments ?? []) as unknown as {
          id: string;
          text: string;
          hidden: boolean;
          created_at: string;
          author: { id: string; full_name: string } | null;
        }[]
      }
      currentUserId={session.userId}
      currentUserRole={session.profile.role}
    />
  );
}
