"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { submitLead } from "@/app/lead-actions";

// Landing email capture ("leave your email, we'll reach out").
export function EmailCapture({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dark = variant === "dark";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await submitLead(email);
      if (r.ok) { setDone(true); setEmail(""); }
      else setErr(r.error);
    });
  }

  if (done)
    return (
      <div className={`mx-auto flex max-w-md items-center justify-center gap-2 rounded-btn px-5 py-4 font-medium ${dark ? "bg-white/10 text-white" : "bg-sea/10 text-sea"}`}>
        <Check className="h-5 w-5 text-accent" /> Thanks — we&apos;ll reach out soon.
      </div>
    );

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md">
      <div className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          aria-label="Email address"
          className={`h-12 w-full rounded-full px-5 text-base outline-none ${dark ? "bg-white/95 text-ink placeholder:text-muted focus:ring-2 focus:ring-white/60" : "border border-line bg-surface text-ink placeholder:text-muted focus:border-accent"}`}
        />
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-full bg-accent px-5 font-semibold text-white transition hover:bg-accent-deep disabled:opacity-60"
        >
          {pending ? "Sending…" : "Submit"}
        </button>
      </div>
      {err && <p className={`mt-2 text-center text-sm ${dark ? "text-white/80" : "text-accent-deep"}`}>{err}</p>}
    </form>
  );
}
