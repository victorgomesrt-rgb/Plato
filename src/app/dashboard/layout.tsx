import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { planPrice } from "@/lib/plans";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Toaster } from "@/components/toast";

const dateFmt = (d: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/Aruba" }).format(new Date(d));

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mem } = await supabase
    .from("tenant_members")
    .select("tenants(name, slug, plan, status, published_at, trial_ends_at)")
    .limit(1)
    .maybeSingle();
  const t = (mem?.tenants as unknown as {
    name: string; slug: string; plan: string; status: string; published_at: string | null; trial_ends_at: string | null;
  } | null) ?? null;

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
      />
      <div className="md:pl-60">
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
