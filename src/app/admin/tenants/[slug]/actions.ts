"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { itemCap } from "@/lib/plans";

export type ActionResult = { ok: true } | { ok: false; error: string };

const ALLOWED_TAGS = ["popular", "new", "spicy", "vegan", "gluten_free"];

// Authorizes the current user for this tenant (RLS returns the row only for a member
// or platform admin) and returns the bits we need. Throws if not allowed.
async function assertTenant(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("id, slug, plan")
    .eq("id", tenantId)
    .maybeSingle();
  if (!data) throw new Error("Not authorized for this tenant");
  return data as { id: string; slug: string; plan: string };
}

function revalidateTenant(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath(`/admin/tenants/${slug}`);
}

function i18n(es: string | null | undefined) {
  const v = es?.trim();
  return v ? { es: v } : null;
}

/* ---------- Categories ---------- */

export async function createCategory(
  tenantId: string,
  name: string,
  nameEs?: string
): Promise<ActionResult> {
  try {
    const t = await assertTenant(tenantId);
    if (!name?.trim()) return { ok: false, error: "Category name is required" };
    const supabase = await createClient();
    const { count } = await supabase
      .from("menu_categories")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);
    const { error } = await supabase.from("menu_categories").insert({
      tenant_id: tenantId,
      name: name.trim(),
      name_i18n: i18n(nameEs),
      sort_order: count ?? 0,
    });
    if (error) return { ok: false, error: error.message };
    revalidateTenant(t.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateCategory(
  tenantId: string,
  categoryId: string,
  fields: { name?: string; nameEs?: string; isVisible?: boolean }
): Promise<ActionResult> {
  try {
    const t = await assertTenant(tenantId);
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (fields.name !== undefined) patch.name = fields.name.trim();
    if (fields.nameEs !== undefined) patch.name_i18n = i18n(fields.nameEs);
    if (fields.isVisible !== undefined) patch.is_visible = fields.isVisible;
    const { error } = await supabase
      .from("menu_categories")
      .update(patch)
      .eq("id", categoryId)
      .eq("tenant_id", tenantId);
    if (error) return { ok: false, error: error.message };
    revalidateTenant(t.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteCategory(
  tenantId: string,
  categoryId: string
): Promise<ActionResult> {
  try {
    const t = await assertTenant(tenantId);
    const supabase = await createClient();
    const { error } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", categoryId)
      .eq("tenant_id", tenantId);
    if (error) return { ok: false, error: error.message };
    revalidateTenant(t.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function reorderCategories(
  tenantId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  try {
    const t = await assertTenant(tenantId);
    const supabase = await createClient();
    await Promise.all(
      orderedIds.map((id, i) =>
        supabase
          .from("menu_categories")
          .update({ sort_order: i })
          .eq("id", id)
          .eq("tenant_id", tenantId)
      )
    );
    revalidateTenant(t.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ---------- Items ---------- */

export type ItemInput = {
  categoryId: string | null;
  name: string;
  nameEs?: string;
  description?: string;
  descriptionEs?: string;
  price?: number | null;
  priceText?: string | null;
  tags?: string[];
};

export async function createItem(
  tenantId: string,
  input: ItemInput
): Promise<ActionResult> {
  try {
    const t = await assertTenant(tenantId);
    if (!input.name?.trim()) return { ok: false, error: "Item name is required" };
    const supabase = await createClient();

    // Plan cap — enforced on the server, not just the UI (architecture §10).
    const { count } = await supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);
    const cap = itemCap(t.plan);
    if ((count ?? 0) >= cap) {
      return {
        ok: false,
        error: `Your ${t.plan} plan allows up to ${cap} items. Upgrade to add more.`,
      };
    }

    const { count: inCat } = await supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("category_id", input.categoryId);

    const { error } = await supabase.from("menu_items").insert({
      tenant_id: tenantId,
      category_id: input.categoryId,
      name: input.name.trim(),
      name_i18n: i18n(input.nameEs),
      description: input.description?.trim() || null,
      description_i18n: i18n(input.descriptionEs),
      price: input.price ?? null,
      price_text: input.priceText?.trim() || null,
      tags: (input.tags ?? []).filter((x) => ALLOWED_TAGS.includes(x)),
      sort_order: inCat ?? 0,
    });
    if (error) return { ok: false, error: error.message };
    revalidateTenant(t.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateItem(
  tenantId: string,
  itemId: string,
  input: Partial<ItemInput>
): Promise<ActionResult> {
  try {
    const t = await assertTenant(tenantId);
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (input.categoryId !== undefined) patch.category_id = input.categoryId;
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.nameEs !== undefined) patch.name_i18n = i18n(input.nameEs);
    if (input.description !== undefined) patch.description = input.description.trim() || null;
    if (input.descriptionEs !== undefined)
      patch.description_i18n = i18n(input.descriptionEs);
    if (input.price !== undefined) patch.price = input.price;
    if (input.priceText !== undefined) patch.price_text = input.priceText?.trim() || null;
    if (input.tags !== undefined)
      patch.tags = input.tags.filter((x) => ALLOWED_TAGS.includes(x));
    const { error } = await supabase
      .from("menu_items")
      .update(patch)
      .eq("id", itemId)
      .eq("tenant_id", tenantId);
    if (error) return { ok: false, error: error.message };
    revalidateTenant(t.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteItem(tenantId: string, itemId: string): Promise<ActionResult> {
  try {
    const t = await assertTenant(tenantId);
    const supabase = await createClient();
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", itemId)
      .eq("tenant_id", tenantId);
    if (error) return { ok: false, error: error.message };
    revalidateTenant(t.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setAvailability(
  tenantId: string,
  itemId: string,
  isAvailable: boolean
): Promise<ActionResult> {
  try {
    const t = await assertTenant(tenantId);
    const supabase = await createClient();
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: isAvailable })
      .eq("id", itemId)
      .eq("tenant_id", tenantId);
    if (error) return { ok: false, error: error.message };
    revalidateTenant(t.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setFeatured(
  tenantId: string,
  itemId: string,
  isFeatured: boolean
): Promise<ActionResult> {
  try {
    const t = await assertTenant(tenantId);
    const supabase = await createClient();
    // Append to the end of the featured order when turning on.
    let rank: number | null = null;
    if (isFeatured) {
      const { count } = await supabase
        .from("menu_items")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_featured", true);
      rank = count ?? 0;
    }
    const { error } = await supabase
      .from("menu_items")
      .update({ is_featured: isFeatured, featured_rank: rank })
      .eq("id", itemId)
      .eq("tenant_id", tenantId);
    if (error) return { ok: false, error: error.message };
    revalidateTenant(t.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function reorderItems(
  tenantId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  try {
    const t = await assertTenant(tenantId);
    const supabase = await createClient();
    await Promise.all(
      orderedIds.map((id, i) =>
        supabase
          .from("menu_items")
          .update({ sort_order: i })
          .eq("id", id)
          .eq("tenant_id", tenantId)
      )
    );
    revalidateTenant(t.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const TEMPLATES = ["grid", "reel", "classic", "spotlight"];

// template is not a privileged column, so RLS (member or admin) permits the update.
export async function setTemplate(
  tenantId: string,
  template: string
): Promise<ActionResult> {
  try {
    const t = await assertTenant(tenantId);
    if (!TEMPLATES.includes(template)) return { ok: false, error: "Invalid template" };
    const supabase = await createClient();
    const { error } = await supabase.from("tenants").update({ template }).eq("id", tenantId);
    if (error) return { ok: false, error: error.message };
    revalidateTenant(t.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ---------- Auto-translate (Claude API) ---------- */

export type TranslateResult =
  | { ok: true; nameEs: string; descriptionEs: string }
  | { ok: false; error: string };

// Fills a Spanish DRAFT for an item from its English text. Never publishes — the
// editor drops the result into the ES fields for the team to review (architecture §28).
export async function translateItemDraft(
  tenantId: string,
  name: string,
  description: string
): Promise<TranslateResult> {
  try {
    await assertTenant(tenantId);
    const { translateToEs } = await import("@/lib/translate");
    const out = await translateToEs(name, description);
    return { ok: true, ...out };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
