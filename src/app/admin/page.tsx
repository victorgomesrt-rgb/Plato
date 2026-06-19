import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { planPrice } from "@/lib/plans";
import { SignOutButton } from "@/components/sign-out-button";
import { AdminConsole, type TenantRow } from "./admin-console";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const arubaMonth = (d: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba", year: "numeric", month: "2-digit" }).format(
    new Date(d)
  );

export default async function AdminPage() {
  const admin = await currentAdmin();
  if (!admin) notFound();

  const svc = createAdminClient();
  const { data } = await svc
    .from("tenants")
    .select("id, name, slug, plan, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .returns<TenantRow[]>();
  const tenants = data ?? [];

  const thisMonth = arubaMonth(new Date().toISOString());
  const overview = {
    mrr: tenants.filter((t) => t.status === "active").reduce((a, t) => a + planPrice(t.plan), 0),
    active: tenants.filter((t) => t.status === "active").length,
    pastDue: tenants.filter((t) => t.status === "past_due").length,
    building: tenants.filter((t) => t.status === "building").length,
    newThisMonth: tenants.filter((t) => arubaMonth(t.created_at) === thisMonth).length,
    churnThisMonth: tenants.filter(
      (t) => t.status === "canceled" && arubaMonth(t.updated_at) === thisMonth
    ).length,
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Plato Admin</h1>
        <SignOutButton />
      </div>
      <p className="mt-1 text-sm text-muted">{admin.email}</p>

      <div className="mt-6 flex items-center gap-3">
        <Link href="/admin/new-client" className="rounded-btn bg-accent px-4 py-2.5 text-sm font-medium text-white">
          + New client
        </Link>
        <Link href="/admin/billing" className="rounded-btn border border-line px-4 py-2.5 text-sm font-medium text-ink">
          Billing
        </Link>
      </div>

      <AdminConsole overview={overview} tenants={tenants} />
    </main>
  );
}
