import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveDashboard } from "@/lib/dashboard-context";
import { MenuQuickEdit, type QItem, type QCat } from "./menu-quick-edit";

export const metadata: Metadata = { title: "My menu", robots: { index: false } };

export default async function MenuPage() {
  const res = await resolveDashboard();
  if (res.state === "redirect") redirect("/login");
  if (res.state === "no_tenant") {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-ink">My menu</h1>
        <p className="mt-4 rounded-card border border-line bg-surface p-6 text-muted">We&apos;re building your menu from your shoot. It goes live shortly.</p>
      </main>
    );
  }
  const { db, tenantId, impersonating } = res.ctx;
  const tenant = ((await db.from("tenants").select("slug, base_currency").eq("id", tenantId).maybeSingle()).data ?? { slug: "", base_currency: "USD" }) as { slug: string; base_currency: string };
  const [{ data: cats }, { data: items }] = await Promise.all([
    db.from("menu_categories").select("id, name").eq("tenant_id", tenantId).order("sort_order").returns<QCat[]>(),
    db.from("menu_items").select("id, name, price, price_text, is_available, category_id").eq("tenant_id", tenantId).order("sort_order").returns<QItem[]>(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">My menu</h1>
          <p className="text-sm text-muted">Quick edits, mark items sold out or change a price. Bigger changes? <Link href="/dashboard/requests" className="font-medium text-accent">Request a change</Link>.</p>
        </div>
        <a href={`/${tenant.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-btn border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:border-ink/20">View live</a>
      </div>
      {(items ?? []).length === 0 ? (
        <p className="mt-6 rounded-card border border-line bg-surface p-6 text-muted">No items yet. Our team adds them from your shoot.</p>
      ) : (
        <MenuQuickEdit categories={cats ?? []} items={items ?? []} currency={tenant.base_currency ?? "USD"} readOnly={impersonating} />
      )}
    </main>
  );
}
