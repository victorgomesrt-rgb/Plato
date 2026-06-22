import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HelpCircle, DollarSign, ConciergeBell, Image as ImageIcon, Video, PenLine, Clock, MessageSquare } from "lucide-react";
import type { ComponentType } from "react";
import { resolveDashboard } from "@/lib/dashboard-context";
import { DashboardHeader } from "../dashboard-header";
import { RequestForm } from "./request-form";

export const metadata: Metadata = { title: "Requests", robots: { index: false } };

const fmt = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/Aruba" }).format(new Date(d));

// kind drives the type pill + icon tile.
type KindCfg = { label: string; icon: ComponentType<{ className?: string }>; tile: string; pill: string };
const KIND: Record<string, KindCfg> = {
  question: { label: "Question", icon: HelpCircle, tile: "bg-line text-muted", pill: "bg-line text-muted" },
  price: { label: "Price change", icon: DollarSign, tile: "bg-emerald-100 text-emerald-700", pill: "bg-emerald-100 text-emerald-700" },
  menu: { label: "New dish", icon: ConciergeBell, tile: "bg-accent/10 text-accent-deep", pill: "bg-accent/10 text-accent-deep" },
  photo: { label: "Photo", icon: ImageIcon, tile: "bg-sea/10 text-sea", pill: "bg-sea/10 text-sea" },
  video: { label: "Re-shoot", icon: Video, tile: "bg-accent/10 text-accent-deep", pill: "bg-accent/10 text-accent-deep" },
  copy: { label: "Copy / text", icon: PenLine, tile: "bg-citrus/25 text-ink", pill: "bg-citrus/25 text-ink" },
  hours: { label: "Hours", icon: Clock, tile: "bg-line text-muted", pill: "bg-line text-muted" },
  general: { label: "General", icon: MessageSquare, tile: "bg-line text-muted", pill: "bg-line text-muted" },
};
const kindCfg = (k: string) => KIND[k] ?? KIND.general;

// status → owner-facing label + pill + meta suffix.
const STATUS: Record<string, { label: string; pill: string; meta: string }> = {
  open: { label: "Needs you", pill: "bg-citrus/25 text-ink", meta: "waiting on you" },
  in_progress: { label: "In review", pill: "bg-sea/10 text-sea", meta: "with the Plato team" },
  done: { label: "Done", pill: "bg-emerald-100 text-emerald-700", meta: "published" },
};
const statusCfg = (s: string) => STATUS[s] ?? STATUS.open;

type Req = { id: string; kind: string; title: string | null; message: string; status: string; created_at: string };
const FILTERS = [{ v: "all", label: "All" }, { v: "open", label: "Open" }, { v: "done", label: "Done" }];

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const f = ["all", "open", "done"].includes(filter ?? "") ? filter! : "all";

  const res = await resolveDashboard();
  if (res.state === "redirect") redirect("/login");
  const impersonating = res.state === "ok" && res.ctx.impersonating;
  const slug = res.state === "ok" ? ((await res.ctx.db.from("tenants").select("slug").eq("id", res.ctx.tenantId).maybeSingle()).data as { slug: string } | null)?.slug ?? "" : "";
  const all = res.state === "ok"
    ? (await res.ctx.db.from("change_requests").select("id, kind, title, message, status, created_at").eq("tenant_id", res.ctx.tenantId).order("created_at", { ascending: false }).returns<Req[]>()).data ?? []
    : [];
  const reqs = all.filter((r) => f === "all" || (f === "done" ? r.status === "done" : r.status !== "done"));

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-8">
      <DashboardHeader title="Requests" subtitle="Your change requests to the Plato team" slug={slug} />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <div className="flex gap-2 text-sm">
            {FILTERS.map((x) => (
              <Link key={x.v} href={`/dashboard/requests${x.v === "all" ? "" : `?filter=${x.v}`}`} className={`rounded-full px-3 py-1 font-medium ${f === x.v ? "bg-accent text-white" : "border border-line bg-surface text-ink hover:border-ink/20"}`}>{x.label}</Link>
            ))}
          </div>

          {reqs.length === 0 ? (
            <p className="mt-4 rounded-card border border-line bg-surface p-6 text-sm text-muted">No requests here yet. Send your first one.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {reqs.map((r) => {
                const k = kindCfg(r.kind), s = statusCfg(r.status);
                return (
                  <li key={r.id} className="rounded-card border border-line bg-surface p-4">
                    <div className="flex items-start gap-3">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${k.tile}`}><k.icon className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink">{r.title || r.message}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${k.pill}`}>{k.label}</span>
                          <span className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.pill}`}>{s.label}</span>
                        </div>
                        {r.title && r.message && <p className="mt-1 text-sm text-muted">{r.message}</p>}
                        <p className="mt-1.5 text-xs text-muted">{fmt(r.created_at)} · {s.meta}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start"><RequestForm readOnly={impersonating} /></div>
      </div>
    </main>
  );
}
