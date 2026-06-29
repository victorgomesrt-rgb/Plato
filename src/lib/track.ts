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

// Payment-gated redirect for Review Cards. Resolves a review short link to the tenant's
// Google review URL, but only while the card is active and paid through today (AST).
// Otherwise it 302s to the neutral paused page. The printed card never changes — only this
// gate decides, so Plato can switch it off the moment payment lapses, no reprint.
export async function reviewRedirect(code: string) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://platodigital.io";
  const paused = `${site}/review-unavailable`;
  const svc = createAdminClient();

  const { data: link } = await svc
    .from("short_links")
    .select("id, scans, tenant_id, tenants(review_url, review_active, review_paid_through)")
    .eq("code", code)
    .eq("kind", "review")
    .maybeSingle();

  const tenant = (link?.tenants ?? null) as
    | { review_url: string | null; review_active: boolean; review_paid_through: string | null }
    | null;
  if (!link || !tenant) return NextResponse.redirect(paused, { status: 302 });

  // ISO date strings compare lexicographically, so >= is a valid "paid through" check.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba" }).format(new Date());
  const live =
    !!tenant.review_url &&
    tenant.review_active === true &&
    !!tenant.review_paid_through &&
    tenant.review_paid_through >= today;
  if (!live) return NextResponse.redirect(paused, { status: 302 });

  await Promise.all([
    svc.from("short_links").update({ scans: (link.scans ?? 0) + 1 }).eq("id", link.id),
    svc.from("analytics_events").insert({ tenant_id: link.tenant_id, event_type: "review_scan" }),
  ]);

  return NextResponse.redirect(tenant.review_url as string, { status: 302 });
}
