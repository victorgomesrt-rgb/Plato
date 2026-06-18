import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { QrStudio } from "./qr-studio";

export const metadata: Metadata = { title: "QR codes", robots: { index: false } };

export default async function QrPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await currentAdmin())) notFound();

  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug, name, accent_color, logo_url")
    .eq("slug", slug)
    .maybeSingle();
  if (!tenant) notFound();

  const { data: links } = await supabase
    .from("short_links")
    .select("id, code, kind, placement, scans")
    .eq("tenant_id", tenant.id)
    .order("created_at");

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href={`/admin/tenants/${slug}`} className="text-sm text-muted hover:text-ink">
        ← {tenant.name}
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">QR codes</h1>
      <p className="mt-1 text-sm text-muted">
        Tracked codes point at /q/&lt;code&gt; so every scan is counted and the target can
        change without reprinting.
      </p>
      <QrStudio
        tenant={{
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          accent: tenant.accent_color ?? "#FB6A1A",
          logoUrl: tenant.logo_url,
        }}
        links={links ?? []}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "https://platodigital.io"}
      />
    </main>
  );
}
