"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { getNavItems } from "./nav-config";
import { LanguageSwitcher } from "./language-switcher";
import { logout } from "@/app/(auth)/actions";
import type { Profile } from "@/lib/types/database";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { dict } = useDictionary();
  const navItems = getNavItems(profile.role);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-brand-ink text-brand-cream md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-cream p-[3px] shadow-sm">
            <Image src="/brand/logo.png" alt="ALGORITM" width={30} height={30} className="rounded-full" />
          </div>
          <span className="text-sm font-semibold tracking-wide">ALGORITM</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-accent text-white"
                    : "text-brand-cream/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon size={18} />
                {dict.nav[item.label]}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-3 py-4">
          <div className="px-3 pb-2 text-xs text-brand-cream/60">
            {profile.full_name}
            <br />
            {dict.roles[profile.role]}
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-brand-cream/80 hover:bg-white/10 hover:text-white"
            >
              <LogOut size={18} />
              {dict.nav.logout}
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-brand-border bg-brand-surface px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Image src="/brand/logo.png" alt="ALGORITM" width={28} height={28} className="rounded-full" />
            <span className="text-sm font-semibold text-brand-ink">ALGORITM</span>
          </div>
          <div className="hidden md:block" />
          <LanguageSwitcher currentLanguage={profile.language} />
        </header>

        <main className="flex-1 px-4 py-5 pb-24 md:px-6 md:py-6 md:pb-6">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-brand-border bg-brand-surface py-1.5 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium",
                  active ? "text-brand-accent" : "text-brand-text-muted",
                )}
              >
                <Icon size={20} />
                {dict.nav[item.label]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
