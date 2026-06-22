"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitChangeRequest } from "./actions";

const KINDS = [
  { v: "menu", label: "Menu item (add/edit/remove)" },
  { v: "price", label: "Price change" },
  { v: "video", label: "New video or photo" },
  { v: "hours", label: "Hours" },
  { v: "general", label: "Something else" },
];

export function RequestForm({ readOnly = false }: { readOnly?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState("menu");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setErr(null);
    start(async () => {
      const r = await submitChangeRequest({ kind, message });
      if (r.ok) { setMessage(""); setOk(true); router.refresh(); setTimeout(() => setOk(false), 3000); }
      else setErr(r.error);
    });
  }

  return (
    <form onSubmit={submit} className="rounded-card border border-line bg-surface p-5">
      <label className="block text-sm font-medium text-ink">What needs changing?
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="mt-1 w-full rounded-btn border border-line bg-surface px-3 py-2.5 text-ink outline-none focus:border-accent">
          {KINDS.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}
        </select>
      </label>
      <label className="mt-3 block text-sm font-medium text-ink">Details
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="e.g. Mark the Catch of the Day sold out tonight, and update the Mojito price to $9."
          className="mt-1 w-full rounded-card border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent" />
      </label>
      {err && <p className="mt-2 text-sm text-accent-deep">{err}</p>}
      {ok && <p className="mt-2 text-sm text-sea">Sent, our team will take care of it.</p>}
      <button type="submit" disabled={pending || readOnly} className="mt-4 rounded-btn bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
