"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Gauge, Check, ChevronRight } from "lucide-react";

// "Preview your menu" has no server signal (we can't see an owner viewing their own
// page), so we remember it client-side once they open the preview.
const previewKey = (id: string) => `plato_previewed_${id}`;
function markPreviewed(id: string) {
  try { localStorage.setItem(previewKey(id), "1"); } catch {}
  window.dispatchEvent(new Event("plato-previewed"));
}
function usePreviewed(id: string) {
  return useSyncExternalStore(
    (cb) => { window.addEventListener("plato-previewed", cb); return () => window.removeEventListener("plato-previewed", cb); },
    () => { try { return localStorage.getItem(previewKey(id)) === "1"; } catch { return false; } },
    () => false,
  );
}

type Step = { label: string; done: boolean; href?: string; external?: boolean; onClick?: () => void; pending?: boolean };

export function OwnerOnboarding({ tenantId, slug, live, branded, contact, firstView }: {
  tenantId: string; slug: string; live: boolean; branded: boolean; contact: boolean; firstView: boolean;
}) {
  const previewed = usePreviewed(tenantId);
  const menuUrl = `/${slug}`;

  const steps: Step[] = [
    { label: "Your menu is live", done: live, pending: !live }, // we publish it; not owner-actionable
    { label: "Add your logo and cover photo", done: branded, href: "/dashboard/page-settings" },
    { label: "Add your phone, WhatsApp and hours", done: contact, href: "/dashboard/page-settings" },
    { label: "Preview your live menu", done: previewed, href: menuUrl, external: true, onClick: () => markPreviewed(tenantId) },
    { label: "Get your first menu view", done: firstView, href: menuUrl, external: true },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null; // all done → auto-hide

  return (
    <div className="rounded-card bg-gradient-to-br from-accent to-accent-deep p-5 text-white shadow-[0_18px_44px_-26px_rgba(251,106,26,0.8)]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15"><Gauge className="h-5 w-5" /></span>
        <div>
          <h2 className="font-display text-lg font-bold leading-tight">{doneCount >= steps.length - 1 ? "Almost there!" : "Let’s get your menu ready"}</h2>
          <p className="text-xs text-white/75">{doneCount} of {steps.length} done</p>
        </div>
      </div>

      <ol className="mt-4 divide-y divide-white/10">
        {steps.map((s, i) => {
          const num = (
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${s.done ? "bg-white/25" : "bg-white/15"}`}>
              {s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
          );
          if (s.done)
            return (
              <li key={i} className="flex items-center gap-3 py-2.5 text-white/55">
                {num}<span className="text-sm">{s.label}</span>
              </li>
            );
          if (s.pending)
            return (
              <li key={i} className="flex items-center gap-3 py-2.5">
                {num}<span className="text-sm font-medium">{s.label}</span>
                <span className="ml-auto text-xs text-white/65">We’re on it</span>
              </li>
            );
          const inner = (<>{num}<span className="text-sm font-medium">{s.label}</span><ChevronRight className="ml-auto h-4 w-4 text-white/70" /></>);
          const cls = "flex items-center gap-3 py-2.5 transition hover:text-white";
          return s.external ? (
            <li key={i}><a href={s.href} target="_blank" rel="noopener noreferrer" onClick={s.onClick} className={cls}>{inner}</a></li>
          ) : (
            <li key={i}><Link href={s.href!} className={cls}>{inner}</Link></li>
          );
        })}
      </ol>
    </div>
  );
}
