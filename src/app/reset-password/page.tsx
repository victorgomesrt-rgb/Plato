"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PlatoLogo } from "@/components/plato-logo";

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
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><PlatoLogo mark="h-9 w-auto" text="text-2xl" /></div>
        <h1 className="font-display text-xl font-semibold text-ink">Set a new password</h1>
        <p className="mt-1 text-sm text-muted">Choose a password you&apos;ll remember.</p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="password"
            required
            placeholder="New password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full rounded-btn border border-line px-3 py-2.5 text-ink outline-none focus:border-accent"
          />
          <button type="submit" disabled={busy} className="w-full rounded-btn bg-accent px-4 py-2.5 font-medium text-white disabled:opacity-60">
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>

        {status && <p className="mt-4 text-sm text-muted">{status}</p>}
      </div>
    </main>
  );
}
