import { ImageResponse } from "next/og";

// Default OG image for the home page and any route without its own (tenant menus have
// their own at [slug]/opengraph-image). Drawn with shapes so there are no file reads.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Plato — video menus for Caribbean restaurants";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 30,
          padding: 96,
          background: "linear-gradient(135deg, #FB6A1A 0%, #16110E 75%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              width: 110,
              height: 110,
              borderRadius: 26,
              background: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="52" height="52" viewBox="0 0 12 12" fill="#FB6A1A">
              <path d="M3 2l6.5 4-6.5 4z" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 60, fontWeight: 800 }}>Plato</div>
        </div>
        <div style={{ display: "flex", fontSize: 74, fontWeight: 700, lineHeight: 1.05, maxWidth: 940 }}>
          Video menus for Caribbean restaurants
        </div>
        <div style={{ display: "flex", fontSize: 34, opacity: 0.9 }}>
          Scan, watch the food, decide.
        </div>
      </div>
    ),
    { ...size }
  );
}
