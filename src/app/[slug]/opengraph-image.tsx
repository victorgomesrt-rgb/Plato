import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getTenantBySlug, publicState } from "@/lib/tenant";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Plato menu";

// Turn a stored cover/logo into a data URI that next/og's rasterizer (resvg) can embed.
// resvg decodes PNG/JPEG natively, so those pass straight through; webp is decoded with
// sharp via a *dynamic* import (a load failure is caught and falls back to the gradient,
// never a 500). Kept fully defensive so a bad image can never break the OG route.
async function embed(
  url: string | null,
  webpTo: "jpeg" | "png"
): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // TEMP PROBE: force every cover through sharp (even PNG) to prove whether sharp loads
    // in this metadata route on Vercel. If the live demo keeps its photo, sharp works here.
    const sharp = (await import("sharp")).default;
    const out =
      webpTo === "png"
        ? await sharp(buf).png().toBuffer()
        : await sharp(buf).jpeg({ quality: 82 }).toBuffer();
    return `data:image/${webpTo};base64,${out.toString("base64")}`;
  } catch {
    return null;
  }
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
    ok ? embed(tenant!.cover_url, "jpeg") : Promise.resolve(null),
    ok ? embed(tenant!.logo_url, "png") : Promise.resolve(null),
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
            <div style={{ display: "flex", fontSize: 88, fontWeight: 700, lineHeight: 1.05, marginBottom: 22 }}>
              {name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, opacity: 0.95 }}>
              {mark ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mark} width={40} height={40} style={{ width: 40, height: 40, objectFit: "contain" }} />
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
