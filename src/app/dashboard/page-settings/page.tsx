import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageSettingsForm } from "./page-settings-form";

export const metadata: Metadata = { title: "Page", robots: { index: false } };

export default async function PageSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mem } = await supabase
    .from("tenant_members")
    .select("tenant_id, tenants(description, address, logo_url, cover_url)")
    .limit(1).maybeSingle();
  if (!mem) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-ink">Page</h1>
        <p className="mt-4 rounded-card border border-line bg-surface p-6 text-muted">We&apos;re building your menu from your shoot. It goes live shortly.</p>
      </main>
    );
  }
  const t = mem.tenants as unknown as { description: string | null; address: string | null; logo_url: string | null; cover_url: string | null };

  return (
    <main className="mx-auto max-w-3xl px-5 py-6 lg:px-8 lg:py-8">
      <h1 className="font-display text-2xl font-bold text-ink">Page</h1>
      <p className="text-sm text-muted">Your logo, cover, description, and location.</p>
      <PageSettingsForm tenantId={mem.tenant_id as string} description={t.description} address={t.address} logoUrl={t.logo_url} coverUrl={t.cover_url} />
    </main>
  );
}
