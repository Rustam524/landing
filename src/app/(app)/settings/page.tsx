import { getCurrentProfile } from "@/lib/auth/current-profile";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await getCurrentProfile();
  if (!session) return null;

  return <SettingsClient profile={session.profile} email={session.email} />;
}
