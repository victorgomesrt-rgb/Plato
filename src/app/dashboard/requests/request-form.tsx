"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { submitChangeRequest } from "./actions";

const KINDS = [
  { v: "menu", label: "New dish" },
  { v: "price", label: "Price change" },
  { v: "video", label: "Re-shoot a video" },
  { v: "photo", label: "Photo swap" },
  { v: "copy", label: "Copy / text" },
  { v: "hours", label: "Hours" },
  { v: "plan", label: "Change plan" },
  { v: "question", label: "Question" },
  { v: "general", label: "Something else" },
];

export function RequestForm({ readOnly = false }: { readOnly?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState("");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    if (!message.trim()) { setErr("Tell us what you need."); return; }
    setErr(null);
    start(async () => {
      const r = await submitChangeRequest({ kind: kind || "general", message });
      if (r.ok) { setMessage(""); setKind(""); setOk(true); router.refresh(); setTimeout(() => setOk(false), 3000); }
      else setErr(r.error);
    });
  }

  return (
    <form onSubmit={submit} className="rounded-card border border-line bg-surface p-5">
      <h2 className="font-display text-lg font-bold text-ink">New request</h2>
      <p className="mt-1 text-sm text-muted">Anything beyond price &amp; sold-out. Your team replies within a day.</p>

      <label className="mt-4 block text-sm font-medium text-ink">Type
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="mt-1 w-full rounded-btn border border-line bg-surface px-3 py-2.5 text-ink outline-none focus:border-accent">
          <option value="">Select a type</option>
          {KINDS.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}
        </select>
      </label>
      <label className="mt-3 block text-sm font-medium text-ink">What do you need?
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="e.g. Add our new Saturday paella special, happy to have you film it."
          className="mt-1 w-full rounded-card border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent" />
      </label>
      {err && <p className="mt-2 text-sm text-accent-deep">{err}</p>}
      {ok && <p className="mt-2 text-sm text-sea">Sent, our team will take care of it.</p>}
      <button type="submit" disabled={pending || readOnly} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-btn bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60">
        <Send className="h-4 w-4" />{pending ? "Sending…" : "Send to my team"}
      </button>
    </form>
  );
}
