"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) {
      setStatus("Use at least 8 characters.");
      return;
    }
    setBusy(true);
    setStatus(null);
    // Requires the recovery session established by /auth/callback.
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setStatus(`${error.message}. Your reset link may have expired — request a new one.`);
      return;
    }
    setStatus("Password updated. Taking you to your dashboard…");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-bold text-ink">Set a new password</h1>
      <p className="mt-1 text-sm text-muted">Choose a password you&apos;ll remember.</p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">New password</span>
          <span className="relative mt-1 block">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input type="password" required placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)}
              className="h-11 w-full rounded-btn border border-line bg-surface pl-9 pr-3 text-ink outline-none focus:border-accent" />
          </span>
        </label>
        <button type="submit" disabled={busy} className="h-11 w-full rounded-btn bg-accent font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60">
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>

      {status && <p className="mt-4 text-sm text-muted">{status}</p>}
    </AuthShell>
  );
}
