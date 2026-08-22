"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ClientFormState = { error?: string; success?: boolean } | undefined;

export async function createClientRecord(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const contactInfo = String(formData.get("contactInfo") ?? "").trim();

  if (!name) return { error: "required" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "invalidCredentials" };

  const { data: client, error } = await supabase
    .from("clients")
    .insert({ name, contact_info: contactInfo || null, created_by: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("activity_log").insert({
    user_id: user.id,
    action: "client_created",
    entity_type: "client",
    entity_id: client.id,
    details: { name },
  });

  revalidatePath("/clients");
  return { success: true };
}
