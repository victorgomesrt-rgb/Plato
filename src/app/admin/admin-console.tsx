"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Ban, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { toast } from "@/components/toast";
import { planPrice } from "@/lib/plans";
import { setTenantStatus } from "./actions";

export type TenantRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  created_at: string;
  updated_at: string;
  review_only: boolean | null;
};

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const monthYear = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "America/Aruba" }).format(new Date(d));
function relTime(ts: string, now: number) {
  const m = Math.floor((now - new Date(ts).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  if (m < 10080) return `${Math.floor(m / 1440)}d ago`;
  return `${Math.floor(m / 10080)}w ago`;
}

const PLAN_STYLE: Record<string, string> = {
  starter: "bg-line text-muted",
  growth: "bg-sea/10 text-sea",
  premium: "bg-accent/10 text-accent-deep",
};
const STATUS_STYLE: Record<string, string> = {
  active: "bg-sea/10 text-sea",
  building: "bg-line text-muted",
  past_due: "bg-citrus/30 text-ink",
  suspended: "bg-accent/10 text-accent-deep",
  canceled: "bg-line text-muted line-through",
  trialing: "bg-citrus/20 text-ink",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Active", building: "Building", past_due: "Past due", suspended: "Suspended", canceled: "Canceled", trialing: "Trial",
};

const FILTERS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "active", label: "Active", match: (s) => s === "active" },
  { key: "trialing", label: "Trial", match: (s) => s === "trialing" },
  { key: "past_due", label: "Past due", match: (s) => s === "past_due" },
  { key: "suspended", label: "Suspended", match: (s) => s === "suspended" },
];

export function AdminConsole({ tenants }: { tenants: TenantRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const toggle = (t: TenantRow) =>
    startTransition(async () => {
      const next = t.status === "active" ? "suspended" : "active";
      const r = await setTenantStatus(t.id, t.slug, next);
      if (r.ok) { toast(next === "active" ? "Activated" : "Suspended"); router.refresh(); }
      else toast(r.error ?? "Could not update");
    });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const f = FILTERS.find((x) => x.key === filter) ?? FILTERS[0];
    return tenants.filter((t) => f.match(t.status) && (!needle || t.name.toLowerCase().includes(needle) || t.slug.includes(needle)));
  }, [tenants, q, filter]);

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name…"
          className="h-9 min-w-[180px] flex-1 rounded-btn border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${filter === f.key ? "bg-accent text-white" : "border border-line bg-surface text-ink hover:border-ink/30"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted">{rows.length} of {tenants.length} shown</span>
      </div>

      <div className="mt-3 overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-medium">Restaurant</th>
              <th className="px-3 py-2.5 font-medium">Plan</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">MRR</th>
              <th className="px-3 py-2.5 font-medium">Created</th>
              <th className="px-3 py-2.5 font-medium">Last edit</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-line/60 last:border-0 hover:bg-line/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-line text-xs font-bold text-ink">{t.name.charAt(0).toUpperCase()}</span>
                    <Link href={`/admin/tenants/${t.slug}`} className="min-w-0">
                      <p className="truncate font-medium text-ink">{t.name}</p>
                      <p className="truncate text-xs text-muted">/{t.slug}</p>
                    </Link>
                  </div>
                </td>
                <td className="px-3 py-3">{t.review_only
                  ? <span className="rounded-full bg-citrus/25 px-2 py-0.5 text-xs font-medium text-ink">Review card</span>
                  : <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PLAN_STYLE[t.plan] ?? "bg-line text-muted"}`}>{t.plan}</span>}</td>
                <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[t.status] ?? "bg-line text-muted"}`}>{STATUS_LABEL[t.status] ?? t.status}</span></td>
                <td className="px-3 py-3 font-medium text-ink">{t.review_only ? "—" : t.status === "active" ? usd(planPrice(t.plan)) : "—"}</td>
                <td className="px-3 py-3 text-muted">{monthYear(t.created_at)}</td>
                <td className="px-3 py-3 text-muted">{relTime(t.updated_at, now)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <a href={`/${t.slug}`} target="_blank" rel="noopener noreferrer" title={t.review_only ? "View review page" : "View live menu"} aria-label={t.review_only ? "View review page" : "View live menu"} className="grid h-8 w-8 place-items-center rounded-btn text-muted hover:bg-line hover:text-ink"><Eye className="h-4 w-4" /></a>
                    <Link href={`/admin/tenants/${t.slug}`} title="Manage" aria-label="Manage" className="grid h-8 w-8 place-items-center rounded-btn text-muted hover:bg-line hover:text-ink"><SlidersHorizontal className="h-4 w-4" /></Link>
                    {!t.review_only && (
                      <button disabled={pending} onClick={() => toggle(t)} title={t.status === "active" ? "Suspend" : "Activate"} aria-label={t.status === "active" ? "Suspend" : "Activate"}
                        className="grid h-8 w-8 place-items-center rounded-btn text-muted hover:bg-line hover:text-accent-deep disabled:opacity-50">
                        {t.status === "active" ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">No tenants match. Try another name or filter.</p>}
      </div>
    </div>
  );
}
