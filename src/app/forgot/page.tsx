"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";

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
    <AuthShell>
      <h1 className="font-display text-2xl font-bold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-muted">We&apos;ll email you a link to set a new one.</p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">Email</span>
          <span className="relative mt-1 block">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input type="email" required placeholder="you@restaurant.com" value={email} onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-btn border border-line bg-surface pl-9 pr-3 text-ink outline-none focus:border-accent" />
          </span>
        </label>
        <button type="submit" disabled={busy} className="h-11 w-full rounded-btn bg-accent font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60">
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </form>

      {status && <p className="mt-4 text-sm text-muted">{status}</p>}
      <p className="mt-6 text-center text-sm"><Link href="/login" className="text-muted hover:text-ink">← Back to sign in</Link></p>
    </AuthShell>
  );
}
