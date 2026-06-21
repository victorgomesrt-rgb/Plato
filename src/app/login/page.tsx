"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function sendMagicLink() {
    if (!email) {
      setStatus("Enter your email first.");
      return;
    }
    setBusy(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    setStatus(error ? error.message : "Check your email for a sign-in link.");
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Sign in to your Plato dashboard.</p>

      <form onSubmit={signInWithPassword} className="mt-7 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">Email</span>
          <span className="relative mt-1 block">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input type="email" required placeholder="you@restaurant.com" value={email} onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-btn border border-line bg-surface pl-9 pr-3 text-ink outline-none focus:border-accent" />
          </span>
        </label>
        <label className="block">
          <span className="flex items-center justify-between text-sm font-medium text-ink">
            Password
            <Link href="/forgot" className="font-medium text-accent hover:text-accent-deep">Forgot?</Link>
          </span>
          <span className="relative mt-1 block">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-btn border border-line bg-surface pl-9 pr-3 text-ink outline-none focus:border-accent" />
          </span>
        </label>
        <button type="submit" disabled={busy} className="h-11 w-full rounded-btn bg-accent font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60">
          {busy ? "…" : "Log in →"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" /></div>

      <button onClick={sendMagicLink} disabled={busy}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-btn border border-line bg-surface font-medium text-ink transition hover:border-ink/20 disabled:opacity-60">
        <Sparkles className="h-4 w-4 text-accent" /> Email me a magic link instead
      </button>

      {status && <p className="mt-4 text-center text-sm text-muted">{status}</p>}

      <p className="mt-6 text-center text-sm text-muted">New restaurant? <Link href="/#waitlist" className="font-semibold text-accent hover:text-accent-deep">Get started →</Link></p>
    </AuthShell>
  );
}
