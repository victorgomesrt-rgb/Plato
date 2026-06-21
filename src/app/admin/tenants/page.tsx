import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminConsole, type TenantRow } from "../admin-console";

export const metadata: Metadata = { title: "Admin · Tenants", robots: { index: false } };

export default async function AdminTenantsPage() {
  const admin = await currentAdmin();
  if (!admin) notFound();

  const svc = createAdminClient();
  const { data } = await svc
    .from("tenants")
    .select("id, name, slug, plan, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .returns<TenantRow[]>();
  const tenants = data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Tenants</h1>
          <p className="text-sm text-muted">{tenants.length} menu {tenants.length === 1 ? "page" : "pages"}</p>
        </div>
        <Link href="/admin/new-client" className="rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white">+ New client</Link>
      </div>
      <AdminConsole tenants={tenants} />
    </main>
  );
}
