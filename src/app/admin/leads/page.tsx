import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail } from "lucide-react";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin · Leads", robots: { index: false } };

type Lead = { id: string; email: string; source: string | null; created_at: string };
const fmt = (d: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Aruba" }).format(new Date(d));

export default async function AdminLeadsPage() {
  if (!(await currentAdmin())) notFound();
  const { data } = await createAdminClient()
    .from("leads").select("id, email, source, created_at").order("created_at", { ascending: false }).limit(500).returns<Lead[]>();
  const leads = data ?? [];

  return (
    <main className="mx-auto max-w-3xl px-5 py-6 lg:px-8 lg:py-8">
      <h1 className="font-display text-2xl font-bold text-ink">Leads</h1>
      <p className="text-sm text-muted">{leads.length} email{leads.length === 1 ? "" : "s"} captured from the landing page.</p>

      {leads.length === 0 ? (
        <div className="mt-6 rounded-card border border-line bg-surface p-8 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-line text-muted"><Mail className="h-5 w-5" /></span>
          <p className="mt-3 font-medium text-ink">No leads yet</p>
          <p className="mt-1 text-sm text-muted">Emails left on the landing page show up here.</p>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-line rounded-card border border-line bg-surface">
          {leads.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <a href={`mailto:${l.email}`} className="truncate text-sm font-medium text-ink hover:text-accent">{l.email}</a>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted">
                <span className="rounded-full bg-line px-2 py-0.5">{l.source ?? "landing"}</span>
                <span>{fmt(l.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
