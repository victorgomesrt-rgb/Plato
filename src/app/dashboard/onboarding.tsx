"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Gauge, Check, ChevronRight, Minus } from "lucide-react";

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

// Minimized state, persisted so it stays collapsed as the owner moves around.
const minKey = (id: string) => `plato_onboard_min_${id}`;
function setMinimized(id: string, v: boolean) {
  try { localStorage.setItem(minKey(id), v ? "1" : "0"); } catch {}
  window.dispatchEvent(new Event("plato-onboard-min"));
}
function useMinimized(id: string) {
  return useSyncExternalStore(
    (cb) => { window.addEventListener("plato-onboard-min", cb); return () => window.removeEventListener("plato-onboard-min", cb); },
    () => { try { return localStorage.getItem(minKey(id)) === "1"; } catch { return false; } },
    () => false,
  );
}

type Step = { label: string; done: boolean; href?: string; external?: boolean; onClick?: () => void; pending?: boolean };

export function OwnerOnboarding({ tenantId, slug, live, branded, contact, firstView }: {
  tenantId: string; slug: string; live: boolean; branded: boolean; contact: boolean; firstView: boolean;
}) {
  const previewed = usePreviewed(tenantId);
  const minimized = useMinimized(tenantId);
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

  // Collapsed: a small pill in the corner.
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(tenantId, false)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-accent to-accent-deep px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_-16px_rgba(251,106,26,0.95)]"
      >
        <Gauge className="h-4 w-4" />Setup {doneCount}/{steps.length}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[330px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-card bg-gradient-to-br from-accent to-accent-deep text-white shadow-[0_18px_44px_-20px_rgba(251,106,26,0.9)]">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15"><Gauge className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-sm font-bold leading-tight">{doneCount >= steps.length - 1 ? "Almost there!" : "Let’s get your menu ready"}</h2>
          <p className="text-[11px] text-white/75">{doneCount} of {steps.length} done</p>
        </div>
        <button onClick={() => setMinimized(tenantId, true)} aria-label="Minimize" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/80 hover:bg-white/15 hover:text-white">
          <Minus className="h-4 w-4" />
        </button>
      </div>

      <ol className="px-2 pb-2">
        {steps.map((s, i) => {
          const num = (
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${s.done ? "bg-white/25" : "bg-white/15"}`}>
              {s.done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
          );
          if (s.done)
            return (
              <li key={i} className="flex items-center gap-2.5 rounded-btn px-2 py-1.5 text-white/55">
                {num}<span className="text-[13px]">{s.label}</span>
              </li>
            );
          if (s.pending)
            return (
              <li key={i} className="flex items-center gap-2.5 rounded-btn px-2 py-1.5">
                {num}<span className="text-[13px] font-medium">{s.label}</span>
                <span className="ml-auto text-[11px] text-white/65">We’re on it</span>
              </li>
            );
          const inner = (<>{num}<span className="text-[13px] font-medium">{s.label}</span><ChevronRight className="ml-auto h-4 w-4 text-white/70" /></>);
          const cls = "flex items-center gap-2.5 rounded-btn px-2 py-1.5 transition hover:bg-white/10";
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
