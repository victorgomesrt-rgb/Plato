import type { Metadata } from "next";
import { PlatoMark } from "@/components/plato-logo";

export const metadata: Metadata = { title: "Link paused", robots: { index: false } };

// Neutral paused page for a Review Card that isn't active/paid. No restaurant name, no
// Google redirect — that withheld redirect is the payment leverage.
export default function ReviewUnavailablePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-6 text-center text-white">
      <div className="max-w-sm">
        <PlatoMark className="mx-auto h-10 w-auto" onDark />
        <h1 className="mt-6 font-display text-2xl font-bold">This link is paused</h1>
        <p className="mt-3 text-white/70">This link isn&rsquo;t active right now. Please check back soon.</p>
        <a
          href="https://platodigital.io"
          className="mt-7 inline-block rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep"
        >
          Powered by Plato
        </a>
      </div>
    </main>
  );
}
