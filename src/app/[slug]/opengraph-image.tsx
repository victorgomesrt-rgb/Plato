import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getTenantBySlug, publicState } from "@/lib/tenant";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Plato menu";

// next/og's rasterizer (resvg) embeds only PNG/JPEG — not webp — and sharp can't be loaded
// in this metadata route on Vercel (its native binary isn't traced into the function, same
// as the Route-Handler case). So the cover/logo are stored webp for the diner page AND an
// OG-safe JPEG/PNG copy (_cover_og.jpg / _logo_og.png) is written at upload time; here we
// just fetch a PNG/JPEG and inline it. Anything else (missing/webp/failure) → gradient.
async function embedUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").toLowerCase();
    const isPng = type.includes("png") || /\.png(\?|$)/i.test(url);
    const isJpeg = type.includes("jpeg") || type.includes("jpg") || /\.jpe?g(\?|$)/i.test(url);
    if (!isPng && !isJpeg) return null; // resvg can't embed webp/other
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${isPng ? "image/png" : "image/jpeg"};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

// Point a stored webp URL (.../<id>/_cover.webp?v=..) at its OG-safe sibling, preserving the
// cache-busting query so a re-uploaded image isn't served stale.
function ogVariant(url: string, name: string): string {
  return url.replace(/\/_(?:cover|logo)\.[a-z0-9]+(\?[^/]*)?$/i, `/${name}$1`);
}

async function resolveImage(url: string | null, ogName: string): Promise<string | null> {
  if (!url) return null;
  if (/\.webp(\?|$)/i.test(url)) return embedUrl(ogVariant(url, ogName));
  return embedUrl(url); // already png/jpeg (e.g. the seeded demo cover)
}

// The Plato mark (white), read from the bundled asset, as a data URI for the attribution.
async function platoMark(): Promise<string | null> {
  try {
    const buf = await readFile(join(process.cwd(), "public/brand/plato-mark-white.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  const ok = tenant && publicState(tenant) === "ok";
  const name = ok ? tenant!.name : "Plato";
  const accent = (ok && tenant!.accent_color) || "#FB6A1A";

  const [cover, logo, mark] = await Promise.all([
    ok ? resolveImage(tenant!.cover_url, "_cover_og.jpg") : Promise.resolve(null),
    ok ? resolveImage(tenant!.logo_url, "_logo_og.png") : Promise.resolve(null),
    platoMark(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          background: cover ? "#16110E" : `linear-gradient(135deg, ${accent}, #16110E)`,
          fontFamily: "sans-serif",
        }}
      >
        {/* Full-bleed food photo */}
        {cover && (
          <img
            src={cover}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }}
          />
        )}
        {/* Legibility scrim, only over a photo */}
        {cover && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              display: "flex",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.12) 100%)",
            }}
          />
        )}

        {/* Content */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 80,
            color: "white",
          }}
        >
          {/* Top: the restaurant's own logo, if any */}
          <div style={{ display: "flex" }}>
            {logo && (
              <div
                style={{
                  display: "flex",
                  width: 96,
                  height: 96,
                  borderRadius: 20,
                  background: "white",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 10,
                }}
              >
                <img src={logo} alt="" width={76} height={76} style={{ width: 76, height: 76, objectFit: "contain" }} />
              </div>
            )}
          </div>

          {/* Bottom: URL, name, Plato attribution */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 32, opacity: 0.9, marginBottom: 12 }}>
              platodigital.io/{ok ? tenant!.slug : ""}
            </div>
            <div style={{ display: "flex", fontSize: 88, fontWeight: 700, lineHeight: 1.05, marginBottom: 22 }}>
              {name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, opacity: 0.95 }}>
              {mark ? (
                <img src={mark} alt="" width={40} height={40} style={{ width: 40, height: 40, objectFit: "contain" }} />
              ) : (
                <div
                  style={{
                    display: "flex",
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: cover ? accent : "white",
                    color: cover ? "white" : accent,
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                  }}
                >
                  P
                </div>
              )}
              <div style={{ display: "flex" }}>Video menu · Plato</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
