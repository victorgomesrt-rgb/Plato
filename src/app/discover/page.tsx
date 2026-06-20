import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { DiscoverList, type DiscoverCard } from "./discover-list";

// Public, indexable directory of live menus (qa §5). Premium featured first.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Discover restaurants",
  description: "Browse video menus from restaurants across Aruba on Plato. Watch the dishes, then go.",
  alternates: { canonical: "/discover" },
};

export default async function DiscoverPage() {
  const svc = createAdminClient();
  const { data } = await svc
    .from("tenants")
    .select("slug, name, description, cover_url, logo_url, accent_color, plan, hours, address")
    .not("published_at", "is", null)
    .not("status", "in", "(building,suspended,canceled)")
    .order("name")
    .returns<DiscoverCard[]>();

  return <DiscoverList tenants={data ?? []} />;
}
