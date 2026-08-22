"use client";

import { useActionState } from "react";
import { completeFirstLogin, type FormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ru as dict } from "@/lib/i18n/dictionaries/ru";

export default function ChangePasswordPage() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    completeFirstLogin,
    undefined,
  );

  return (
    <div>
      <h1 className="text-lg font-semibold text-brand-ink">{dict.auth.changePasswordTitle}</h1>
      <p className="mt-1 text-sm text-brand-text-muted">{dict.auth.mustChangePasswordNotice}</p>

      <form action={formAction} className="mt-5 space-y-4">
        <div>
          <Label htmlFor="password">{dict.auth.newPassword}</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <div>
          <Label htmlFor="confirmPassword">{dict.auth.confirmPassword}</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
        </div>

        {state?.error && (
          <p className="text-sm text-brand-accent">
            {dict.auth[state.error as keyof typeof dict.auth] ?? state.error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {dict.auth.changePasswordButton}
        </Button>
      </form>
    </div>
  );
}
