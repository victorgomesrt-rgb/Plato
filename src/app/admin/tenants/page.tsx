import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminConsole, type TenantRow } from "../admin-console";
import { AdminSearch } from "../search";

export const metadata: Metadata = { title: "Admin · Tenants", robots: { index: false } };

export default async function AdminTenantsPage() {
  if (!(await currentAdmin())) notFound();

  const svc = createAdminClient();
  const { data } = await svc
    .from("tenants")
    .select("id, name, slug, plan, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .returns<TenantRow[]>();
  const tenants = data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="font-display text-2xl font-bold text-ink">Tenants</h1>
          <p className="text-sm text-muted">Every restaurant on Plato</p>
        </div>
        <AdminSearch tenants={tenants.map((t) => ({ name: t.name, slug: t.slug, plan: t.plan }))} />
        <Link href="/admin/new-client" className="inline-flex shrink-0 items-center gap-1.5 rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep">
          <Plus className="h-4 w-4" /> New client
        </Link>
      </div>
      <AdminConsole tenants={tenants} />
    </main>
  );
}
