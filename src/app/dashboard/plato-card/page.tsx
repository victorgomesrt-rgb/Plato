import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Send, Check, Clock } from "lucide-react";
import { resolveDashboard } from "@/lib/dashboard-context";
import { DashboardHeader } from "../dashboard-header";
import { WalletPerk, PromoRequest } from "./plato-card-form";

export const metadata: Metadata = { title: "Plato Card", robots: { index: false } };

const fmt = (d: string | null) => (d ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Aruba" }).format(new Date(d)) : "—");
const STATUS_LABEL: Record<string, string> = { requested: "In review", scheduled: "Scheduled", sent: "Sent", declined: "Declined" };
const STATUS_STYLE: Record<string, string> = { requested: "bg-citrus/25 text-ink", scheduled: "bg-sea/10 text-sea", sent: "bg-emerald-100 text-emerald-700", declined: "bg-line text-muted" };

type Tn = { slug: string; wallet_partner: boolean | null; wallet_discount: string | null };
type Blast = { id: string; message: string; status: string; scheduled_at: string | null; sent_at: string | null; created_at: string };

export default async function OwnerPlatoCardPage() {
  const res = await resolveDashboard();
  if (res.state === "redirect") redirect("/login");
  if (res.state === "no_tenant") {
    return (
      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-ink">Plato Card</h1>
        <p className="mt-4 rounded-card border border-line bg-surface p-6 text-muted">Your page goes live first, then you can join the Plato Card.</p>
      </main>
    );
  }
  const { db, tenantId, impersonating } = res.ctx;
  const [{ data: t }, { data: blasts }] = await Promise.all([
    db.from("tenants").select("slug, wallet_partner, wallet_discount").eq("id", tenantId).maybeSingle(),
    db.from("wallet_blasts").select("id, message, status, scheduled_at, sent_at, created_at").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(10).returns<Blast[]>(),
  ]);
  const tn = (t as Tn | null) ?? { slug: "", wallet_partner: false, wallet_discount: null };
  const list = blasts ?? [];

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-8">
      <DashboardHeader title="Plato Card" subtitle="Your member perk and promotions to Plato Card holders" slug={tn.slug} />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <WalletPerk discount={tn.wallet_discount ?? ""} listed={!!tn.wallet_partner} readOnly={impersonating} />
        <PromoRequest readOnly={impersonating} />
      </div>

      <section className="mt-4 rounded-card border border-line bg-surface p-5">
        <p className="font-display text-base font-semibold text-ink">Recent promotions</p>
        {list.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No promotions yet. Request your first blast above.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {list.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2.5">
                {b.status === "sent" ? <Check className="h-4 w-4 text-emerald-600" /> : b.status === "scheduled" ? <Clock className="h-4 w-4 text-sea" /> : <Send className="h-4 w-4 text-muted" />}
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{b.message}</span>
                <span className="shrink-0 text-xs text-muted">{fmt(b.sent_at ?? b.scheduled_at ?? b.created_at)}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[b.status] ?? "bg-line text-muted"}`}>{STATUS_LABEL[b.status] ?? b.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
