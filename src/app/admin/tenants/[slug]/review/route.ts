import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { arubaBillingPeriod } from "@/lib/aruba";

// Review Card mutations as a Route Handler, not a Server Action: the equivalent server
// actions 500'd only on Vercel (same class as the impersonation fix). The admin panel
// calls this via fetch; it returns JSON and the panel does router.refresh() on success.
const shortCode = () => crypto.randomUUID().replace(/-/g, "").slice(0, 8);

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await currentAdmin())) return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 401 });
  const { slug } = await params;
  const body = await req.json().catch(() => ({}));
  const { op, tenantId } = body as { op?: string; tenantId?: string };
  if (!tenantId) return NextResponse.json({ ok: false, error: "Missing tenant" }, { status: 400 });
  const svc = createAdminClient();

  try {
    if (op === "save") {
      const url = String(body.url ?? "").trim();
      if (url && !/^https:\/\/\S+$/i.test(url)) return NextResponse.json({ ok: false, error: "Enter a valid https:// review URL" });
      const { error } = await svc
        .from("tenants")
        .update({ review_url: url || null, review_active: !!body.active, review_paid_through: body.paidThrough || null })
        .eq("id", tenantId);
      if (error) return NextResponse.json({ ok: false, error: error.message });
      revalidatePath(`/${slug}`); // the public review landing reads these live values
      return NextResponse.json({ ok: true });
    }

    if (op === "generate") {
      const { data: existing } = await svc.from("short_links").select("code").eq("tenant_id", tenantId).eq("kind", "review").limit(1);
      let code = existing?.[0]?.code as string | undefined;
      if (!code) {
        code = shortCode();
        const { error } = await svc.from("short_links").insert({ tenant_id: tenantId, code, kind: "review", placement: "review" });
        if (error) return NextResponse.json({ ok: false, error: error.message });
      }
      return NextResponse.json({ ok: true, code });
    }

    if (op === "bill") {
      const { data: rows } = await svc.from("billing_services").select("id, unit_price, description").eq("name", "Review card").limit(1);
      const s = rows?.[0];
      const { periodStart, periodEnd, dueDate } = arubaBillingPeriod();
      const { createInvoice } = await import("../../../billing/actions");
      const r = await createInvoice({
        tenantId,
        periodStart,
        periodEnd,
        dueDate,
        lines: [{ serviceId: s?.id ?? null, description: s?.description || "Review card · monthly", quantity: 1, unitPrice: s ? Number(s.unit_price) : 25 }],
      });
      return NextResponse.json(r.ok ? { ok: true } : { ok: false, error: r.error });
    }

    // Client logo: the browser already resized + re-encoded to WebP (canvas, which strips
    // EXIF) and uploaded it to <tenantId>/_logo.webp (storage RLS allows is_admin()). We
    // just point logo_url at it. No server-side sharp — its native binary (libvips) fails
    // to load in a Vercel route handler (ERR_DLOPEN); the browser does the image work.
    if (op === "logo") {
      const path = `${tenantId}/_logo.webp`;
      const { data: pub } = svc.storage.from("item-images").getPublicUrl(path);
      const url = `${pub.publicUrl}?v=${Date.now()}`;
      const { error } = await svc.from("tenants").update({ logo_url: url }).eq("id", tenantId);
      if (error) return NextResponse.json({ ok: false, error: error.message });
      revalidatePath(`/${slug}`); // logo shows on the public review landing
      return NextResponse.json({ ok: true, url });
    }

    if (op === "removeLogo") {
      await svc.storage.from("item-images").remove([`${tenantId}/_logo.webp`]);
      const { error } = await svc.from("tenants").update({ logo_url: null }).eq("id", tenantId);
      if (error) return NextResponse.json({ ok: false, error: error.message });
      revalidatePath(`/${slug}`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message });
  }
}
