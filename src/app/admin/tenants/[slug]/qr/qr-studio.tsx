"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ensureStandardLinks } from "../qr-actions";

type Link = { id: string; code: string; kind: string; placement: string | null; scans: number };
type TenantBits = { id: string; slug: string; name: string; accent: string; logoUrl: string | null };

const PLACEMENT_LABEL: Record<string, string> = {
  table: "Table", window: "Window", host_stand: "Host stand",
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

export function QrStudio({
  tenant,
  links,
  siteUrl,
}: {
  tenant: TenantBits;
  links: Link[];
  siteUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [source, setSource] = useState<"link" | "custom">(links.length ? "link" : "custom");
  const [code, setCode] = useState(links[0]?.code ?? "");
  const [customUrl, setCustomUrl] = useState("");
  const [caption, setCaption] = useState("Scan for our menu");
  const [withLogo, setWithLogo] = useState(Boolean(tenant.logoUrl));

  const boxRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrRef = useRef<any>(null);

  const target = source === "custom" ? customUrl : code ? `${siteUrl}/q/${code}` : "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCodeStyling = (await import("qr-code-styling")).default;
      if (cancelled || !boxRef.current) return;
      const options = {
        width: 280,
        height: 280,
        type: "svg" as const,
        data: target || siteUrl,
        image: withLogo && tenant.logoUrl ? tenant.logoUrl : undefined,
        dotsOptions: { color: "#16110e", type: "rounded" as const },
        cornersSquareOptions: { color: tenant.accent, type: "extra-rounded" as const },
        cornersDotOptions: { color: tenant.accent },
        backgroundOptions: { color: "#ffffff" },
        imageOptions: { crossOrigin: "anonymous" as const, margin: 6, imageSize: 0.28 },
      };
      if (!qrRef.current) {
        qrRef.current = new QRCodeStyling(options);
        boxRef.current.innerHTML = "";
        qrRef.current.append(boxRef.current);
      } else {
        qrRef.current.update(options);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [target, withLogo, tenant.logoUrl, tenant.accent, siteUrl]);

  const baseName = `plato-qr-${source === "custom" ? "custom" : code}`;

  async function download(extension: "png" | "svg") {
    await qrRef.current?.download({ name: baseName, extension });
  }

  async function downloadPdf() {
    if (!qrRef.current) return;
    const blob: Blob = await qrRef.current.getRawData("png");
    const dataUrl = await blobToDataUrl(blob);
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: [100, 140] });
    const [r, g, b] = hexToRgb(tenant.accent);
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 100, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text(tenant.name, 50, 12, { align: "center" });
    doc.addImage(dataUrl, "PNG", 25, 30, 50, 50);
    doc.setTextColor(22, 17, 14);
    doc.setFontSize(13);
    doc.text(caption, 50, 95, { align: "center" });
    doc.setFontSize(9);
    doc.setTextColor(107, 102, 96);
    doc.text(`platodigital.io/${tenant.slug}`, 50, 104, { align: "center" });
    doc.save(`${baseName}-card.pdf`);
  }

  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-2">
      {/* Controls */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSource("link")}
            className={`rounded-btn px-3 py-1.5 text-sm font-medium ${source === "link" ? "bg-accent text-white" : "bg-line text-ink"}`}
          >
            Tracked link
          </button>
          <button
            onClick={() => setSource("custom")}
            className={`rounded-btn px-3 py-1.5 text-sm font-medium ${source === "custom" ? "bg-accent text-white" : "bg-line text-ink"}`}
          >
            Custom URL
          </button>
        </div>

        {source === "link" ? (
          links.length === 0 ? (
            <div className="rounded-card border border-line p-4 text-sm text-muted">
              No tracked links yet.
              <div className="mt-3">
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await ensureStandardLinks(tenant.id, tenant.slug);
                      router.refresh();
                    })
                  }
                >
                  {pending ? "Generating…" : "Generate table, window & host-stand codes"}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-ink">Placement</label>
              <select
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full rounded-btn border border-line bg-surface px-3 py-2.5 text-ink"
              >
                {links.map((l) => (
                  <option key={l.id} value={l.code}>
                    {PLACEMENT_LABEL[l.placement ?? ""] ?? l.placement ?? l.kind} · {l.scans} scans
                  </option>
                ))}
              </select>
              <p className="mt-1 break-all text-xs text-muted">{target}</p>
            </div>
          )
        ) : (
          <div>
            <label className="text-sm font-medium text-ink">URL</label>
            <input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-btn border border-line px-3 py-2.5 text-ink outline-none focus:border-accent"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-ink">Caption</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="mt-1 w-full rounded-btn border border-line px-3 py-2.5 text-ink outline-none focus:border-accent"
          />
        </div>

        {tenant.logoUrl && (
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={withLogo} onChange={(e) => setWithLogo(e.target.checked)} />
            Center logo
          </label>
        )}
      </div>

      {/* Preview + downloads */}
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-card border border-line p-4">
          <div ref={boxRef} />
          <p className="mt-2 text-center text-sm font-medium text-ink">{caption}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" variant="outline" onClick={() => download("png")}>
            PNG
          </Button>
          <Button size="sm" variant="outline" onClick={() => download("svg")}>
            SVG
          </Button>
          <Button size="sm" onClick={downloadPdf}>
            Print card (PDF)
          </Button>
        </div>
      </div>
    </div>
  );
}
