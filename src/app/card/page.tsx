import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { passShareUrl } from "@/lib/passbuddy";
import { AppleLogoIcon } from "@/components/diner/brand-icons";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The Plato Card · member perks across Aruba",
  description: "Add the Plato Card to Apple Wallet for member discounts at restaurants across Aruba.",
  alternates: { canonical: "/card" },
  openGraph: {
    title: "The Plato Card",
    description: "Member perks at restaurants across Aruba, in your Apple Wallet.",
    url: "https://platodigital.io/card",
    siteName: "Plato",
    type: "website",
  },
};

type Partner = { name: string; slug: string; wallet_discount: string | null };

export default async function PlatoCardPage() {
  const svc = createAdminClient();
  const [{ data: pass }, { data: partners }] = await Promise.all([
    svc.from("wallet_passes").select("share_id").eq("kind", "plato_card").maybeSingle(),
    svc.from("tenants").select("name, slug, wallet_discount").eq("wallet_partner", true).order("name").returns<Partner[]>(),
  ]);
  const shareId = (pass as { share_id: string } | null)?.share_id ?? null;
  const addUrl = shareId ? passShareUrl(shareId) : null;
  const list = partners ?? [];

  return (
    <main className="relative min-h-screen overflow-hidden text-white" style={{ background: "linear-gradient(160deg,#2a1a12 0%,#16110E 55%,#0b1a1a 100%)" }}>
      <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-accent opacity-50 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-1/2 h-72 w-72 rounded-full bg-sea opacity-40 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md px-5 py-8">
        <div className="flex items-center gap-2">
          <Image src="/brand/plato-mark-white.png" alt="Plato" width={28} height={28} className="h-7 w-7" />
          <span className="font-display text-lg font-semibold">Plato</span>
        </div>

        <section className="mt-7 rounded-card border border-white/15 bg-white/[0.08] p-6 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#FFB98A]">Loyalty</p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight">The Plato Card</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/70">One card, member perks at restaurants across Aruba, right in your Apple Wallet.</p>

          <div className="mt-5 rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-md">
            <div className="flex items-start justify-between">
              <span className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-md bg-accent text-[11px] font-bold">P</span><span className="text-sm font-semibold">Plato</span></span>
              <span className="text-right"><span className="block text-[9px] uppercase tracking-wide text-white/55">Member</span><span className="block text-sm">Active</span></span>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <span><span className="block text-[9px] uppercase tracking-wide text-white/55">Perk</span><span className="block text-sm">Member discounts</span></span>
              <span className="text-right"><span className="block text-[9px] uppercase tracking-wide text-white/55">Island</span><span className="block text-sm">Aruba</span></span>
            </div>
          </div>

          {addUrl ? (
            <a href="/api/card/add" target="_blank" rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-black/55 py-3.5 text-base font-semibold text-white backdrop-blur-md transition hover:bg-black/70">
              <AppleLogoIcon className="h-[18px] w-[18px]" />Add to Apple Wallet
            </a>
          ) : (
            <p className="mt-5 rounded-2xl border border-white/15 bg-white/[0.06] py-3.5 text-center text-sm text-white/70">Coming soon to Apple Wallet.</p>
          )}
          <p className="mt-2 text-center text-xs text-white/50">Show your card at checkout. iPhone only for now.</p>
        </section>

        <p className="mb-3 mt-8 px-1 text-xs font-semibold uppercase tracking-wide text-white/60">Where it works</p>
        {list.length === 0 ? (
          <p className="rounded-card border border-white/12 bg-white/[0.06] px-4 py-5 text-sm text-white/65 backdrop-blur-md">Partner restaurants are joining now. Check back soon.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {list.map((p) => (
              <li key={p.slug}>
                <Link href={`/${p.slug}`} className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.07] px-3 py-2.5 backdrop-blur-md transition hover:bg-white/[0.11]">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/15 text-sm font-semibold">{p.name.trim().charAt(0).toUpperCase()}</span>
                  <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                  {p.wallet_discount && <span className="shrink-0 rounded-full border border-white/12 bg-sea/55 px-2.5 py-0.5 text-xs font-medium">{p.wallet_discount}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 text-center text-xs text-white/40">Powered by Plato · platodigital.io</p>
      </div>
    </main>
  );
}
