"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, type FormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ru } from "@/lib/i18n/dictionaries/ru";
import { kk } from "@/lib/i18n/dictionaries/kk";

export function LoginForm({ next }: { next: string }) {
  const [lang, setLang] = useState<"ru" | "kk">("ru");
  const dict = lang === "ru" ? ru : kk;
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    login,
    undefined,
  );

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-brand-ink">{dict.auth.loginTitle}</h1>
          <p className="mt-1 text-sm text-brand-text-muted">{dict.auth.loginSubtitle}</p>
        </div>
        <div className="flex shrink-0 gap-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setLang("ru")}
            className={lang === "ru" ? "text-brand-primary underline" : "text-brand-text-muted"}
          >
            RU
          </button>
          <span className="text-brand-border">/</span>
          <button
            type="button"
            onClick={() => setLang("kk")}
            className={lang === "kk" ? "text-brand-primary underline" : "text-brand-text-muted"}
          >
            KZ
          </button>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <Label htmlFor="email">{dict.auth.email}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">{dict.auth.password}</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>

        {state?.error && (
          <p className="text-sm text-brand-accent">
            {dict.auth[state.error as keyof typeof dict.auth] ?? state.error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? dict.auth.loggingIn : dict.auth.loginButton}
        </Button>

        <div className="text-center">
          <Link href="/reset-password" className="text-sm text-brand-primary hover:underline">
            {dict.auth.forgotPassword}
          </Link>
        </div>
      </form>
    </div>
  );
}
