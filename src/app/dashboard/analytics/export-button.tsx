"use client";

import { Download } from "lucide-react";

type Row = { day: string; views: number; plays: number; qr: number; nfc: number; directions: number; calls: number };

// Downloads the visible range as a CSV, client-side (no server round-trip).
export function ExportButton({ rows, filename }: { rows: Row[]; filename: string }) {
  function download() {
    const header = ["Date", "Menu views", "Video plays", "QR scans", "NFC taps", "Directions", "Calls"];
    const lines = [header.join(",")].concat(
      rows.map((r) => [r.day, r.views, r.plays, r.qr, r.nfc, r.directions, r.calls].join(",")),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button onClick={download} className="inline-flex items-center gap-2 rounded-btn border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:border-ink/20">
      <Download className="h-4 w-4" />Export
    </button>
  );
}
