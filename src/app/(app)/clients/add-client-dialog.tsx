"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { createClientRecord, type ClientFormState } from "./actions";

export function AddClientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dict } = useDictionary();
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ClientFormState, FormData>(
    createClientRecord,
    undefined,
  );

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Modal open={open} onClose={onClose} title={dict.clients.createTitle}>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">{dict.clients.name}</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="contactInfo">
            {dict.clients.contactInfo}{" "}
            <span className="text-brand-text-muted">({dict.common.optional})</span>
          </Label>
          <Input id="contactInfo" name="contactInfo" />
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
