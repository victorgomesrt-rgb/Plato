import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { HardwareAdmin, type Order } from "./hardware-admin";

export const metadata: Metadata = { title: "Admin · Hardware", robots: { index: false } };

export default async function AdminHardwarePage() {
  if (!(await currentAdmin())) notFound();
  const svc = createAdminClient();
  const [{ data: orders }, { data: tenants }] = await Promise.all([
    svc.from("hardware_orders").select("id, item_type, quantity, notes, status, created_at, tenants(name)").order("created_at", { ascending: false }).limit(100).returns<Order[]>(),
    svc.from("tenants").select("id, name").order("name").returns<{ id: string; name: string }[]>(),
  ]);
  return (
    <main className="mx-auto max-w-4xl px-5 py-6 lg:px-8 lg:py-8">
      <h1 className="font-display text-2xl font-bold text-ink">Hardware</h1>
      <p className="text-sm text-muted">Order and fulfil QR stickers, NFC tags, stands and decals for tenants.</p>
      <HardwareAdmin orders={orders ?? []} tenants={tenants ?? []} />
    </main>
  );
}
