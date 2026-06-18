import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getTenantBySlug,
  getTenantByPreviousSlug,
  publicState,
  type Tenant,
} from "@/lib/tenant";
import { getMenu } from "@/lib/menu";

type Props = { params: Promise<{ slug: string }> };

// Public pages are cached and revalidated on menu edits (M5). Short window for now.
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || publicState(tenant) !== "ok") {
    return { title: "Menu", robots: { index: false } };
  }
  return {
    title: tenant.name,
    description: tenant.description ?? undefined,
    alternates: { canonical: `/${tenant.slug}` },
    openGraph: {
      title: tenant.name,
      description: tenant.description ?? undefined,
      images: tenant.cover_url ? [tenant.cover_url] : undefined,
    },
  };
}

function priceLabel(item: { price: number | null; price_text: string | null }) {
  if (item.price_text) return item.price_text;
  if (item.price != null) return `$${item.price.toFixed(2)}`;
  return "";
}

function Unavailable() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-xl font-semibold text-ink">
        This menu is not available right now
      </h1>
      <p className="text-muted">Please check back soon.</p>
    </main>
  );
}

export default async function TenantPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  // 301 from an old slug to the current one (docs/architecture.md §21).
  if (!tenant) {
    const renamed = await getTenantByPreviousSlug(slug);
    if (renamed) redirect(`/${renamed.slug}`);
  }

  const state = publicState(tenant);
  if (state === "not_found") notFound();
  if (state === "unavailable") return <Unavailable />;

  const t = tenant as Tenant;
  const { categories, items } = await getMenu(t.id);
  const accent = t.accent_color ?? "#FB6A1A";

  // NOTE: minimal render to prove the data path + publish gate. The full Grid
  // template, action bar, currency/language toggles, and video come in M5.
  return (
    <main
      className="mx-auto w-full max-w-2xl px-5 pb-16"
      style={{ "--color-accent": accent } as React.CSSProperties}
    >
      <header className="py-8">
        <h1 className="font-display text-3xl font-semibold text-ink">{t.name}</h1>
        {t.description && <p className="mt-2 text-muted">{t.description}</p>}
      </header>

      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category_id === cat.id);
        if (catItems.length === 0) return null;
        return (
          <section key={cat.id} className="mb-8">
            <h2 className="font-display text-lg font-semibold text-ink">{cat.name}</h2>
            <ul className="mt-3 divide-y divide-line">
              {catItems.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-baseline justify-between gap-4 py-3 ${
                    item.is_available ? "" : "opacity-40"
                  }`}
                >
                  <div>
                    <p className="font-medium text-ink">
                      {item.name}
                      {!item.is_available && (
                        <span className="ml-2 text-xs text-muted">Sold out</span>
                      )}
                    </p>
                    {item.description && (
                      <p className="text-sm text-muted">{item.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 font-medium" style={{ color: accent }}>
                    {priceLabel(item)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <footer className="border-t border-line pt-6 text-center text-sm text-muted">
        Powered by Plato
      </footer>
    </main>
  );
}
