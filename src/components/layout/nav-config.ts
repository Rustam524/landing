import type { UserRole } from "@/lib/types/database";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  ListChecks,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: keyof Dictionary["nav"];
  icon: LucideIcon;
};

export function getNavItems(role: UserRole): NavItem[] {
  const base: NavItem[] = [
    { href: "/", label: "home", icon: LayoutDashboard },
    { href: "/projects", label: "projects", icon: FolderKanban },
    { href: "/tasks", label: "tasks", icon: ListChecks },
  ];

  const managementItems: NavItem[] = [
    { href: "/employees", label: "employees", icon: Users },
    { href: "/clients", label: "clients", icon: Building2 },
  ];

  const settings: NavItem = { href: "/settings", label: "settings", icon: Settings };

  if (role === "director" || role === "manager") {
    return [base[0], ...managementItems, ...base.slice(1), settings];
  }

  return [...base, settings];
}
