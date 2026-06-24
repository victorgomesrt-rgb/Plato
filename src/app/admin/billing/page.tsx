import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminHeader } from "../admin-header";
import { BillingAdmin, type Invoice, type Service } from "./billing-admin";
import { ServicesAdmin } from "./services-admin";

export const metadata: Metadata = { title: "Admin · Billing", robots: { index: false } };

type TenantRow = { id: string; name: string; slug: string; plan: string };

export default async function BillingPage() {
  if (!(await currentAdmin())) notFound();
  const svc = createAdminClient();

  const [{ data: tenants }, { data: invoices }, { data: services }] = await Promise.all([
    svc.from("tenants").select("id, name, slug, plan").order("name").returns<TenantRow[]>(),
    svc
      .from("invoices")
      .select("id, number, amount, currency, description, created_at, due_date, status, pdf_url, tenants(name)")
      .order("created_at", { ascending: false })
      .returns<Invoice[]>(),
    svc
      .from("billing_services")
      .select("id, name, description, unit_price, unit, active")
      .order("sort_order")
      .order("name")
      .returns<Service[]>(),
  ]);
  const ts = tenants ?? [];
  const svcs = services ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
      <AdminHeader title="Billing" subtitle="Invoices & payments" tenants={ts.map((t) => ({ name: t.name, slug: t.slug, plan: t.plan }))} />
      <BillingAdmin tenants={ts} invoices={invoices ?? []} services={svcs} />
      <ServicesAdmin services={svcs} />
    </main>
  );
}
