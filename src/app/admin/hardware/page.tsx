import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminHeader } from "../admin-header";
import { HardwareAdmin, type Order } from "./hardware-admin";

export const metadata: Metadata = { title: "Admin · Hardware", robots: { index: false } };

export default async function AdminHardwarePage() {
  if (!(await currentAdmin())) notFound();
  const svc = createAdminClient();
  const [{ data: orders }, { data: tenants }] = await Promise.all([
    svc.from("hardware_orders").select("id, item_type, quantity, notes, status, created_at, tenants(name)").order("created_at", { ascending: false }).limit(100).returns<Order[]>(),
    svc.from("tenants").select("id, name, slug, plan").order("name").returns<{ id: string; name: string; slug: string; plan: string }[]>(),
  ]);
  const ts = tenants ?? [];
  return (
    <main className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
      <AdminHeader title="Hardware" subtitle="Stock & fulfillment" tenants={ts.map((t) => ({ name: t.name, slug: t.slug, plan: t.plan }))} />
      <HardwareAdmin orders={orders ?? []} tenants={ts.map((t) => ({ id: t.id, name: t.name }))} />
    </main>
  );
}
