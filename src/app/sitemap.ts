import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://platodigital.io";

// Sitemap of marketing + every published tenant menu (architecture §14/§25).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const svc = createAdminClient();
  const { data } = await svc
    .from("tenants")
    .select("slug, updated_at")
    .not("published_at", "is", null)
    .not("status", "in", "(building,suspended,canceled)");

  const tenants: MetadataRoute.Sitemap = (data ?? []).map((t) => ({
    url: `${SITE}/${t.slug}`,
    lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/discover`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE}/card`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/book`, changeFrequency: "monthly", priority: 0.6 },
    ...tenants,
  ];
}
