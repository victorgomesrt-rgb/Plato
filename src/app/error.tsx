"use client";

import Link from "next/link";
import { PlatoMark } from "@/components/plato-logo";

// Route-level error boundary: a friendly, branded fallback instead of a raw crash.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-24 text-center">
      <PlatoMark className="h-14 w-auto" />
      <h1 className="font-display text-2xl font-semibold text-ink">Something went wrong</h1>
      <p className="max-w-sm text-muted">A hiccup on our end. Try again, or head back to the homepage.</p>
      <div className="flex gap-3">
        <button onClick={reset} className="rounded-btn bg-accent px-5 py-2.5 text-sm font-medium text-white">Try again</button>
        <Link href="/" className="rounded-btn border border-line px-5 py-2.5 text-sm font-medium text-ink">Go to Plato</Link>
      </div>
    </main>
  );
}
