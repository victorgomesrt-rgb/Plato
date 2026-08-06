import { NextResponse, type NextRequest } from "next/server";
import { resolveDashboard } from "@/lib/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Owner-facing invoice PDF link. The stored `pdf_url` is a path in the PRIVATE `invoices`
// bucket, so it can't be linked directly. We gate on tenant membership (resolveDashboard),
// confirm the invoice belongs to the caller's tenant, then 302 to a short-lived signed URL.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await resolveDashboard();
  if (res.state !== "ok") return NextResponse.redirect(new URL("/login", req.url));

  const svc = createAdminClient();
  const { data: inv } = await svc
    .from("invoices")
    .select("pdf_url, tenant_id")
    .eq("id", id)
    .maybeSingle();

  // Not found, not this tenant's invoice, or not issued yet → back to Billing.
  if (!inv || inv.tenant_id !== res.ctx.tenantId || !inv.pdf_url) {
    return NextResponse.redirect(new URL("/dashboard/billing", req.url));
  }

  const { data } = await svc.storage.from("invoices").createSignedUrl(inv.pdf_url, 60 * 10);
  if (!data) return NextResponse.redirect(new URL("/dashboard/billing", req.url));
  return NextResponse.redirect(data.signedUrl);
}
