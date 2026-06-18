import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  // Admin is you only. Don't reveal the console exists to non-admins.
  if (!profile?.is_platform_admin) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Plato Admin</h1>
        <SignOutButton />
      </div>
      <p className="mt-1 text-sm text-muted">{user.email}</p>
      <p className="mt-8 rounded-card border border-line p-4 text-muted">
        Overview, Tenants, New Client, Requests, Hardware, Tablets, QR Codes, Billing, and
        Revenue arrive in later milestones (provisioning is M3).
      </p>
    </main>
  );
}
