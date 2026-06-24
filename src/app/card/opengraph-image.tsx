import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The Plato Card — member perks across Aruba";

export default function CardOpengraphImage() {
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
          background: "linear-gradient(135deg, #FB6A1A, #16110E)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32, opacity: 0.92 }}>
          <div style={{ display: "flex", width: 46, height: 46, borderRadius: 12, background: "white", color: "#FB6A1A", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700 }}>P</div>
          <div style={{ display: "flex" }}>Plato</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 86, fontWeight: 700, lineHeight: 1.05 }}>The Plato Card</div>
          <div style={{ display: "flex", fontSize: 36, opacity: 0.9, marginTop: 18 }}>Member perks at restaurants across Aruba, in your Apple Wallet.</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, opacity: 0.8 }}>platodigital.io/card</div>
      </div>
    ),
    size,
  );
}
