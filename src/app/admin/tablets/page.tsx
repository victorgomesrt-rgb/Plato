import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { TabletsAdmin, type Tablet } from "./tablets-admin";

export const metadata: Metadata = { title: "Admin · Tablets", robots: { index: false } };

export default async function AdminTabletsPage() {
  if (!(await currentAdmin())) notFound();
  const svc = createAdminClient();
  const [{ data: tablets }, { data: tenants }] = await Promise.all([
    svc.from("tablets").select("id, asset_tag, model, status, tenant_id, monthly_fee, deposit, deployed_at, tenants(name)").order("asset_tag").returns<Tablet[]>(),
    svc.from("tenants").select("id, name").order("name").returns<{ id: string; name: string }[]>(),
  ]);
  return (
    <main className="mx-auto max-w-4xl px-5 py-6 lg:px-8 lg:py-8">
      <h1 className="font-display text-2xl font-bold text-ink">Tablets</h1>
      <p className="text-sm text-muted">The rented tablet fleet, assign to a tenant or mark returned for redeploy.</p>
      <TabletsAdmin tablets={tablets ?? []} tenants={tenants ?? []} />
    </main>
  );
}
