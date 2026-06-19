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
    .select("role, tenants(slug, name, status, published_at, trial_ends_at)")
    .returns<
      {
        role: string;
        tenants: {
          slug: string;
          name: string;
          status: string;
          published_at: string | null;
          trial_ends_at: string | null;
        } | null;
      }[]
    >();

  // Trial ending within 3 days? (design.md §7). Server render time — pure here.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const trialDaysLeft = (() => {
    const ends = memberships
      ?.map((m) => m.tenants?.trial_ends_at)
      .filter((d): d is string => !!d)
      .map((d) => Math.ceil((new Date(d).getTime() - nowMs) / 86_400_000))
      .filter((n) => n >= 0 && n <= 3);
    return ends && ends.length ? Math.min(...ends) : null;
  })();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
        <SignOutButton />
      </div>
      <p className="mt-1 text-sm text-muted">{user.email}</p>

      {trialDaysLeft != null && (
        <div className="mt-4 rounded-card border border-citrus/50 bg-citrus/10 p-4 text-sm text-ink">
          {trialDaysLeft === 0
            ? "Your trial ends today."
            : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your trial.`}{" "}
          Keep your menu live —{" "}
          <Link href="/dashboard/billing" className="font-medium text-accent-deep underline">
            choose a plan
          </Link>
          .
        </div>
      )}

      {memberships?.some((m) => m.tenants?.status === "past_due") && (
        <div className="mt-4 rounded-card border border-accent/40 bg-accent/10 p-4 text-sm text-ink">
          Your payment didn’t go through. Update it to keep your page online.{" "}
          <Link href="/dashboard/billing" className="font-medium text-accent-deep underline">
            View billing
          </Link>
        </div>
      )}

      <div className="mt-4 flex gap-4">
        <Link href="/dashboard/analytics" className="text-sm font-medium text-accent">
          Analytics →
        </Link>
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
