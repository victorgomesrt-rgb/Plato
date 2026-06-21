import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { planPrice } from "@/lib/plans";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

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
      <div className="md:pl-60">{children}</div>
    </div>
  );
}
