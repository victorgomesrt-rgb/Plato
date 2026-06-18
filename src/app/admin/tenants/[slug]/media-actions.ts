"use server";

import crypto from "node:crypto";
import sharp from "sharp";
import convert from "heic-convert";
import { revalidatePath } from "next/cache";
import { assertTenantAccess } from "@/lib/tenant-access";
import { createAdminClient } from "@/lib/supabase/admin";

type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

function revalidateTenant(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath(`/admin/tenants/${slug}`);
}

/* ---------- Images: HEIC→WebP, EXIF auto-orient + strip (architecture §7) ---------- */
// The client uploads the original to item-images/<tenant>/_tmp/<file> (direct to Storage,
// avoiding serverless body limits). This processes it server-side and stores WebP variants.

export async function processItemImage(
  tenantId: string,
  itemId: string,
  tmpPath: string
): Promise<Result<{ url: string }>> {
  try {
    const t = await assertTenantAccess(tenantId);
    if (!tmpPath.startsWith(`${tenantId}/_tmp/`))
      return { ok: false, error: "Bad upload path" };

    const svc = createAdminClient();
    const { data: blob, error: dlErr } = await svc.storage.from("item-images").download(tmpPath);
    if (dlErr || !blob) return { ok: false, error: dlErr?.message ?? "Upload not found" };

    let input = Buffer.from(await blob.arrayBuffer());

    // HEIC/HEIF can't be decoded by browsers or sharp directly — convert to JPEG first.
    if (/\.(heic|heif)$/i.test(tmpPath)) {
      const out = await convert({ buffer: input, format: "JPEG", quality: 0.92 });
      input = Buffer.from(out);
    }

    // .rotate() with no args applies EXIF orientation; sharp drops metadata on output
    // (so EXIF, including GPS, is stripped). Produce a main image + a thumb, both WebP.
    const base = sharp(input).rotate();
    const main = await base
      .clone()
      .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const thumb = await base
      .clone()
      .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();

    const mainPath = `${tenantId}/${itemId}.webp`;
    const thumbPath = `${tenantId}/${itemId}_thumb.webp`;
    const up1 = await svc.storage
      .from("item-images")
      .upload(mainPath, main, { contentType: "image/webp", upsert: true });
    if (up1.error) return { ok: false, error: up1.error.message };
    await svc.storage
      .from("item-images")
      .upload(thumbPath, thumb, { contentType: "image/webp", upsert: true });

    // Cache-bust so a re-upload to the same path shows immediately.
    const { data: pub } = svc.storage.from("item-images").getPublicUrl(mainPath);
    const url = `${pub.publicUrl}?v=${Date.now()}`;

    const { error: updErr } = await svc
      .from("menu_items")
      .update({ image_url: url })
      .eq("id", itemId)
      .eq("tenant_id", tenantId);
    if (updErr) return { ok: false, error: updErr.message };

    await svc.storage.from("item-images").remove([tmpPath]);
    revalidateTenant(t.slug);
    return { ok: true, data: { url } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function removeItemImage(
  tenantId: string,
  itemId: string
): Promise<Result> {
  try {
    const t = await assertTenantAccess(tenantId);
    const svc = createAdminClient();
    await svc.storage
      .from("item-images")
      .remove([`${tenantId}/${itemId}.webp`, `${tenantId}/${itemId}_thumb.webp`]);
    await svc
      .from("menu_items")
      .update({ image_url: null })
      .eq("id", itemId)
      .eq("tenant_id", tenantId);
    revalidateTenant(t.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ---------- Video: Bunny Stream pipeline (architecture §8) ---------- */

const BUNNY_API = "https://video.bunnycdn.com";

function bunnyEnv() {
  return {
    lib: process.env.BUNNY_STREAM_LIBRARY_ID!,
    key: process.env.BUNNY_STREAM_API_KEY!,
    cdn: process.env.BUNNY_CDN_HOSTNAME!,
  };
}

// Creates the Bunny video, sets the item to 'processing', and returns a presigned TUS
// upload authorization so the browser can upload the bytes directly (key stays server-side).
export async function createVideoUpload(
  tenantId: string,
  itemId: string,
  title: string
): Promise<
  Result<{ videoId: string; libraryId: string; signature: string; expire: number }>
> {
  try {
    const t = await assertTenantAccess(tenantId);
    const { lib, key } = bunnyEnv();

    const res = await fetch(`${BUNNY_API}/library/${lib}/videos`, {
      method: "POST",
      headers: { AccessKey: key, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ title: title || "Plato clip" }),
    });
    if (!res.ok) return { ok: false, error: `Bunny create failed (${res.status})` };
    const video = (await res.json()) as { guid: string };

    const svc = createAdminClient();
    const { error } = await svc
      .from("menu_items")
      .update({
        video_provider: "bunny",
        video_id: video.guid,
        video_status: "processing",
        video_thumb_url: null,
      })
      .eq("id", itemId)
      .eq("tenant_id", tenantId);
    if (error) return { ok: false, error: error.message };

    const expire = Math.floor(Date.now() / 1000) + 3600;
    const signature = crypto
      .createHash("sha256")
      .update(lib + key + expire + video.guid)
      .digest("hex");

    revalidateTenant(t.slug);
    return { ok: true, data: { videoId: video.guid, libraryId: lib, signature, expire } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Polls Bunny for transcode status and flips the item to ready/failed with a poster.
// Bunny status: 0..3 = queued/processing, 4 = finished, 5 = failed.
export async function getVideoStatus(
  tenantId: string,
  itemId: string
): Promise<Result<{ status: "processing" | "ready" | "failed"; thumb?: string }>> {
  try {
    const t = await assertTenantAccess(tenantId);
    const { lib, key, cdn } = bunnyEnv();
    const svc = createAdminClient();

    const { data: item } = await svc
      .from("menu_items")
      .select("video_id")
      .eq("id", itemId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (!item?.video_id) return { ok: false, error: "No video on this item" };

    const res = await fetch(`${BUNNY_API}/library/${lib}/videos/${item.video_id}`, {
      headers: { AccessKey: key, accept: "application/json" },
    });
    if (!res.ok) return { ok: false, error: `Bunny status failed (${res.status})` };
    const v = (await res.json()) as { status: number };

    let status: "processing" | "ready" | "failed" = "processing";
    let thumb: string | undefined;
    if (v.status === 4) {
      status = "ready";
      thumb = `https://${cdn}/${item.video_id}/thumbnail.jpg`;
    } else if (v.status === 5) {
      status = "failed";
    }

    await svc
      .from("menu_items")
      .update({ video_status: status, video_thumb_url: thumb ?? null })
      .eq("id", itemId)
      .eq("tenant_id", tenantId);

    if (status !== "processing") revalidateTenant(t.slug);
    return { ok: true, data: { status, thumb } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function removeVideo(tenantId: string, itemId: string): Promise<Result> {
  try {
    const t = await assertTenantAccess(tenantId);
    const { lib, key } = bunnyEnv();
    const svc = createAdminClient();
    const { data: item } = await svc
      .from("menu_items")
      .select("video_id")
      .eq("id", itemId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (item?.video_id) {
      await fetch(`${BUNNY_API}/library/${lib}/videos/${item.video_id}`, {
        method: "DELETE",
        headers: { AccessKey: key },
      });
    }
    await svc
      .from("menu_items")
      .update({
        video_provider: null,
        video_id: null,
        video_status: "none",
        video_thumb_url: null,
      })
      .eq("id", itemId)
      .eq("tenant_id", tenantId);
    revalidateTenant(t.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
