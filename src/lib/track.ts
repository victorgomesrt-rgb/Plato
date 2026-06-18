import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "./supabase/admin";

// Tracked redirect for QR/NFC (architecture §13). Logs the scan/tap via the service
// role, increments the counter, then 302s to the tenant's menu. Never points QR/NFC
// straight at the menu, so counts stay reliable and targets can change without reprinting.
export async function trackRedirect(code: string, eventType: "qr_scan" | "nfc_tap") {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://platodigital.io";
  const svc = createAdminClient();

  const { data: link } = await svc
    .from("short_links")
    .select("id, scans, tenant_id, tenants(slug)")
    .eq("code", code)
    .maybeSingle();

  const tenant = (link?.tenants ?? null) as { slug: string } | null;
  if (!link || !tenant) return NextResponse.redirect(site, { status: 302 });

  await Promise.all([
    svc.from("short_links").update({ scans: (link.scans ?? 0) + 1 }).eq("id", link.id),
    svc.from("analytics_events").insert({ tenant_id: link.tenant_id, event_type: eventType }),
  ]);

  return NextResponse.redirect(`${site}/${tenant.slug}`, { status: 302 });
}
