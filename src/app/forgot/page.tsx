"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    setStatus(
      error ? error.message : "If that email has an account, a reset link is on the way."
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Image src="/brand/plato-lockup.png" alt="Plato" width={160} height={46} priority className="mx-auto mb-8 h-auto w-[150px]" />
        <h1 className="font-display text-xl font-semibold text-ink">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">We&apos;ll email you a link to set a new one.</p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="you@restaurant.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-btn border border-line px-3 py-2.5 text-ink outline-none focus:border-accent"
          />
          <button type="submit" disabled={busy} className="w-full rounded-btn bg-accent px-4 py-2.5 font-medium text-white disabled:opacity-60">
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>

        {status && <p className="mt-4 text-sm text-muted">{status}</p>}
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-muted hover:text-ink">← Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
