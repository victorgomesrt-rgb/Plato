"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

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
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Image
          src="/brand/plato-lockup.png"
          alt="Plato"
          width={160}
          height={46}
          priority
          className="mx-auto mb-8 h-auto w-[150px]"
        />
        <h1 className="font-display text-xl font-semibold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-muted">Restaurant owners and the Plato team.</p>

        <form onSubmit={signInWithPassword} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="you@restaurant.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-btn border border-line px-3 py-2.5 text-ink outline-none focus:border-accent"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-btn border border-line px-3 py-2.5 text-ink outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-btn bg-accent px-4 py-2.5 font-medium text-white disabled:opacity-60"
          >
            Sign in
          </button>
        </form>

        <button
          onClick={sendMagicLink}
          disabled={busy}
          className="mt-3 w-full rounded-btn border border-line px-4 py-2.5 font-medium text-ink disabled:opacity-60"
        >
          Email me a sign-in link
        </button>

        {status && <p className="mt-4 text-sm text-muted">{status}</p>}
      </div>
    </main>
  );
}
