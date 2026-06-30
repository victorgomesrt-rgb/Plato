import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Review Card mutations as a Route Handler, not a Server Action: the equivalent server
// actions 500'd only on Vercel (same class as the impersonation fix). The admin panel
// calls this via fetch; it returns JSON and the panel does router.refresh() on success.
const shortCode = () => crypto.randomUUID().replace(/-/g, "").slice(0, 8);
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export async function POST(req: NextRequest) {
  if (!(await currentAdmin())) return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 401 });
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
      const now = new Date();
      const due = new Date();
      due.setDate(due.getDate() + 14);
      const { createInvoice } = await import("../../../billing/actions");
      const r = await createInvoice({
        tenantId,
        periodStart: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        periodEnd: isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
        dueDate: isoDate(due),
        lines: [{ serviceId: s?.id ?? null, description: s?.description || "Review card · monthly", quantity: 1, unitPrice: s ? Number(s.unit_price) : 25 }],
      });
      return NextResponse.json(r.ok ? { ok: true } : { ok: false, error: r.error });
    }

    // Client logo: the browser uploaded the original to <tenantId>/_tmp/ (storage RLS
    // allows is_admin()); here we convert HEIC, square it, strip EXIF, store the webp,
    // and set tenants.logo_url. Mirrors processBrandImage but admin-gated, no membership.
    if (op === "logo") {
      const tmpPath = String(body.tmpPath ?? "");
      if (!tmpPath.startsWith(`${tenantId}/_tmp/`)) return NextResponse.json({ ok: false, error: "Bad upload path" });
      const { data: blob, error: dlErr } = await svc.storage.from("item-images").download(tmpPath);
      if (dlErr || !blob) return NextResponse.json({ ok: false, error: dlErr?.message ?? "Upload not found" });
      let input = Buffer.from(await blob.arrayBuffer());
      const { default: sharp } = await import("sharp");
      if (/\.(heic|heif)$/i.test(tmpPath)) {
        const { default: convert } = await import("heic-convert");
        input = Buffer.from(await convert({ buffer: input, format: "JPEG", quality: 0.92 }));
      }
      const out = await sharp(input).rotate().resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      const path = `${tenantId}/_logo.webp`;
      const up = await svc.storage.from("item-images").upload(path, out, { contentType: "image/webp", upsert: true });
      if (up.error) return NextResponse.json({ ok: false, error: up.error.message });
      const { data: pub } = svc.storage.from("item-images").getPublicUrl(path);
      const url = `${pub.publicUrl}?v=${Date.now()}`;
      const { error } = await svc.from("tenants").update({ logo_url: url }).eq("id", tenantId);
      if (error) return NextResponse.json({ ok: false, error: error.message });
      await svc.storage.from("item-images").remove([tmpPath]);
      return NextResponse.json({ ok: true, url });
    }

    if (op === "removeLogo") {
      await svc.storage.from("item-images").remove([`${tenantId}/_logo.webp`]);
      const { error } = await svc.from("tenants").update({ logo_url: null }).eq("id", tenantId);
      if (error) return NextResponse.json({ ok: false, error: error.message });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message });
  }
}
