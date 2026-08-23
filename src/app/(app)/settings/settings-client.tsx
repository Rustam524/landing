"use client";

import { useActionState } from "react";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { PushNotificationsToggle } from "./push-notifications-toggle";
import { updateProfile, type ProfileFormState } from "./actions";
import type { Profile } from "@/lib/types/database";

export function SettingsClient({ profile, email }: { profile: Profile; email: string | null }) {
  const { dict } = useDictionary();
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    undefined,
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-semibold text-brand-ink">{dict.settings.title}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{dict.settings.profile}</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="fullName">{dict.settings.fullName}</Label>
              <Input id="fullName" name="fullName" defaultValue={profile.full_name} required />
            </div>
            <div>
              <Label htmlFor="phone">{dict.settings.phone}</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} />
            </div>
            <div>
              <Label>{dict.common.email}</Label>
              <p className="text-sm text-brand-text-muted">{email}</p>
            </div>

            <FieldError>{state?.error}</FieldError>
            {state?.success && <p className="text-sm text-emerald-700">{dict.settings.saved}</p>}

            <Button type="submit" disabled={pending}>
              {dict.settings.save}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.settings.account}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-brand-text-muted">{dict.settings.role}</span>
            <span className="text-brand-ink">{dict.roles[profile.role]}</span>
          </div>
          {profile.position && (
            <div className="flex justify-between">
              <span className="text-brand-text-muted">{dict.settings.position}</span>
              <span className="text-brand-ink">{profile.position}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-brand-text-muted">{dict.settings.language}</span>
            <LanguageSwitcher currentLanguage={profile.language} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.settings.notifications}</CardTitle>
        </CardHeader>
        <CardBody>
          <PushNotificationsToggle />
        </CardBody>
      </Card>
    </div>
  );
}
