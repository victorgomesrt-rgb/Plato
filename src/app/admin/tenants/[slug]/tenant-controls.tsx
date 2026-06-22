"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";
import { setTenantStatus, changeTenantPlan } from "../../actions";

const PLANS = ["starter", "growth", "premium"];
const STATUSES = ["building", "trialing", "active", "past_due", "suspended", "canceled"];
type Res = { ok: boolean; error?: string };

export function TenantControls({ tenantId, slug, plan, status }: { tenantId: string; slug: string; plan: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (p: Promise<Res>) =>
    start(async () => {
      const r = await p;
      if (r.ok) { toast("Updated"); router.refresh(); }
      else toast(r.error ?? "Could not update");
    });

  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 rounded-card border border-line bg-surface p-3 text-sm">
      <label className="flex items-center gap-2 text-muted">
        Plan
        <select value={plan} disabled={pending} onChange={(e) => run(changeTenantPlan(tenantId, e.target.value))}
          className="rounded-btn border border-line bg-surface px-2 py-1 capitalize text-ink outline-none focus:border-accent">
          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 text-muted">
        Status
        <select value={status} disabled={pending} onChange={(e) => run(setTenantStatus(tenantId, slug, e.target.value))}
          className="rounded-btn border border-line bg-surface px-2 py-1 text-ink outline-none focus:border-accent">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
    </div>
  );
}
