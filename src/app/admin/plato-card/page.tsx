import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminHeader } from "../admin-header";
import { PlatoCardAdmin, type Blast } from "./plato-card-admin";

export const metadata: Metadata = { title: "Admin · Plato Card", robots: { index: false } };

const WEEKLY_CAP = 7;

export default async function AdminPlatoCardPage() {
  if (!(await currentAdmin())) notFound();
  const svc = createAdminClient();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [{ data: blasts }, { count: partnerCount }, { count: sentThisWeek }, { data: tenants }] = await Promise.all([
    svc.from("wallet_blasts").select("id, tenant_id, message, status, scheduled_at, sent_at, created_at, tenants(name)").order("created_at", { ascending: false }).limit(60).returns<Blast[]>(),
    svc.from("tenants").select("id", { count: "exact", head: true }).eq("wallet_partner", true),
    svc.from("wallet_blasts").select("id", { count: "exact", head: true }).eq("status", "sent").gte("sent_at", since),
    svc.from("tenants").select("name, slug, plan").order("name").returns<{ name: string; slug: string; plan: string }[]>(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-5 py-6 lg:px-8 lg:py-8">
      <AdminHeader title="Plato Card" subtitle="Apple Wallet loyalty — blasts, promos, partners" tenants={tenants ?? []} />
      <PlatoCardAdmin blasts={blasts ?? []} partnerCount={partnerCount ?? 0} sentThisWeek={sentThisWeek ?? 0} weeklyCap={WEEKLY_CAP} />
    </main>
  );
}
