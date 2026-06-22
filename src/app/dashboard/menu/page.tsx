import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { resolveDashboard } from "@/lib/dashboard-context";
import { DashboardHeader } from "../dashboard-header";
import { MenuQuickEdit, type QItem, type QCat } from "./menu-quick-edit";

export const metadata: Metadata = { title: "Menu", robots: { index: false } };

const arubaStartUTC = (ymd: string) => `${ymd}T04:00:00.000Z`;
function addDays(s: string, n: number) { const d = new Date(`${s}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

type CatRow = { id: string; name: string; name_i18n: Record<string, string> | null; sort_order: number };
type ItemRow = {
  id: string; name: string; description: string | null; price: number | null; price_text: string | null;
  is_available: boolean; image_url: string | null; video_id: string | null; tags: string[] | null;
  category_id: string | null; sort_order: number;
};

export default async function MenuPage() {
  const res = await resolveDashboard();
  if (res.state === "redirect") redirect("/login");
  if (res.state === "no_tenant") {
    return (
      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-ink">Menu</h1>
        <p className="mt-4 rounded-card border border-line bg-surface p-6 text-muted">We&apos;re building your menu from your shoot. It goes live shortly.</p>
      </main>
    );
  }
  const { db, tenantId, impersonating } = res.ctx;
  const tenant = ((await db.from("tenants").select("slug, base_currency").eq("id", tenantId).maybeSingle()).data ?? { slug: "", base_currency: "USD" }) as { slug: string; base_currency: string };

  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba" }).format(new Date());
  const since30 = addDays(todayStr, -29);
  const [{ data: cats }, { data: items }, { data: playRows }] = await Promise.all([
    db.from("menu_categories").select("id, name, name_i18n, sort_order").eq("tenant_id", tenantId).order("sort_order").returns<CatRow[]>(),
    db.from("menu_items").select("id, name, description, price, price_text, is_available, image_url, video_id, tags, category_id, sort_order").eq("tenant_id", tenantId).order("sort_order").returns<ItemRow[]>(),
    db.rpc("item_play_counts", { p_tenant: tenantId, p_since: arubaStartUTC(since30) }),
  ]);

  const plays = new Map<string, number>();
  for (const r of (playRows ?? []) as unknown as { item_id: string; plays: number }[]) plays.set(r.item_id, Number(r.plays));

  const qItems: QItem[] = (items ?? []).map((i) => ({
    id: i.id, name: i.name, description: i.description, price: i.price, price_text: i.price_text,
    is_available: i.is_available, image_url: i.image_url, hasVideo: !!i.video_id,
    tags: i.tags ?? [], plays: plays.get(i.id) ?? 0, category_id: i.category_id,
  }));
  const qCats: QCat[] = (cats ?? []).map((c) => ({ id: c.id, name: c.name, nameEs: c.name_i18n?.es ?? null }));

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-8">
      <DashboardHeader title="Menu" subtitle="Edit prices and availability, saved instantly" slug={tenant.slug} />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ background: "rgba(251,106,26,0.12)" }}>
            <Zap className="h-5 w-5 text-accent" />
          </span>
          <div>
            <p className="font-semibold text-ink">Prices &amp; availability save instantly</p>
            <p className="text-sm text-muted">Need a new dish, a re-shoot, or a photo swap? Those go through your Plato team.</p>
          </div>
        </div>
        <Link href="/dashboard/requests" className="shrink-0 rounded-btn border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:border-ink/20">Request a change</Link>
      </div>

      {qItems.length === 0 ? (
        <p className="mt-6 rounded-card border border-line bg-surface p-6 text-muted">No items yet. Our team adds them from your shoot.</p>
      ) : (
        <MenuQuickEdit categories={qCats} items={qItems} currency={tenant.base_currency ?? "USD"} readOnly={impersonating} />
      )}
    </main>
  );
}
