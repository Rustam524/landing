"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/input";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { createProject, type ProjectFormState } from "./actions";

export function AddProjectDialog({
  open,
  onClose,
  clients,
}: {
  open: boolean;
  onClose: () => void;
  clients: { id: string; name: string }[];
}) {
  const { dict } = useDictionary();
  const [state, formAction, pending] = useActionState<ProjectFormState, FormData>(
    createProject,
    undefined,
  );

  return (
    <Modal open={open} onClose={onClose} title={dict.projects.createTitle}>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">{dict.projects.name}</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="clientId">{dict.projects.client}</Label>
          <Select id="clientId" name="clientId" defaultValue="">
            <option value="">{dict.projects.noClient}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="startDate">{dict.projects.startDate}</Label>
            <Input id="startDate" name="startDate" type="date" />
          </div>
          <div>
            <Label htmlFor="endDate">{dict.projects.endDate}</Label>
            <Input id="endDate" name="endDate" type="date" />
          </div>
        </div>
        <div>
          <Label htmlFor="socialLinks">
            {dict.projects.socialLinks}{" "}
            <span className="text-brand-text-muted">({dict.common.optional})</span>
          </Label>
          <Input id="socialLinks" name="socialLinks" placeholder={dict.projects.socialLinksPlaceholder} />
        </div>
        <div>
          <Label htmlFor="description">
            {dict.projects.description}{" "}
            <span className="text-brand-text-muted">({dict.common.optional})</span>
          </Label>
          <Textarea id="description" name="description" rows={3} />
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
