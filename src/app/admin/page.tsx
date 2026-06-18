import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminPage() {
  const admin = await currentAdmin();
  if (!admin) notFound();

  // Tenant roster (service role — admin sees all).
  const svc = createAdminClient();
  const { data: tenants } = await svc
    .from("tenants")
    .select("slug, name, plan, status, published_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Plato Admin</h1>
        <SignOutButton />
      </div>
      <p className="mt-1 text-sm text-muted">{admin.email}</p>

      <div className="mt-6">
        <Link
          href="/admin/new-client"
          className="inline-block rounded-btn bg-accent px-4 py-2.5 text-sm font-medium text-white"
        >
          + New client
        </Link>
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">
        Tenants ({tenants?.length ?? 0})
      </h2>
      <ul className="mt-3 space-y-2">
        {(tenants ?? []).map((t) => (
          <li
            key={t.slug}
            className="flex items-center justify-between rounded-card border border-line p-4"
          >
            <div>
              <p className="font-medium text-ink">{t.name}</p>
              <p className="text-sm text-muted">
                /{t.slug} · {t.plan} · {t.status}
                {t.published_at ? " · live" : ""}
              </p>
            </div>
            <Link href={`/${t.slug}`} className="text-sm text-muted underline hover:text-ink">
              View
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-muted">
        Requests, Hardware, Tablets, QR Codes, Billing, and Revenue arrive in later
        milestones.
      </p>
    </main>
  );
}
