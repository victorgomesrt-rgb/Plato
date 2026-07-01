"use client";

import { useEffect, useRef } from "react";

// QR for a Review Card code. Reuses qr-code-styling (like OwnerQrCard) with the brand
// accent + the client's logo centered; downloads PNG / SVG (native) + a print-ready A6 PDF.
export function ReviewQr({ url, name, logoUrl, accent = "#FB6A1A" }: { url: string; name: string; logoUrl: string | null; accent?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrRef = useRef<any>(null);
  const centerImage = logoUrl || "/brand/plato-mark.png";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCodeStyling = (await import("qr-code-styling")).default;
      if (cancelled || !boxRef.current) return;
      const options = {
        width: 220, height: 220, type: "svg" as const, data: url, image: centerImage,
        dotsOptions: { color: "#16110E", type: "rounded" as const },
        cornersSquareOptions: { color: accent, type: "extra-rounded" as const },
        cornersDotOptions: { color: accent },
        backgroundOptions: { color: "#ffffff" },
        imageOptions: { crossOrigin: "anonymous" as const, margin: 6, imageSize: 0.28 },
      };
      if (!qrRef.current) { qrRef.current = new QRCodeStyling(options); boxRef.current.innerHTML = ""; qrRef.current.append(boxRef.current); }
      else qrRef.current.update(options);
    })();
    return () => { cancelled = true; };
  }, [url, centerImage, accent]);

  const dl = (ext: "png" | "svg") => qrRef.current?.download({ name: "review-qr", extension: ext });

  async function dlPdf() {
    if (!qrRef.current) return;
    const blob: Blob = await qrRef.current.getRawData("png");
    const dataUrl = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(blob); });
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a6" }); // 105 x 148 mm card
    doc.addImage(dataUrl, "PNG", 22.5, 26, 60, 60);
    doc.setTextColor(22, 17, 14);
    doc.setFontSize(17);
    doc.text(name, 52.5, 100, { align: "center", maxWidth: 90 });
    doc.setFontSize(12);
    doc.setTextColor(107, 102, 96);
    doc.text("Scan to leave us a Google review", 52.5, 110, { align: "center", maxWidth: 85 });
    doc.setFillColor(251, 106, 26);
    doc.rect(0, 143, 105, 5, "F");
    doc.save("review-card.pdf");
  }

  const btn = "rounded-btn border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-accent hover:text-accent-deep";

  return (
    <div className="mt-3 space-y-3 border-t border-line pt-3">
      <p className="text-sm font-medium text-ink">Review QR</p>
      <div className="grid place-items-center rounded-card border border-line bg-white p-4">
        <div ref={boxRef} />
        <p className="mt-2 text-xs font-medium text-ink">Scan to leave a Google review</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => dl("png")} className={btn}>PNG</button>
        <button onClick={() => dl("svg")} className={btn}>SVG</button>
        <button onClick={dlPdf} className={btn}>Print PDF</button>
      </div>
    </div>
  );
}
