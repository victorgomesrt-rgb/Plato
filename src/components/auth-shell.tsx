import Link from "next/link";
import { PlatoMark, PlatoLogo } from "@/components/plato-logo";

// Split-screen auth layout: dark marketing panel (desktop) + form on the right.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Marketing panel */}
      <div className="relative hidden overflow-hidden bg-ink p-10 text-white md:flex md:flex-col">
        <div className="pointer-events-none absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-accent/25 blur-[120px]" />
        <Link href="/" className="relative flex items-center gap-2">
          <PlatoMark className="h-7 w-auto" onDark /><span className="font-display text-lg font-extrabold">Plato</span>
        </Link>
        <div className="relative my-auto max-w-sm">
          <h1 className="font-display text-4xl font-extrabold leading-[1.1]">Your menu,<br /><span className="text-accent">in motion.</span></h1>
          <p className="mt-4 text-white/65">Sign in to see how your dishes are performing, edit prices, and request changes from your team.</p>
          <div className="mt-8 w-64 rounded-card bg-white p-4 text-ink shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">Brisa · this month</p>
              <span className="flex items-center gap-1 text-xs font-bold text-sea"><span className="h-1.5 w-1.5 rounded-full bg-sea" /> Live</span>
            </div>
            <p className="mt-1 font-display text-2xl font-extrabold">8,420 <span className="text-xs font-bold text-sea">▲19%</span></p>
            <p className="text-xs text-muted">menu views</p>
            <svg viewBox="0 0 220 44" className="mt-2 h-9 w-full" fill="none" preserveAspectRatio="none">
              <path d="M0 38 L26 34 L52 36 L78 26 L104 29 L130 18 L156 21 L182 11 L220 5" stroke="#FB6A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="relative flex gap-5 text-sm text-white/50">
          <span>✓ 63 menus live</span><span>✓ Oranjestad, Aruba</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-[#FAF8F4] px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center md:hidden"><PlatoLogo mark="h-9 w-auto" text="text-2xl" /></div>
          {children}
        </div>
      </div>
    </div>
  );
}
