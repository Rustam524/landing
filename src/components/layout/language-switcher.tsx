"use client";

import { useTransition } from "react";
import { updateLanguage } from "@/app/(app)/settings/actions";
import type { AppLanguage } from "@/lib/types/database";

export function LanguageSwitcher({ currentLanguage }: { currentLanguage: AppLanguage }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      {(["ru", "kk"] as const).map((lang) => (
        <button
          key={lang}
          disabled={pending}
          onClick={() => startTransition(() => updateLanguage(lang))}
          className={
            lang === currentLanguage
              ? "rounded-md bg-brand-muted px-2 py-1 text-brand-primary"
              : "rounded-md px-2 py-1 text-brand-text-muted hover:bg-brand-muted"
          }
        >
          {lang === "ru" ? "RU" : "KZ"}
        </button>
      ))}
    </div>
  );
}
