"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { ok: true } | { ok: false; error: string };

function shortCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

// Tracked links are written by admin tooling via the service role (short_links has no
// member insert policy — architecture §13). Creates the standard placements if missing.
export async function ensureStandardLinks(tenantId: string, slug: string): Promise<Result> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const svc = createAdminClient();

  const { data: existing } = await svc
    .from("short_links")
    .select("placement")
    .eq("tenant_id", tenantId)
    .eq("kind", "qr");
  const have = new Set((existing ?? []).map((r) => r.placement));

  for (const placement of ["table", "window", "host_stand"]) {
    if (!have.has(placement)) {
      await svc
        .from("short_links")
        .insert({ tenant_id: tenantId, code: shortCode(), kind: "qr", placement });
    }
  }
  revalidatePath(`/admin/tenants/${slug}/qr`);
  return { ok: true };
}
