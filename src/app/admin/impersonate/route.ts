import { NextResponse, type NextRequest } from "next/server";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { IMP_COOKIE } from "@/lib/dashboard-context";

// Start "view as owner". A Route Handler (not a Server Action) so the cookie is set
// on a 303 redirect and /dashboard renders from a clean browser GET — redirecting to
// /dashboard from inside a Server Action fails to render on Vercel.
export async function POST(req: NextRequest) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.redirect(new URL("/admin", req.url), 303);

  const form = await req.formData();
  const tenantId = String(form.get("tenant_id") ?? "").trim();
  if (!tenantId) return NextResponse.redirect(new URL("/admin", req.url), 303);

  const svc = createAdminClient();
  await svc.from("admin_impersonations").insert({ admin_id: admin.id, tenant_id: tenantId });

  const res = NextResponse.redirect(new URL("/dashboard", req.url), 303);
  res.cookies.set(IMP_COOKIE, tenantId, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 2 });
  return res;
}
