"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isReservedSlug, isValidSlug } from "@/lib/reserved-slugs";

const PLANS = ["starter", "growth", "premium"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SlugCheck = { available: boolean; reason?: string };
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function checkSlug(raw: string): Promise<SlugCheck> {
  if (!(await currentAdmin())) return { available: false, reason: "Not authorized" };
  const slug = raw.trim().toLowerCase();
  if (!slug) return { available: false };
  if (!isValidSlug(slug))
    return { available: false, reason: "Lowercase letters, numbers, and hyphens only" };
  if (isReservedSlug(slug)) return { available: false, reason: "That word is reserved" };

  const svc = createAdminClient();
  const { data } = await svc.from("tenants").select("id").eq("slug", slug).maybeSingle();
  return data ? { available: false, reason: "Already taken" } : { available: true };
}

export type ProvisionInput = {
  name: string;
  slug: string;
  plan: string;
  email: string;
};
export type ProvisionResult =
  | { ok: true; slug: string; ownerExisted: boolean }
  | { ok: false; error: string };

// Admin "New Client", creates the tenant, the owner account, and the membership,
// then sends a Supabase invite / set-password link. No plaintext password is created.
// docs/architecture.md §19, design.md §5.
export async function provisionClient(input: ProvisionInput): Promise<ProvisionResult> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };

  const name = input.name?.trim();
  const slug = input.slug?.trim().toLowerCase();
  const email = input.email?.trim().toLowerCase();
  const plan = PLANS.includes(input.plan) ? input.plan : "starter";

  if (!name) return { ok: false, error: "Restaurant name is required" };
  if (!isValidSlug(slug))
    return { ok: false, error: "Slug must be lowercase letters, numbers, and hyphens" };
  if (isReservedSlug(slug)) return { ok: false, error: "That slug is reserved" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid owner email" };

  const svc = createAdminClient();

  // Slug availability (also guarded by the DB unique constraint).
  const { data: taken } = await svc.from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (taken) return { ok: false, error: `Slug "${slug}" is already taken` };

  // Create or find the owner auth user. inviteUserByEmail sends the set-password link;
  // the handle_new_user trigger creates their profile row.
  let ownerId: string | null = null;
  let ownerExisted = false;

  const { data: invited, error: inviteErr } = await svc.auth.admin.inviteUserByEmail(email, {
    // Land invited owners on the set-password screen first, then the dashboard.
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  });

  if (invited?.user) {
    ownerId = invited.user.id;
  } else if (inviteErr && /already|registered|exists/i.test(inviteErr.message)) {
    // Owner already has a Plato account, link the new tenant to them.
    const { data: profile } = await svc
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (!profile) return { ok: false, error: "Owner exists but could not be located" };
    ownerId = profile.id;
    ownerExisted = true;
  } else {
    return { ok: false, error: inviteErr?.message ?? "Could not create the owner account" };
  }

  // Create the tenant (status 'building', not public until published in admin).
  const { data: tenant, error: tErr } = await svc
    .from("tenants")
    .insert({ slug, name, plan, status: "building" })
    .select("id")
    .single();
  if (tErr) return { ok: false, error: `Could not create tenant: ${tErr.message}` };

  // Link owner ↔ tenant.
  const { error: mErr } = await svc
    .from("tenant_members")
    .insert({ tenant_id: tenant.id, user_id: ownerId, role: "owner" });
  if (mErr) {
    // Roll back the tenant so a failed link doesn't leave an orphan.
    await svc.from("tenants").delete().eq("id", tenant.id);
    return { ok: false, error: `Could not link owner: ${mErr.message}` };
  }

  revalidatePath("/admin");
  return { ok: true, slug, ownerExisted };
}

/* ---------- Tenant management (admin console) ---------- */

const STATUSES = ["building", "trialing", "active", "past_due", "suspended", "canceled"];

// Status + plan are privileged columns; written via the service role after the admin gate
// (the column guard allows admin / no-auth-session writes). docs/architecture.md §6.
export async function setTenantStatus(
  tenantId: string,
  slug: string,
  status: string
): Promise<ActionResult> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  if (!STATUSES.includes(status)) return { ok: false, error: "Invalid status" };
  const svc = createAdminClient();
  const { error } = await svc.from("tenants").update({ status }).eq("id", tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath(`/${slug}`); // status affects the public publish gate
  return { ok: true };
}

export async function changeTenantPlan(
  tenantId: string,
  plan: string
): Promise<ActionResult> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  if (!PLANS.includes(plan)) return { ok: false, error: "Invalid plan" };
  const svc = createAdminClient();
  const { error } = await svc.from("tenants").update({ plan }).eq("id", tenantId);
  if (error) return { ok: false, error: error.message };
  // Keep the subscription mirror in step so feature gates change immediately.
  await svc.from("subscriptions").update({ plan }).eq("tenant_id", tenantId);
  revalidatePath("/admin");
  return { ok: true };
}
