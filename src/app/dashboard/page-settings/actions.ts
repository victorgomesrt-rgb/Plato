"use server";

import sharp from "sharp";
import convert from "heic-convert";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DAY_KEYS } from "@/lib/hours";
import type { TenantLink } from "@/lib/tenant";

type Res<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

type Hours = Record<string, [string, string] | null>;

export type PageDetailsInput = {
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  reservationUrl: string;
  websiteUrl: string;
  instagram: string;
  wifiSsid: string;
  wifiPassword: string;
  lat: string;
  lng: string;
  accentColor: string;
  hours: Hours;
};

// Action-bar button types this form manages; others (share, reviews, …) are preserved.
const MANAGED = new Set(["directions", "call", "whatsapp", "reserve", "website", "instagram", "wifi"]);

function instaUrl(v: string): string {
  const s = v.trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://instagram.com/${s.replace(/^@+/, "")}`;
}

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

export async function updateTenantInfo(tenantId: string, input: PageDetailsInput): Promise<Res> {
  const supabase = await createClient(); // RLS enforces membership + the privileged-column guard

  const phone = input.phone.trim();
  const whatsapp = input.whatsapp.trim();
  const address = input.address.trim();
  const lat = input.lat.trim() === "" ? null : Number(input.lat);
  const lng = input.lng.trim() === "" ? null : Number(input.lng);
  if ((lat !== null && !Number.isFinite(lat)) || (lng !== null && !Number.isFinite(lng)))
    return { ok: false, error: "Map pin must be numbers, e.g. 12.5563, -70.0426." };

  const accent = input.accentColor.trim() || "#FB6A1A";
  if (!/^#[0-9a-fA-F]{6}$/.test(accent)) return { ok: false, error: "Accent color must be a hex like #FB6A1A." };

  // Auto-build the action-bar buttons from the filled fields, in a fixed order.
  const generated: TenantLink[] = [];
  if ((lat !== null && lng !== null) || address) generated.push({ type: "directions" });
  if (phone) generated.push({ type: "call" });
  if (whatsapp) generated.push({ type: "whatsapp" });
  if (input.reservationUrl.trim()) generated.push({ type: "reserve", url: input.reservationUrl.trim() });
  if (input.websiteUrl.trim()) generated.push({ type: "website", url: input.websiteUrl.trim() });
  if (input.instagram.trim()) generated.push({ type: "instagram", url: instaUrl(input.instagram) });
  const ssid = input.wifiSsid.trim(), pass = input.wifiPassword.trim();
  if (ssid || pass) generated.push({ type: "wifi", ssid: ssid || undefined, password: pass || undefined });

  // Preserve any link types this form doesn't manage (e.g. share, reviews).
  const { data: cur } = await supabase.from("tenants").select("links").eq("id", tenantId).maybeSingle();
  const preserved = ((cur?.links as TenantLink[] | null) ?? []).filter((l) => !MANAGED.has(l.type));
  const links = [...generated, ...preserved];

  // Normalize hours: a valid [open, close] pair per open day, null for closed days.
  const hours: Hours = {};
  for (const d of DAY_KEYS) {
    const r = input.hours?.[d];
    hours[d] = r && r[0] && r[1] ? [r[0], r[1]] : null;
  }
  const anyHours = Object.values(hours).some((v) => v !== null);

  const { error } = await supabase
    .from("tenants")
    .update({
      description: input.description.trim() || null,
      address: address || null,
      accent_color: accent,
      phone: phone || null,
      whatsapp: whatsapp || null,
      lat, lng, links,
      hours: anyHours ? hours : null,
    })
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

const TEMPLATES = new Set(["reel", "grid", "classic", "spotlight"]);

// Switch the public menu template. Not a privileged column, so the RLS client is fine.
export async function setTemplate(tenantId: string, template: string): Promise<Res> {
  if (!TEMPLATES.has(template)) return { ok: false, error: "Unknown template" };
  const supabase = await createClient();
  const { error } = await supabase.from("tenants").update({ template }).eq("id", tenantId);
  if (error) return { ok: false, error: error.message };
  const slug = await requireMember(tenantId);
  revalidatePath(`/${slug}`);
  revalidatePath("/dashboard/page-settings");
  return { ok: true };
}
