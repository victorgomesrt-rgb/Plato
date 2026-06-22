import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getTenantBySlug,
  getTenantByPreviousSlug,
  publicState,
  type Tenant,
} from "@/lib/tenant";
import { getMenu } from "@/lib/menu";
import { arubaNow } from "@/lib/hours";
import { DinerPage } from "@/components/diner/diner-page";

type Props = { params: Promise<{ slug: string }> };

// ISR, revalidated on menu/branding edits via revalidatePath (M4 actions).
export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://platodigital.io";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || publicState(tenant) !== "ok") {
    return { title: "Menu", robots: { index: false } };
  }
  const url = `${SITE}/${tenant.slug}`;
  return {
    title: tenant.name,
    description: tenant.description ?? `Video menu for ${tenant.name}.`,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: tenant.name,
      description: tenant.description ?? undefined,
      url,
    },
  };
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

  if (!tenant) {
    const renamed = await getTenantByPreviousSlug(slug);
    if (renamed) permanentRedirect(`/${renamed.slug}`); // 308: old slug → new, permanent for SEO
  }

  const state = publicState(tenant);
  if (state === "not_found") notFound();
  if (state === "unavailable") return <Unavailable />;

  const t = tenant as Tenant;
  const { categories, items } = await getMenu(t.id);
  const url = `${SITE}/${t.slug}`;

  // schema.org Restaurant + Menu (architecture §14), default-locale strings.
  const ld = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": url,
    url,
    name: t.name,
    description: t.description ?? undefined,
    image: t.cover_url ?? undefined,
    telephone: t.phone ?? undefined,
    address: t.address
      ? { "@type": "PostalAddress", streetAddress: t.address, addressCountry: "AW" }
      : undefined,
    geo:
      t.lat != null && t.lng != null
        ? { "@type": "GeoCoordinates", latitude: t.lat, longitude: t.lng }
        : undefined,
    hasMenu: {
      "@type": "Menu",
      hasMenuSection: categories.map((c) => ({
        "@type": "MenuSection",
        name: c.name,
        hasMenuItem: items
          .filter((i) => i.category_id === c.id)
          .map((i) => ({
            "@type": "MenuItem",
            name: i.name,
            description: i.description ?? undefined,
            offers:
              i.price != null
                ? { "@type": "Offer", price: i.price, priceCurrency: t.base_currency }
                : undefined,
          })),
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escape <, >, & so tenant/owner-supplied text (name, description, items) cannot
        // break out of this <script> block (stored-XSS guard).
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ld).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026"),
        }}
      />
      <DinerPage
        tenant={t}
        categories={categories}
        items={items}
        cdnHost={process.env.BUNNY_CDN_HOSTNAME ?? ""}
        shareUrl={url}
        todayKey={arubaNow().day}
      />
    </>
  );
}
