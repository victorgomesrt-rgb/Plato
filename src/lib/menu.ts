import "server-only";
import { createAdminClient } from "./supabase/admin";

export type Category = {
  id: string;
  name: string;
  name_i18n: Record<string, string> | null;
  sort_order: number;
};

export type Item = {
  id: string;
  category_id: string | null;
  name: string;
  name_i18n: Record<string, string> | null;
  description: string | null;
  description_i18n: Record<string, string> | null;
  price: number | null;
  price_text: string | null;
  tags: string[] | null;
  is_available: boolean;
  is_featured: boolean;
  featured_rank: number | null;
  sort_order: number;
  image_url: string | null;
  video_id: string | null;
  video_status: string;
  video_thumb_url: string | null;
};

// Visible categories + available-and-unavailable items for a published tenant.
// (Sold-out items still render, greyed — design.md.) Read with the service role.
export async function getMenu(tenantId: string) {
  const admin = createAdminClient();
  const [{ data: categories }, { data: items }] = await Promise.all([
    admin
      .from("menu_categories")
      .select("id, name, name_i18n, sort_order")
      .eq("tenant_id", tenantId)
      .eq("is_visible", true)
      .order("sort_order"),
    admin
      .from("menu_items")
      .select(
        "id, category_id, name, name_i18n, description, description_i18n, price, price_text, tags, is_available, is_featured, featured_rank, sort_order, image_url, video_id, video_status, video_thumb_url"
      )
      .eq("tenant_id", tenantId)
      .order("sort_order"),
  ]);
  return {
    categories: (categories ?? []) as Category[],
    items: (items ?? []) as Item[],
  };
}
