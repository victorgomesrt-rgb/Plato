import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { NewClientForm } from "./new-client-form";

export const metadata: Metadata = { title: "New Client", robots: { index: false } };

export default async function NewClientPage() {
  if (!(await currentAdmin())) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href="/admin" className="text-sm text-muted hover:text-ink">
        ← Admin
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">New client</h1>
      <p className="mt-1 text-sm text-muted">
        Provision a restaurant. Creates the tenant, the owner account, and the membership,
        then sends the owner an invite. The menu stays private until you publish it.
      </p>
      <NewClientForm />
    </main>
  );
}
