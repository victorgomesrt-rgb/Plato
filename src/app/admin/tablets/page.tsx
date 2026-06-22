import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminHeader } from "../admin-header";
import { TabletsAdmin, type Tablet } from "./tablets-admin";

export const metadata: Metadata = { title: "Admin · Tablets", robots: { index: false } };

export default async function AdminTabletsPage() {
  if (!(await currentAdmin())) notFound();
  const svc = createAdminClient();
  const [{ data: tablets }, { data: tenants }] = await Promise.all([
    svc.from("tablets").select("id, asset_tag, model, status, tenant_id, monthly_fee, deposit, term_months, deployed_at, tenants(name)").order("asset_tag").returns<Tablet[]>(),
    svc.from("tenants").select("id, name, slug, plan").order("name").returns<{ id: string; name: string; slug: string; plan: string }[]>(),
  ]);
  const ts = tenants ?? [];
  return (
    <main className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
      <AdminHeader title="Tablets" subtitle="The rented tablet fleet" tenants={ts.map((t) => ({ name: t.name, slug: t.slug, plan: t.plan }))} />
      <TabletsAdmin tablets={tablets ?? []} tenants={ts.map((t) => ({ id: t.id, name: t.name }))} />
    </main>
  );
}
