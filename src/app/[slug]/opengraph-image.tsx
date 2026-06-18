import { ImageResponse } from "next/og";
import { getTenantBySlug, publicState } from "@/lib/tenant";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Plato menu";

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

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: `linear-gradient(135deg, ${accent}, #16110E)`,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, opacity: 0.85 }}>
          platodigital.io/{ok ? tenant!.slug : ""}
        </div>
        <div style={{ display: "flex", fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>
          {name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, opacity: 0.9 }}>
          <div
            style={{
              display: "flex",
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "white",
              color: accent,
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
    ),
    { ...size }
  );
}
