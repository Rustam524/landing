"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { Badge } from "@/components/ui/badge";
import { isTaskOverdue } from "@/lib/utils/deadline";
import type { TaskWithRelations } from "./types";

export function TaskCard({ task }: { task: TaskWithRelations }) {
  const { dict } = useDictionary();
  const isOverdue = isTaskOverdue(task.deadline, task.status);

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block rounded-lg border border-brand-border bg-brand-surface p-3 text-sm shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="font-medium text-brand-ink">{task.title}</div>
      {task.project && (
        <div className="mt-1 text-xs text-brand-text-muted">{task.project.name}</div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-brand-text-muted">
          {task.assignee?.full_name ?? dict.tasks.unassigned}
        </span>
        {task.deadline && (
          <span
            className={
              isOverdue
                ? "flex items-center gap-1 text-xs font-medium text-brand-accent"
                : "flex items-center gap-1 text-xs text-brand-text-muted"
            }
          >
            <Clock size={12} />
            {new Date(task.deadline).toLocaleDateString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
            })}
          </span>
        )}
      </div>
      {isOverdue && (
        <div className="mt-1.5">
          <Badge tone="danger">{dict.tasks.overdueLabel}</Badge>
        </div>
      )}
    </Link>
  );
}
