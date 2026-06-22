"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Video, LayoutGrid, List, LayoutTemplate, Check } from "lucide-react";
import { toast } from "@/components/toast";
import { setTemplate } from "./actions";

const OPTIONS = [
  { v: "reel", label: "Reel", desc: "Full-screen video", icon: Video },
  { v: "grid", label: "Grid", desc: "Two-column cards", icon: LayoutGrid },
  { v: "classic", label: "Classic", desc: "Elegant list", icon: List },
  { v: "spotlight", label: "Spotlight", desc: "Magazine hero", icon: LayoutTemplate },
];

export function TemplatePicker({ tenantId, current, readOnly }: { tenantId: string; current: string; readOnly: boolean }) {
  const router = useRouter();
  const [sel, setSel] = useState(current);
  const [pending, start] = useTransition();

  function pick(v: string) {
    if (readOnly || v === sel) return;
    const prev = sel;
    setSel(v);
    start(async () => {
      const r = await setTemplate(tenantId, v);
      if (r.ok) { toast("Template updated"); router.refresh(); } else { setSel(prev); }
    });
  }

  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="font-display text-base font-semibold text-ink">Menu template</h2>
      <p className="mt-1 text-sm text-muted">Same dishes, four looks. Switch anytime, no re-shoot needed.</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => {
          const active = o.v === sel;
          return (
            <button key={o.v} onClick={() => pick(o.v)} disabled={pending || readOnly}
              className={`flex items-center gap-3 rounded-card border p-3 text-left transition disabled:opacity-60 ${active ? "border-accent bg-accent/5" : "border-line hover:border-ink/20"}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${active ? "bg-accent/10 text-accent" : "bg-line text-muted"}`}><o.icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{o.label}</span>
                <span className="block text-xs text-muted">{o.desc}</span>
              </span>
              {active && <Check className="h-5 w-5 shrink-0 text-accent" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
