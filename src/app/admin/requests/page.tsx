import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { RequestsAdmin, type ChangeReq, type HardwareReq } from "./requests-admin";

export const metadata: Metadata = { title: "Admin · Requests", robots: { index: false } };

export default async function AdminRequestsPage() {
  const admin = await currentAdmin();
  if (!admin) notFound();
  const svc = createAdminClient();

  const [{ data: crs }, { data: hws }] = await Promise.all([
    svc.from("change_requests").select("id, kind, message, status, created_at, tenants(name, slug)").order("created_at", { ascending: false }).limit(100).returns<ChangeReq[]>(),
    svc.from("hardware_orders").select("id, item_type, quantity, notes, status, created_at, tenants(name, slug)").order("created_at", { ascending: false }).limit(100).returns<HardwareReq[]>(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-5 py-6 lg:px-8 lg:py-8">
      <h1 className="font-display text-2xl font-bold text-ink">Requests</h1>
      <p className="text-sm text-muted">Change requests and hardware orders across all tenants.</p>
      <RequestsAdmin changeRequests={crs ?? []} hardwareOrders={hws ?? []} />
    </main>
  );
}
