import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminHeader } from "../admin-header";
import { LandingAdmin } from "./landing-admin";

export const metadata: Metadata = { title: "Admin · Landing", robots: { index: false } };

type TickerItem = { id: string; name: string; position: number };

export default async function AdminLandingPage() {
  if (!(await currentAdmin())) notFound();
  const svc = createAdminClient();
  const [{ data }, { data: tenants }] = await Promise.all([
    svc.from("ticker_items").select("id, name, position").order("position").returns<TickerItem[]>(),
    svc.from("tenants").select("name, slug, plan").order("name").returns<{ name: string; slug: string; plan: string }[]>(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-6 lg:px-8 lg:py-8">
      <AdminHeader title="Landing" subtitle="Hero carousel restaurant names" tenants={tenants ?? []} />
      <p className="mt-4 text-sm text-muted">Restaurant names in the scrolling carousel under the hero. Add the spots you want to show off as social proof.</p>
      <LandingAdmin items={data ?? []} />
    </main>
  );
}
