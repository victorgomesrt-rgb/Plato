import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QrCode } from "lucide-react";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin · QR codes", robots: { index: false } };

type Tenant = { id: string; slug: string; name: string; plan: string };

export default async function AdminQrPage() {
  if (!(await currentAdmin())) notFound();
  const { data } = await createAdminClient()
    .from("tenants").select("id, slug, name, plan").order("name").returns<Tenant[]>();
  const tenants = data ?? [];

  return (
    <main className="mx-auto max-w-4xl px-5 py-6 lg:px-8 lg:py-8">
      <h1 className="font-display text-2xl font-bold text-ink">QR codes</h1>
      <p className="text-sm text-muted">Pick a restaurant to generate and download its QR + NFC codes.</p>

      {tenants.length === 0 ? (
        <div className="mt-6 rounded-card border border-line bg-surface p-8 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-line text-muted"><QrCode className="h-5 w-5" /></span>
          <p className="mt-3 font-medium text-ink">No restaurants yet</p>
          <p className="mt-1 text-sm text-muted">Provision a client first, then generate their codes here.</p>
        </div>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {tenants.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/tenants/${t.slug}/qr`} className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 transition hover:border-ink/20">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent"><QrCode className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{t.name}</p>
                  <p className="truncate text-xs text-muted">platodigital.io/{t.slug} · {t.plan}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
