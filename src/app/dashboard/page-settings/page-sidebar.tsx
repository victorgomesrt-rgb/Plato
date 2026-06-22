"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check, ExternalLink, Lock } from "lucide-react";

export function LiveCard({ slug, live, siteUrl }: { slug: string; live: boolean; siteUrl: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-muted"}`} />{live ? "Live" : "Building"}
      </div>
      <p className="mt-3 text-xs text-muted">Your page address</p>
      <div className="mt-1 flex items-center gap-2 rounded-btn border border-line px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-sm text-ink">platodigital.io/{slug}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(`${siteUrl}/${slug}`); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="shrink-0 text-muted hover:text-ink" aria-label="Copy page address"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-btn bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/90">
        Open live page <ExternalLink className="h-4 w-4" />
      </a>
    </section>
  );
}

export function OwnerQrCard({ slug, name, accent, logoUrl, premium, siteUrl }: { slug: string; name: string; accent: string; logoUrl: string | null; premium: boolean; siteUrl: string }) {
  const [own, setOwn] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrRef = useRef<any>(null);
  const target = `${siteUrl}/${slug}`;
  const centerImage = own && premium && logoUrl ? logoUrl : "/brand/plato-mark.png";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCodeStyling = (await import("qr-code-styling")).default;
      if (cancelled || !boxRef.current) return;
      const options = {
        width: 200, height: 200, type: "svg" as const, data: target, image: centerImage,
        dotsOptions: { color: accent, type: "rounded" as const },
        cornersSquareOptions: { color: accent, type: "extra-rounded" as const },
        cornersDotOptions: { color: accent },
        backgroundOptions: { color: "#ffffff" },
        imageOptions: { crossOrigin: "anonymous" as const, margin: 6, imageSize: 0.3 },
      };
      if (!qrRef.current) { qrRef.current = new QRCodeStyling(options); boxRef.current.innerHTML = ""; qrRef.current.append(boxRef.current); }
      else qrRef.current.update(options);
    })();
    return () => { cancelled = true; };
  }, [target, centerImage, accent]);

  const dl = (ext: "png" | "svg") => qrRef.current?.download({ name: `plato-qr-${slug}`, extension: ext });

  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="font-display text-base font-semibold text-ink">Your QR code</h2>
      <div className="mt-4 grid place-items-center rounded-card border border-line bg-white p-4">
        <div ref={boxRef} />
        <p className="mt-2 text-sm font-medium text-ink">Scan for our menu</p>
      </div>
      <div className="mt-4">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          Center logo
          {!premium && <span className="inline-flex items-center gap-1 rounded-full bg-line px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted"><Lock className="h-3 w-3" />Premium</span>}
        </div>
        <div className="mt-2 flex rounded-btn border border-line p-1">
          <button onClick={() => setOwn(false)} className={`flex-1 rounded-[8px] px-3 py-1.5 text-sm font-medium ${!own ? "bg-accent text-white" : "text-ink"}`}>Plato</button>
          <button onClick={() => { if (premium && logoUrl) setOwn(true); }} disabled={!premium || !logoUrl} className={`flex-1 truncate rounded-[8px] px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${own ? "bg-accent text-white" : "text-ink"}`}>{name} logo</button>
        </div>
        <p className="mt-2 text-xs text-muted">Default Plato mark. On Premium, you can use your own logo.</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => dl("png")} className="rounded-btn border border-line px-3 py-2 text-sm font-medium text-ink hover:border-ink/20">PNG</button>
        <button onClick={() => dl("svg")} className="rounded-btn border border-line px-3 py-2 text-sm font-medium text-ink hover:border-ink/20">SVG</button>
      </div>
      <p className="mt-3 text-xs text-muted">Need more table tents or a window decal? Ask your team.</p>
    </section>
  );
}
