"use server";

import sharp from "sharp";
import convert from "heic-convert";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Res<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

// Gate to a signed-in member of this tenant; returns the slug for revalidation.
async function requireMember(tenantId: string): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: mem } = await supabase
    .from("tenant_members").select("tenants(slug)").eq("tenant_id", tenantId).maybeSingle();
  const slug = (mem?.tenants as unknown as { slug: string } | null)?.slug;
  if (!slug) throw new Error("No access to this menu");
  return slug;
}

export async function updateTenantInfo(tenantId: string, input: { description: string; address: string }): Promise<Res> {
  const supabase = await createClient(); // RLS enforces membership + the privileged-column guard
  const { error } = await supabase
    .from("tenants")
    .update({ description: input.description.trim() || null, address: input.address.trim() || null })
    .eq("id", tenantId);
  if (error) return { ok: false, error: error.message };
  const slug = await requireMember(tenantId);
  revalidatePath(`/${slug}`);
  revalidatePath("/dashboard/page-settings");
  return { ok: true };
}

export async function processBrandImage(tenantId: string, kind: "logo" | "cover", tmpPath: string): Promise<Res<{ url: string }>> {
  try {
    const slug = await requireMember(tenantId);
    if (!tmpPath.startsWith(`${tenantId}/_tmp/`)) return { ok: false, error: "Bad upload path" };
    const svc = createAdminClient();

    const { data: blob, error: dlErr } = await svc.storage.from("item-images").download(tmpPath);
    if (dlErr || !blob) return { ok: false, error: dlErr?.message ?? "Upload not found" };
    let input = Buffer.from(await blob.arrayBuffer());
    if (/\.(heic|heif)$/i.test(tmpPath)) input = Buffer.from(await convert({ buffer: input, format: "JPEG", quality: 0.92 }));

    const size = kind === "cover" ? { width: 1600, height: 900 } : { width: 512, height: 512 };
    const out = await sharp(input).rotate().resize({ ...size, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();

    const path = `${tenantId}/_${kind}.webp`;
    const up = await svc.storage.from("item-images").upload(path, out, { contentType: "image/webp", upsert: true });
    if (up.error) return { ok: false, error: up.error.message };
    const { data: pub } = svc.storage.from("item-images").getPublicUrl(path);
    const url = `${pub.publicUrl}?v=${Date.now()}`;

    const col = kind === "cover" ? "cover_url" : "logo_url";
    const { error: updErr } = await svc.from("tenants").update({ [col]: url }).eq("id", tenantId);
    if (updErr) return { ok: false, error: updErr.message };

    await svc.storage.from("item-images").remove([tmpPath]);
    revalidatePath(`/${slug}`);
    revalidatePath("/dashboard/page-settings");
    return { ok: true, data: { url } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function removeBrandImage(tenantId: string, kind: "logo" | "cover"): Promise<Res> {
  const slug = await requireMember(tenantId);
  const svc = createAdminClient();
  await svc.storage.from("item-images").remove([`${tenantId}/_${kind}.webp`]);
  const col = kind === "cover" ? "cover_url" : "logo_url";
  await svc.from("tenants").update({ [col]: null }).eq("id", tenantId);
  revalidatePath(`/${slug}`);
  revalidatePath("/dashboard/page-settings");
  return { ok: true };
}
