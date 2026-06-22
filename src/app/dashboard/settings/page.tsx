import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { ChangePassword } from "./settings-form";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-5 py-6 lg:px-8 lg:py-8">
      <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>

      <section className="mt-6 rounded-card border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Account</h2>
            <p className="mt-1 text-sm text-muted">Signed in as {user.email}</p>
          </div>
          <SignOutButton />
        </div>
        <ChangePassword />
      </section>

      <section className="mt-4 rounded-card border border-line bg-surface p-5">
        <h2 className="font-display text-base font-semibold text-ink">Your team</h2>
        <p className="mt-1 text-sm text-muted">
          Need to add a manager or change who has access? <Link href="/dashboard/requests" className="font-medium text-accent">Send us a request</Link> and we&apos;ll set it up.
        </p>
      </section>

      <section className="mt-4 rounded-card border border-accent/30 bg-accent/5 p-5">
        <h2 className="font-display text-base font-semibold text-ink">Danger zone</h2>
        <p className="mt-1 text-sm text-muted">
          To temporarily pause your page or close your account, <Link href="/dashboard/requests" className="font-medium text-accent-deep">open a request</Link>.
          Your page stays live until we confirm with you.
        </p>
      </section>
    </main>
  );
}
