import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveDashboard } from "@/lib/dashboard-context";
import type { TenantLink } from "@/lib/tenant";
import { DashboardHeader } from "../dashboard-header";
import { PageSettingsForm } from "./page-settings-form";
import { TemplatePicker } from "./template-picker";
import { LiveCard, OwnerQrCard } from "./page-sidebar";

export const metadata: Metadata = { title: "Your page", robots: { index: false } };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://platodigital.io";

type TenantRow = {
  name: string; slug: string; description: string | null; address: string | null; logo_url: string | null; cover_url: string | null;
  phone: string | null; whatsapp: string | null; lat: number | null; lng: number | null;
  accent_color: string | null; template: string | null; plan: string | null; published_at: string | null;
  hours: Record<string, [string, string] | null> | null; links: TenantLink[] | null;
};

export default async function PageSettings() {
  const res = await resolveDashboard();
  if (res.state === "redirect") redirect("/login");
  if (res.state === "no_tenant") {
    return (
      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-ink">Your page</h1>
        <p className="mt-4 rounded-card border border-line bg-surface p-6 text-muted">We&apos;re building your menu from your shoot. It goes live shortly.</p>
      </main>
    );
  }
  const { db, tenantId, impersonating } = res.ctx;
  const t = ((await db.from("tenants").select("name, slug, description, address, logo_url, cover_url, phone, whatsapp, lat, lng, accent_color, template, plan, published_at, hours, links").eq("id", tenantId).maybeSingle()).data ?? {}) as TenantRow;
  const link = (type: string) => (t.links ?? []).find((l) => l.type === type);
  const premium = t.plan === "premium";

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-8">
      <DashboardHeader title="Your page" subtitle="Template, action bar, languages and QR" slug={t.slug ?? ""} />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.7fr_1fr] lg:items-start">
        <div className="space-y-4">
          <TemplatePicker tenantId={tenantId} current={t.template ?? "grid"} readOnly={impersonating} />
          <PageSettingsForm
            tenantId={tenantId}
            readOnly={impersonating}
            description={t.description} address={t.address} logoUrl={t.logo_url} coverUrl={t.cover_url}
            phone={t.phone} whatsapp={t.whatsapp} lat={t.lat} lng={t.lng} hours={t.hours}
            accentColor={t.accent_color}
            reservationUrl={link("reserve")?.url ?? null}
            websiteUrl={link("website")?.url ?? null}
            instagram={link("instagram")?.url ?? null}
            wifiSsid={link("wifi")?.ssid ?? null}
            wifiPassword={link("wifi")?.password ?? null}
          />
        </div>

        <div className="space-y-4 lg:sticky lg:top-6">
          <LiveCard slug={t.slug ?? ""} live={!!t.published_at} siteUrl={SITE_URL} />
          <OwnerQrCard slug={t.slug ?? ""} name={t.name ?? "Your"} accent={t.accent_color ?? "#FB6A1A"} logoUrl={t.logo_url} premium={premium} siteUrl={SITE_URL} />
        </div>
      </div>
    </main>
  );
}
