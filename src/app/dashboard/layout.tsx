import Link from "next/link";
import { redirect } from "next/navigation";
import { planPrice } from "@/lib/plans";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Toaster } from "@/components/toast";
import { createClient } from "@/lib/supabase/server";
import { resolveDashboard } from "@/lib/dashboard-context";
import { currentAdmin } from "@/lib/admin-auth";

const dateFmt = (d: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/Aruba" }).format(new Date(d));

type TenantBits = {
  name: string; slug: string; plan: string; status: string; published_at: string | null; trial_ends_at: string | null;
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const res = await resolveDashboard();
  if (res.state === "redirect") redirect("/login");

  // A signed-in user with no tenant must NOT land on a placeholder owner dashboard.
  // Platform admins (e.g. adrian@ with no restaurant of their own) go to the admin
  // console; a genuine non-admin with no restaurant sees a short note instead.
  const admin = await currentAdmin();
  if (res.state === "no_tenant") {
    if (admin) redirect("/admin");
    return (
      <main className="grid min-h-screen place-items-center bg-[#FAF8F4] px-6 text-center">
        <div>
          <p className="font-display text-lg font-semibold text-ink">No restaurant linked to this account</p>
          <p className="mt-2 text-sm text-muted">Ask your Plato contact to finish setup.</p>
        </div>
      </main>
    );
  }

  let t: TenantBits | null = null;
  let impersonating = false;
  let requestCount = 0;
  if (res.state === "ok") {
    impersonating = res.ctx.impersonating;
    const [{ data }, { count }] = await Promise.all([
      res.ctx.db
        .from("tenants")
        .select("name, slug, plan, status, published_at, trial_ends_at")
        .eq("id", res.ctx.tenantId)
        .maybeSingle(),
      res.ctx.db
        .from("change_requests")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", res.ctx.tenantId)
        .neq("status", "done"),
    ]);
    t = (data as TenantBits | null) ?? null;
    requestCount = count ?? 0;
  }

  // Owner identity for the sidebar account row.
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const ownerEmail = (claims?.claims?.email as string | undefined) ?? "";
  const ownerId = (claims?.claims?.sub as string | undefined) ?? "";
  const { data: profile } = ownerId
    ? await supabase.from("profiles").select("full_name").eq("id", ownerId).maybeSingle()
    : { data: null };
  const ownerName = (profile?.full_name as string | null)?.trim() || ownerEmail.split("@")[0] || "Owner";

  const plan = t?.plan ?? "starter";
  const live = !!t?.published_at && !["building", "suspended", "canceled"].includes(t?.status ?? "");
  const renews = t?.status === "trialing" && t?.trial_ends_at ? dateFmt(t.trial_ends_at) : null;

  // Trial-ending / past-due banners (design.md §7). Read the clock once.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const trialDaysLeft =
    t?.status === "trialing" && t?.trial_ends_at
      ? (() => { const d = Math.ceil((new Date(t.trial_ends_at).getTime() - nowMs) / 86_400_000); return d >= 0 && d <= 3 ? d : null; })()
      : null;
  const pastDue = t?.status === "past_due";

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <DashboardSidebar
        name={t?.name ?? "Your restaurant"}
        slug={t?.slug ?? ""}
        plan={plan}
        price={`$${planPrice(plan)}`}
        live={live}
        renews={renews}
        requestCount={requestCount}
        ownerName={ownerName}
        ownerEmail={ownerEmail}
        isAdmin={!!admin}
      />
      <div className="md:pl-60">
        {impersonating && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-ink px-5 py-2.5 text-sm text-white lg:px-8">
            <span>Viewing <strong>{t?.name ?? "this restaurant"}</strong> as the owner — read-only (admin).</span>
            <form action="/admin/impersonate/stop" method="post">
              <button type="submit" className="rounded-full bg-white/15 px-3 py-1 font-medium hover:bg-white/25">Exit</button>
            </form>
          </div>
        )}
        {(trialDaysLeft != null || pastDue) && (
          <div className="space-y-2 px-5 pt-4 lg:px-8">
            {trialDaysLeft != null && (
              <div className="rounded-card border border-citrus/50 bg-citrus/10 px-4 py-3 text-sm text-ink">
                {trialDaysLeft === 0 ? "Your trial ends today." : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your trial.`}{" "}
                Keep your menu live, <Link href="/dashboard/billing" className="font-semibold text-accent-deep underline">choose a plan</Link>.
              </div>
            )}
            {pastDue && (
              <div className="rounded-card border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-ink">
                Your payment didn&apos;t go through. Update it to keep your page online, <Link href="/dashboard/billing" className="font-semibold text-accent-deep underline">view billing</Link>.
              </div>
            )}
          </div>
        )}
        {children}
      </div>
      <Toaster />
    </div>
  );
}
