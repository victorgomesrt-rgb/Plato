import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { LandingAdmin } from "./landing-admin";

export const metadata: Metadata = { title: "Admin · Landing", robots: { index: false } };

type TickerItem = { id: string; name: string; position: number };

export default async function AdminLandingPage() {
  if (!(await currentAdmin())) notFound();
  const { data } = await createAdminClient()
    .from("ticker_items").select("id, name, position").order("position").returns<TickerItem[]>();

  return (
    <main className="mx-auto max-w-2xl px-5 py-6 lg:px-8 lg:py-8">
      <h1 className="font-display text-2xl font-bold text-ink">Landing</h1>
      <p className="text-sm text-muted">Restaurant names in the scrolling carousel under the hero. Add the spots you want to show off as social proof.</p>
      <LandingAdmin items={data ?? []} />
    </main>
  );
}
