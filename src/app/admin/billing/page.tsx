import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { BillingAdmin } from "./billing-admin";

export const metadata: Metadata = { title: "Billing", robots: { index: false } };

export default async function BillingPage() {
  if (!(await currentAdmin())) notFound();
  const svc = createAdminClient();

  const [{ data: tenants }, { data: invoices }] = await Promise.all([
    svc.from("tenants").select("id, name, slug, plan").order("name"),
    svc
      .from("invoices")
      .select("id, number, amount, currency, period_start, period_end, due_date, status, pdf_url, tenants(name)")
      .order("created_at", { ascending: false })
      .returns<
        {
          id: string;
          number: string;
          amount: number;
          currency: string;
          period_start: string | null;
          period_end: string | null;
          due_date: string | null;
          status: string;
          pdf_url: string | null;
          tenants: { name: string } | null;
        }[]
      >(),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link href="/admin" className="text-sm text-muted hover:text-ink">
        ← Admin
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Billing</h1>
      <p className="mt-1 text-sm text-muted">
        Draft invoices, email them via Resend, mark paid to keep a tenant active.
      </p>
      <BillingAdmin tenants={tenants ?? []} invoices={invoices ?? []} />
    </main>
  );
}
