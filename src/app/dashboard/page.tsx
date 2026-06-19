import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // RLS limits this to the tenants the user is a member of.
  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("role, tenants(slug, name, status, published_at)")
    .returns<
      { role: string; tenants: { slug: string; name: string; status: string; published_at: string | null } | null }[]
    >();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
        <SignOutButton />
      </div>
      <p className="mt-1 text-sm text-muted">{user.email}</p>

      {memberships?.some((m) => m.tenants?.status === "past_due") && (
        <div className="mt-4 rounded-card border border-accent/40 bg-accent/10 p-4 text-sm text-ink">
          Your payment didn’t go through. Update it to keep your page online.{" "}
          <Link href="/dashboard/billing" className="font-medium text-accent-deep underline">
            View billing
          </Link>
        </div>
      )}

      <div className="mt-4">
        <Link href="/dashboard/billing" className="text-sm font-medium text-accent">
          Billing &amp; invoices →
        </Link>
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Your menus</h2>
      {!memberships || memberships.length === 0 ? (
        <p className="mt-3 rounded-card border border-line p-4 text-muted">
          We’re building your menu from your shoot. It goes live shortly.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {memberships.map((m) =>
            m.tenants ? (
              <li
                key={m.tenants.slug}
                className="flex items-center justify-between rounded-card border border-line p-4"
              >
                <div>
                  <p className="font-medium text-ink">{m.tenants.name}</p>
                  <p className="text-sm text-muted">
                    /{m.tenants.slug} · {m.tenants.status}
                    {m.tenants.published_at ? " · live" : " · not live"}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-wide text-muted">{m.role}</span>
              </li>
            ) : null
          )}
        </ul>
      )}
      <p className="mt-8 text-xs text-muted">
        Full editor, analytics, hardware, and billing arrive in later milestones.
      </p>
    </main>
  );
}
