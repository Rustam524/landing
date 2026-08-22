"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { requestPasswordReset, setNewPassword, type FormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ru as dict } from "@/lib/i18n/dictionaries/ru";

/**
 * Doubles as both steps of the recovery flow:
 * - no `type=recovery` session yet → request the email link
 * - arrived here via /auth/callback with a recovery session → set a new password
 */
export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: { recovery?: string };
}) {
  const isRecovery = searchParams?.recovery === "1";

  if (isRecovery) return <SetNewPasswordForm />;
  return <RequestResetForm />;
}

function RequestResetForm() {
  const [sent, setSent] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (prevState, formData) => {
      const result = await requestPasswordReset(prevState, formData);
      if (!result?.error) setSent(true);
      return result;
    },
    undefined,
  );

  if (sent) {
    return <p className="text-sm text-brand-ink">{dict.auth.resetSent}</p>;
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-brand-ink">{dict.auth.resetPasswordTitle}</h1>
      <form action={formAction} className="mt-5 space-y-4">
        <div>
          <Label htmlFor="email">{dict.auth.email}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        {state?.error && <p className="text-sm text-brand-accent">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {dict.auth.resetPasswordButton}
        </Button>
        <div className="text-center">
          <Link href="/login" className="text-sm text-brand-primary hover:underline">
            {dict.common.back}
          </Link>
        </div>
      </form>
    </div>
  );
}

function SetNewPasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    setNewPassword,
    undefined,
  );

  return (
    <div>
      <h1 className="text-lg font-semibold text-brand-ink">{dict.auth.changePasswordTitle}</h1>
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
