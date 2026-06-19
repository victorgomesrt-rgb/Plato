import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";

// Public, indexable directory of live menus (qa §5). Premium tenants are featured first.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Discover restaurants",
  description: "Browse video menus from restaurants across Aruba on Plato.",
  alternates: { canonical: "/discover" },
};

type Card = {
  slug: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  logo_url: string | null;
  accent_color: string | null;
  plan: string;
};

function RestaurantCard({ t }: { t: Card }) {
  const accent = t.accent_color ?? "#FB6A1A";
  return (
    <Link
      href={`/${t.slug}`}
      className="group overflow-hidden rounded-card border border-line transition hover:shadow-md"
    >
      <div className="relative h-36 w-full overflow-hidden">
        {t.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }} />
        )}
        {t.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.logo_url} alt="" className="absolute bottom-2 left-2 h-10 w-10 rounded-lg object-cover" />
        )}
      </div>
      <div className="p-3">
        <p className="font-display font-semibold text-ink">{t.name}</p>
        {t.description && <p className="line-clamp-2 text-sm text-muted">{t.description}</p>}
      </div>
    </Link>
  );
}

export default async function DiscoverPage() {
  const svc = createAdminClient();
  const { data } = await svc
    .from("tenants")
    .select("slug, name, description, cover_url, logo_url, accent_color, plan")
    .not("published_at", "is", null)
    .not("status", "in", "(building,suspended,canceled)")
    .order("name")
    .returns<Card[]>();

  const tenants = data ?? [];
  const featured = tenants.filter((t) => t.plan === "premium");
  const rest = tenants.filter((t) => t.plan !== "premium");

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex items-center gap-3">
        <Image src="/brand/plato-mark.png" alt="Plato" width={36} height={36} className="h-9 w-9" />
        <h1 className="font-display text-2xl font-semibold text-ink">Discover</h1>
      </div>
      <p className="mt-1 text-muted">Video menus from restaurants across Aruba.</p>

      {tenants.length === 0 ? (
        <p className="mt-8 rounded-card border border-line p-6 text-center text-muted">
          No menus are live yet. Check back soon.
        </p>
      ) : (
        <>
          {featured.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg font-semibold text-ink">Featured</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {featured.map((t) => (
                  <RestaurantCard key={t.slug} t={t} />
                ))}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg font-semibold text-ink">All restaurants</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((t) => (
                  <RestaurantCard key={t.slug} t={t} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
