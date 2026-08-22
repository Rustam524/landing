"use client";

import Link from "next/link";
import { ArrowLeft, Clock, User, FolderKanban, Gauge, RotateCcw } from "lucide-react";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { taskStatusTone } from "@/lib/utils/status-tone";
import { isTaskOverdue } from "@/lib/utils/deadline";
import { StatusChangeForm } from "./status-change-form";
import { CommentList } from "./comment-list";
import { AddCommentForm } from "./add-comment-form";
import type { TaskWithRelations } from "../types";
import type { UserRole } from "@/lib/types/database";

type CommentRow = {
  id: string;
  text: string;
  hidden: boolean;
  created_at: string;
  author: { id: string; full_name: string } | null;
};

export function TaskDetailClient({
  task,
  comments,
  currentUserId,
  currentUserRole,
}: {
  task: TaskWithRelations & { created_by_profile: { id: string; full_name: string } | null };
  comments: CommentRow[];
  currentUserId: string;
  currentUserRole: UserRole;
}) {
  const { dict, language } = useDictionary();
  const isOverdue = isTaskOverdue(task.deadline, task.status);
  const canChangeStatus =
    currentUserRole === "director" ||
    currentUserRole === "manager" ||
    task.assignee_id === currentUserId;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1.5 text-sm text-brand-text-muted hover:text-brand-ink"
      >
        <ArrowLeft size={16} />
        {dict.common.back}
      </Link>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-semibold text-brand-ink">{task.title}</h1>
            <Badge tone={taskStatusTone(task.status)}>{dict.taskStatus[task.status]}</Badge>
          </div>

          {task.description && (
            <p className="whitespace-pre-wrap text-sm text-brand-ink">{task.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {task.project && (
              <InfoItem icon={FolderKanban} label={dict.tasks.project}>
                <Link href={`/projects/${task.project.id}`} className="text-brand-primary hover:underline">
                  {task.project.name}
                </Link>
              </InfoItem>
            )}
            <InfoItem icon={User} label={dict.tasks.assignee}>
              {task.assignee?.full_name ?? dict.tasks.unassigned}
            </InfoItem>
            {task.deadline && (
              <InfoItem icon={Clock} label={dict.tasks.deadline}>
                <span className={isOverdue ? "font-medium text-brand-accent" : undefined}>
                  {new Date(task.deadline).toLocaleString(language === "ru" ? "ru-RU" : "kk-KZ", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </InfoItem>
            )}
            <InfoItem icon={Gauge} label={dict.tasks.complexity}>
              {task.complexity}
            </InfoItem>
            {task.revision_count > 0 && (
              <InfoItem icon={RotateCcw} label={dict.tasks.revisionCount}>
                {task.revision_count}
              </InfoItem>
            )}
          </div>
        </CardBody>
      </Card>

      {canChangeStatus && <StatusChangeForm taskId={task.id} currentStatus={task.status} />}

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-sm font-semibold text-brand-ink">{dict.tasks.comments}</h2>
          <CommentList comments={comments} />
          <AddCommentForm taskId={task.id} />
        </CardBody>
      </Card>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={16} className="mt-0.5 shrink-0 text-brand-text-muted" />
      <div>
        <div className="text-xs text-brand-text-muted">{label}</div>
        <div className="text-brand-ink">{children}</div>
      </div>
    </div>
  );
}
