"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTempPassword } from "@/lib/utils/generate-password";
import type { AccountStatus, AppLanguage, UserRole } from "@/lib/types/database";

async function requireDirector() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "director") return null;
  return { supabase, userId: user.id };
}

export type CreateEmployeeState =
  | { error: string }
  | { success: true; tempPassword: string; fullName: string }
  | undefined;

export async function createEmployee(
  _prevState: CreateEmployeeState,
  formData: FormData,
): Promise<CreateEmployeeState> {
  const ctx = await requireDirector();
  if (!ctx) return { error: "forbidden" };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "smm") as UserRole;
  const position = String(formData.get("position") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const language = String(formData.get("language") ?? "ru") as AppLanguage;

  if (!fullName || !email) return { error: "required" };

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Supabase is not configured" };
  }

  const tempPassword = generateTempPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      position: position || null,
      phone: phone || null,
      language,
    },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "unknown" };
  }

  await admin.from("activity_log").insert({
    user_id: ctx.userId,
    action: "employee_created",
    entity_type: "profile",
    entity_id: data.user.id,
    details: { full_name: fullName, role },
  });

  revalidatePath("/employees");
  return { success: true, tempPassword, fullName };
}

export async function setEmployeeStatus(employeeId: string, nextStatus: AccountStatus) {
  const ctx = await requireDirector();
  if (!ctx) return;

  await ctx.supabase.from("profiles").update({ status: nextStatus }).eq("id", employeeId);
  await ctx.supabase.from("activity_log").insert({
    user_id: ctx.userId,
    action: nextStatus === "blocked" ? "employee_blocked" : "employee_restored",
    entity_type: "profile",
    entity_id: employeeId,
  });

  revalidatePath("/employees");
}
