"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { planPrice } from "@/lib/plans";
import { setTenantStatus, changeTenantPlan } from "./actions";

export type TenantRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type Overview = {
  mrr: number;
  active: number;
  pastDue: number;
  building: number;
  newThisMonth: number;
  churnThisMonth: number;
};

const STATUSES = ["building", "trialing", "active", "past_due", "suspended", "canceled"];
const PLANS = ["starter", "growth", "premium"];
const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Aruba" }).format(new Date(d));

const STATUS_STYLE: Record<string, string> = {
  active: "bg-sea/10 text-sea",
  building: "bg-line text-muted",
  past_due: "bg-citrus/20 text-ink",
  suspended: "bg-accent/10 text-accent-deep",
  canceled: "bg-line text-muted line-through",
  trialing: "bg-line text-ink",
};

export function AdminConsole({ overview, tenants }: { overview: Overview; tenants: TenantRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const run = (p: Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const r = await p;
      setErr(r.ok ? null : (r.error ?? "Something went wrong"));
      if (r.ok) router.refresh();
    });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tenants.filter(
      (t) =>
        (status === "all" || t.status === status) &&
        (!needle || t.name.toLowerCase().includes(needle) || t.slug.includes(needle))
    );
  }, [tenants, q, status]);

  const cards = [
    { label: "MRR", value: usd(overview.mrr) },
    { label: "Active", value: overview.active },
    { label: "Past due", value: overview.pastDue },
    { label: "Building", value: overview.building },
    { label: "New this month", value: overview.newThisMonth },
    { label: "Churn this month", value: overview.churnThisMonth },
  ];

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-card border border-line p-4">
            <p className="text-2xl font-semibold text-ink">{c.value}</p>
            <p className="text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      {err && <p className="mt-4 rounded-btn bg-accent/10 px-3 py-2 text-sm text-accent-deep">{err}</p>}

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or slug"
          className="flex-1 rounded-btn border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-btn border border-line bg-surface px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 space-y-2">
        {rows.map((t) => (
          <div key={t.id} className="rounded-card border border-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">
                  {t.name}{" "}
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[t.status] ?? "bg-line text-muted"}`}>
                    {t.status}
                  </span>
                </p>
                <p className="text-sm text-muted">
                  /{t.slug} · {usd(planPrice(t.plan))}/mo · created {fmtDate(t.created_at)} · edited {fmtDate(t.updated_at)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link href={`/admin/tenants/${t.slug}`} className="font-medium text-accent">Manage</Link>
                <Link href={`/admin/tenants/${t.slug}/qr`} className="text-muted hover:text-ink">QR</Link>
                <Link href={`/${t.slug}`} className="text-muted underline hover:text-ink">View</Link>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="text-xs text-muted">
                Plan{" "}
                <select
                  value={t.plan}
                  disabled={pending}
                  onChange={(e) => run(changeTenantPlan(t.id, e.target.value))}
                  className="rounded-btn border border-line bg-surface px-2 py-1 text-sm text-ink"
                >
                  {PLANS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted">
                Status{" "}
                <select
                  value={t.status}
                  disabled={pending}
                  onChange={(e) => run(setTenantStatus(t.id, t.slug, e.target.value))}
                  className="rounded-btn border border-line bg-surface px-2 py-1 text-sm text-ink"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              {t.status === "active" ? (
                <Button size="sm" variant="outline" disabled={pending} onClick={() => run(setTenantStatus(t.id, t.slug, "suspended"))}>
                  Suspend
                </Button>
              ) : (
                <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(setTenantStatus(t.id, t.slug, "active"))}>
                  Activate
                </Button>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted">No tenants match. Try another name or status.</p>}
      </div>
    </div>
  );
}
