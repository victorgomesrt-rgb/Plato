"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ChangePassword() {
  const supabase = createClient();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { setMsg("Use at least 8 characters."); return; }
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    setMsg(error ? error.message : "Password updated.");
    if (!error) setPw("");
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-center gap-2">
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="New password"
        className="flex-1 rounded-btn border border-line px-3 py-2.5 text-ink outline-none focus:border-accent"
      />
      <button type="submit" disabled={busy} className="rounded-btn bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "Saving…" : "Update password"}
      </button>
      {msg && <p className="w-full text-sm text-muted">{msg}</p>}
    </form>
  );
}
