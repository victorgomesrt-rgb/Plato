import { Star } from "lucide-react";
import { PlatoMark } from "@/components/plato-logo";
import type { Tenant } from "@/lib/tenant";

// Public page for a review-only client (no menu). Drives a Google review when the card
// is active + paid through today (AST); otherwise a neutral placeholder — same gate as /r.
export function ReviewLanding({ tenant }: { tenant: Tenant }) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba" }).format(new Date());
  const live =
    !!tenant.review_url &&
    tenant.review_active === true &&
    !!tenant.review_paid_through &&
    tenant.review_paid_through >= today;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      {tenant.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tenant.logo_url} alt={tenant.name} className="h-20 w-20 rounded-2xl object-contain" />
      )}
      <h1 className="font-display text-2xl font-bold text-ink">{tenant.name}</h1>
      {live ? (
        <>
          <div className="flex gap-1 text-accent" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-7 w-7 fill-current" />)}
          </div>
          <p className="max-w-sm text-muted">Enjoyed your visit? A quick Google review means the world to us.</p>
          <a
            href={tenant.review_url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-btn bg-accent px-6 py-3 text-base font-semibold text-white hover:bg-accent-deep"
          >
            Leave a Google review
          </a>
        </>
      ) : (
        <p className="max-w-sm text-muted">This page isn&rsquo;t available right now. Please check back soon.</p>
      )}
      <a href="https://platodigital.io" className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink">
        <PlatoMark className="h-4 w-auto" /> Powered by Plato
      </a>
    </main>
  );
}
