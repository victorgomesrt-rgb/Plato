import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getTenantBySlug, publicState } from "@/lib/tenant";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Plato menu";

// Covers and logos are stored as webp, which next/og's rasterizer (resvg) can't decode.
// The route runs on the nodejs runtime, so we transcode with sharp to a JPEG/PNG data URI
// that resvg CAN embed. Any failure returns null so the card falls back to the gradient.
async function toDataUri(
  url: string | null,
  opts: { w: number; h: number; fit: "cover" | "inside"; format: "jpeg" | "png" }
): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    const pipeline = sharp(input).resize({ width: opts.w, height: opts.h, fit: opts.fit });
    const buf =
      opts.format === "png"
        ? await pipeline.png().toBuffer()
        : await pipeline.jpeg({ quality: 82 }).toBuffer();
    return `data:image/${opts.format};base64,${buf.toString("base64")}`;
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

  const [cover, logo] = ok
    ? await Promise.all([
        toDataUri(tenant!.cover_url, { w: 1200, h: 630, fit: "cover", format: "jpeg" }),
        toDataUri(tenant!.logo_url, { w: 200, h: 200, fit: "inside", format: "png" }),
      ])
    : [null, null];

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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} width={76} height={76} style={{ width: 76, height: 76, objectFit: "contain" }} />
              </div>
            )}
          </div>

          {/* Bottom: URL, name, Plato attribution */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 32, opacity: 0.9, marginBottom: 12 }}>
              platodigital.io/{ok ? tenant!.slug : ""}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 88,
                fontWeight: 700,
                lineHeight: 1.05,
                marginBottom: 20,
                textShadow: cover ? "0 2px 18px rgba(0,0,0,0.45)" : "none",
              }}
            >
              {name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, opacity: 0.92 }}>
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
              <div style={{ display: "flex" }}>Video menu · Plato</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
