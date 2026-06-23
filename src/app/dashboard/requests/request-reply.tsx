"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Reply, Send } from "lucide-react";
import { toast } from "@/components/toast";
import { respondToRequest } from "./actions";

// Inline reply / approve on a request card. Only rendered for the owner (not during
// read-only impersonation) and only on requests that aren't done.
export function RequestReply({ id, canApprove }: { id: string; canApprove: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  function send(reply: string) {
    start(async () => {
      const r = await respondToRequest(id, reply);
      if (r.ok) { toast("Reply sent to your team"); setOpen(false); setText(""); router.refresh(); }
      else toast(r.error);
    });
  }

  if (!open) {
    return (
      <div className="mt-3 flex gap-2 border-t border-line pt-3">
        {canApprove && (
          <button disabled={pending} onClick={() => send("Approved, looks good.")}
            className="inline-flex items-center gap-1.5 rounded-btn bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
            <Check className="h-3.5 w-3.5" />Approve
          </button>
        )}
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-btn border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-ink/20">
          <Reply className="h-3.5 w-3.5" />Reply
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} autoFocus
        placeholder="Type your reply to the Plato team…"
        className="w-full rounded-btn border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
      <div className="mt-2 flex gap-2">
        <button disabled={pending || !text.trim()} onClick={() => send(text)}
          className="inline-flex items-center gap-1.5 rounded-btn bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-deep disabled:opacity-60">
          <Send className="h-3.5 w-3.5" />{pending ? "Sending…" : "Send"}
        </button>
        <button onClick={() => { setOpen(false); setText(""); }} className="rounded-btn px-3 py-1.5 text-xs font-medium text-muted hover:text-ink">Cancel</button>
      </div>
    </div>
  );
}
