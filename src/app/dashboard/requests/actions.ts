"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitChangeRequest(input: { kind: string; message: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const message = input.message?.trim();
  if (!message) return { ok: false, error: "Please describe the change you'd like." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const { data: mem } = await supabase.from("tenant_members").select("tenant_id").limit(1).maybeSingle();
  if (!mem) return { ok: false, error: "We couldn't find your menu." };

  const { error } = await supabase.from("change_requests").insert({
    tenant_id: mem.tenant_id, kind: input.kind, message, created_by: user.id,
  });
  if (error) return { ok: false, error: "Could not send, please try again." };
  revalidatePath("/dashboard/requests");
  return { ok: true };
}

// Owner answers/approves an open request; it goes back to the Plato team (in_progress).
// RLS (cr_all) scopes the update to the owner's own tenant; read-only impersonation
// (admin, not a member) can't write, and the UI hides the controls there anyway.
export async function respondToRequest(id: string, reply: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const text = reply?.trim();
  if (!text) return { ok: false, error: "Write a short reply first." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const { error } = await supabase
    .from("change_requests")
    .update({ owner_reply: text, replied_at: new Date().toISOString(), status: "in_progress" })
    .eq("id", id)
    .neq("status", "done");
  if (error) return { ok: false, error: "Could not send, please try again." };
  revalidatePath("/dashboard/requests");
  return { ok: true };
}
