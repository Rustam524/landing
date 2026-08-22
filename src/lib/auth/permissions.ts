import type { Profile, UserRole } from "@/lib/types/database";

export function isDirector(role: UserRole) {
  return role === "director";
}

export function isManager(role: UserRole) {
  return role === "manager";
}

/** Director + manager can create clients/projects, add members, accept/reject work. */
export function canManageProjects(role: UserRole) {
  return role === "director" || role === "manager";
}

export function canManageEmployees(role: UserRole) {
  return role === "director";
}

export function canAcceptTasks(role: UserRole) {
  return role === "director" || role === "manager";
}

export function displayName(profile: Pick<Profile, "full_name">) {
  return profile.full_name;
}
