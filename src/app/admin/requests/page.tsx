import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminHeader } from "../admin-header";
import { RequestsAdmin, type ChangeReq, type HardwareReq } from "./requests-admin";

export const metadata: Metadata = { title: "Admin · Requests", robots: { index: false } };

export default async function AdminRequestsPage() {
  if (!(await currentAdmin())) notFound();
  const svc = createAdminClient();

  const [{ data: crs }, { data: hws }, { data: tenants }] = await Promise.all([
    svc.from("change_requests").select("id, kind, message, status, created_at, owner_reply, tenants(name, slug)").order("created_at", { ascending: false }).limit(100).returns<ChangeReq[]>(),
    svc.from("hardware_orders").select("id, item_type, quantity, notes, status, created_at, tenants(name, slug)").order("created_at", { ascending: false }).limit(100).returns<HardwareReq[]>(),
    svc.from("tenants").select("name, slug, plan").order("name").returns<{ name: string; slug: string; plan: string }[]>(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-5 py-6 lg:px-8 lg:py-8">
      <AdminHeader title="Requests" subtitle="Change requests & hardware orders" tenants={tenants ?? []} />
      <RequestsAdmin changeRequests={crs ?? []} hardwareOrders={hws ?? []} />
    </main>
  );
}
