"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { TASK_STATUSES } from "@/lib/constants";
import { TaskCard } from "./task-card";
import { AddTaskDialog } from "./add-task-dialog";
import type { TaskWithRelations } from "./types";

export function TasksClient({
  tasks,
  projects,
  employees,
  currentUserId,
  canCreate,
}: {
  tasks: TaskWithRelations[];
  projects: { id: string; name: string }[];
  employees: { id: string; full_name: string; role: string }[];
  currentUserId: string;
  canCreate: boolean;
}) {
  const { dict } = useDictionary();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"all" | "mine">("mine");

  const visible = useMemo(
    () => (scope === "mine" ? tasks.filter((t) => t.assignee_id === currentUserId) : tasks),
    [tasks, scope, currentUserId],
  );

  const columns = TASK_STATUSES.filter((s) => s !== "cancelled");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-brand-ink">{dict.tasks.title}</h1>
        <div className="flex items-center gap-2">
          <Select
            value={scope}
            onChange={(e) => setScope(e.target.value as "all" | "mine")}
            className="w-auto"
          >
            <option value="mine">{dict.tasks.myTasks}</option>
            <option value="all">{dict.common.all}</option>
          </Select>
          {canCreate && (
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} />
              {dict.tasks.addTask}
            </Button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-brand-border bg-brand-surface p-6 text-center text-sm text-brand-text-muted">
          {dict.tasks.empty}
        </p>
      ) : (
        <div className="grid gap-4 overflow-x-auto md:grid-cols-5">
          {columns.map((status) => {
            const items = visible.filter((t) => t.status === status);
            return (
              <div key={status} className="min-w-[220px] space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
                    {dict.taskStatus[status]}
                  </span>
                  <span className="text-xs text-brand-text-muted">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddTaskDialog
        open={open}
        onClose={() => setOpen(false)}
        projects={projects}
        employees={employees}
      />
    </div>
  );
}
