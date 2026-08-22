"use client";

import { useActionState, useState } from "react";
import { updateTaskStatus, type StatusChangeState } from "../actions";
import { Button } from "@/components/ui/button";
import { Select, Textarea, FieldError } from "@/components/ui/input";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { TASK_STATUS_TRANSITIONS } from "@/lib/constants";
import type { TaskStatus } from "@/lib/types/database";

export function StatusChangeForm({ taskId, currentStatus }: { taskId: string; currentStatus: TaskStatus }) {
  const { dict } = useDictionary();
  const [state, formAction, pending] = useActionState<StatusChangeState, FormData>(
    updateTaskStatus,
    undefined,
  );
  const allowed = TASK_STATUS_TRANSITIONS[currentStatus];
  const [nextStatus, setNextStatus] = useState<TaskStatus | "">("");

  if (allowed.length === 0) return null;

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-brand-border bg-brand-muted/50 p-4">
      <input type="hidden" name="taskId" value={taskId} />
      <div>
        <Select
          name="status"
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value as TaskStatus)}
        >
          <option value="" disabled>
            {dict.tasks.status}…
          </option>
          {allowed.map((status) => (
            <option key={status} value={status}>
              {dict.taskStatus[status]}
            </option>
          ))}
        </Select>
      </div>

      {nextStatus === "needs_revision" && (
        <div>
          <Textarea
            name="comment"
            placeholder={dict.tasks.commentRequiredForRevision}
            required
            rows={2}
          />
        </div>
      )}

      {nextStatus && nextStatus !== "needs_revision" && (
        <Textarea
          name="comment"
          placeholder={`${dict.tasks.addComment} (${dict.common.optional})`}
          rows={2}
        />
      )}

      <FieldError>
        {state?.error
          ? (dict.tasks as Record<string, string>)[state.error] ??
            (dict.common as Record<string, string>)[state.error] ??
            state.error
          : undefined}
      </FieldError>

      <Button type="submit" size="sm" disabled={pending || !nextStatus}>
        {dict.common.confirm}
      </Button>
    </form>
  );
}
