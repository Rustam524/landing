"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/input";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { USER_ROLES, APP_LANGUAGES } from "@/lib/constants";
import { createEmployee, type CreateEmployeeState } from "./actions";

export function AddEmployeeDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { dict } = useDictionary();
  const [state, formAction, pending] = useActionState<CreateEmployeeState, FormData>(
    createEmployee,
    undefined,
  );
  const [copied, setCopied] = useState(false);

  const created = state && "success" in state ? state : null;

  function handleClose() {
    setCopied(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={dict.employees.createTitle}>
      {created ? (
        <div className="space-y-4">
          <p className="text-sm text-brand-ink">
            {dict.employees.createSuccess}: <strong>{created.fullName}</strong>
          </p>
          <div className="rounded-lg border border-brand-border bg-brand-muted p-3">
            <div className="text-xs text-brand-text-muted">{dict.employees.tempPassword}</div>
            <div className="mt-1 font-mono text-base text-brand-ink select-all">
              {created.tempPassword}
            </div>
          </div>
          <p className="text-xs text-brand-text-muted">{dict.employees.tempPasswordNotice}</p>
          <Button
            className="w-full"
            onClick={() => {
              navigator.clipboard?.writeText(created.tempPassword).catch(() => {});
              setCopied(true);
            }}
          >
            {copied ? dict.common.success : dict.common.confirm}
          </Button>
          <Button variant="secondary" className="w-full" onClick={handleClose}>
            {dict.common.close}
          </Button>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="fullName">{dict.employees.fullName}</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div>
            <Label htmlFor="email">{dict.common.email}</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="role">{dict.employees.role}</Label>
              <Select id="role" name="role" defaultValue="smm">
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {dict.roles[role]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="language">{dict.employees.language}</Label>
              <Select id="language" name="language" defaultValue="ru">
                {APP_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === "ru" ? "Русский" : "Қазақша"}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="position">
              {dict.employees.position}{" "}
              <span className="text-brand-text-muted">({dict.common.optional})</span>
            </Label>
            <Input id="position" name="position" placeholder={dict.employees.positionPlaceholder} />
          </div>
          <div>
            <Label htmlFor="phone">
              {dict.employees.phone}{" "}
              <span className="text-brand-text-muted">({dict.common.optional})</span>
            </Label>
            <Input id="phone" name="phone" type="tel" />
          </div>

          <FieldError>
            {state && "error" in state ? state.error : undefined}
          </FieldError>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={pending}>
              {dict.common.create}
            </Button>
            <Button type="button" variant="secondary" onClick={handleClose}>
              {dict.common.cancel}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
