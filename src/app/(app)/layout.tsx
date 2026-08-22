import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { DictionaryProvider } from "@/lib/i18n/dictionary-provider";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentProfile();

  if (!session) redirect("/login");
  if (session.profile.status === "blocked") redirect("/login?error=accountBlocked");
  if (session.profile.must_change_password) redirect("/change-password");

  const dict = getDictionary(session.profile.language);

  return (
    <DictionaryProvider dict={dict} language={session.profile.language}>
      <AppShell profile={session.profile}>{children}</AppShell>
    </DictionaryProvider>
  );
}
