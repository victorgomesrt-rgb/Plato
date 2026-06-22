import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminHeader } from "../admin-header";
import { NewClientForm } from "./new-client-form";

export const metadata: Metadata = { title: "Admin · New client", robots: { index: false } };

export default async function NewClientPage() {
  if (!(await currentAdmin())) notFound();
  const { data: tenants } = await createAdminClient()
    .from("tenants").select("name, slug, plan").order("name").returns<{ name: string; slug: string; plan: string }[]>();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
      <AdminHeader title="New client" subtitle="Provision a menu page & owner account" tenants={tenants ?? []} showNewClient={false} />
      <NewClientForm />
    </main>
  );
}
