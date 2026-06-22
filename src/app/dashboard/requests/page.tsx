import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveDashboard } from "@/lib/dashboard-context";
import { RequestForm } from "./request-form";

export const metadata: Metadata = { title: "Request a change", robots: { index: false } };

const KIND_LABEL: Record<string, string> = { menu: "Menu item", price: "Price", video: "Video/photo", hours: "Hours", general: "General", photo: "Photo" };
const STATUS_LABEL: Record<string, string> = { open: "Open", in_progress: "In progress", done: "Done" };
const STATUS_STYLE: Record<string, string> = { open: "bg-citrus/20 text-ink", in_progress: "bg-sea/10 text-sea", done: "bg-line text-muted" };

const fmt = (d: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Aruba" }).format(new Date(d));

type Req = { id: string; kind: string; message: string; status: string; created_at: string };

export default async function RequestsPage() {
  const res = await resolveDashboard();
  if (res.state === "redirect") redirect("/login");
  const impersonating = res.state === "ok" && res.ctx.impersonating;
  const reqs = res.state === "ok"
    ? (await res.ctx.db.from("change_requests").select("id, kind, message, status, created_at").eq("tenant_id", res.ctx.tenantId).order("created_at", { ascending: false }).returns<Req[]>()).data ?? []
    : [];

  return (
    <main className="mx-auto max-w-3xl px-5 py-6 lg:px-8 lg:py-8">
      <h1 className="font-display text-2xl font-bold text-ink">Request a change</h1>
      <p className="mt-1 text-sm text-muted">Tell us what to update and our team handles it, usually same day.</p>

      <div className="mt-5"><RequestForm readOnly={impersonating} /></div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Your requests</h2>
      {reqs.length === 0 ? (
        <p className="mt-3 rounded-card border border-line bg-surface p-5 text-sm text-muted">No requests yet. Send your first one above.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {reqs.map((r) => (
            <li key={r.id} className="rounded-card border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">{KIND_LABEL[r.kind] ?? r.kind}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[r.status] ?? "bg-line text-muted"}`}>{STATUS_LABEL[r.status] ?? r.status}</span>
              </div>
              <p className="mt-1.5 text-sm text-ink">{r.message}</p>
              <p className="mt-1 text-xs text-muted">{fmt(r.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
