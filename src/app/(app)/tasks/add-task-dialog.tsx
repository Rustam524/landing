"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/input";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { createTask, type TaskFormState } from "./actions";

export function AddTaskDialog({
  open,
  onClose,
  projects,
  employees,
  defaultProjectId,
}: {
  open: boolean;
  onClose: () => void;
  projects: { id: string; name: string }[];
  employees: { id: string; full_name: string; role: string }[];
  defaultProjectId?: string;
}) {
  const { dict } = useDictionary();
  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(
    createTask,
    undefined,
  );

  return (
    <Modal open={open} onClose={onClose} title={dict.tasks.createTitle}>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="title">{dict.tasks.taskTitle}</Label>
          <Input id="title" name="title" required />
        </div>
        <div>
          <Label htmlFor="description">
            {dict.tasks.description}{" "}
            <span className="text-brand-text-muted">({dict.common.optional})</span>
          </Label>
          <Textarea id="description" name="description" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="projectId">{dict.tasks.project}</Label>
            <Select id="projectId" name="projectId" defaultValue={defaultProjectId ?? ""}>
              <option value="">{dict.tasks.noProject}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="assigneeId">{dict.tasks.assignee}</Label>
            <Select id="assigneeId" name="assigneeId" defaultValue="">
              <option value="">{dict.tasks.unassigned}</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="deadline">{dict.tasks.deadline}</Label>
            <Input id="deadline" name="deadline" type="datetime-local" />
          </div>
          <div>
            <Label htmlFor="complexity">{dict.tasks.complexity}</Label>
            <Select id="complexity" name="complexity" defaultValue="1">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </Select>
          </div>
        </div>

        <FieldError>{state?.error}</FieldError>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending ? dict.common.processing : dict.common.create}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            {dict.common.cancel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
