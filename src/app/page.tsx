import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Video, LayoutGrid, MapPin, QrCode, Languages, BarChart3, Camera, Tablet, Check,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Plato — Video menus for Caribbean restaurants",
  description:
    "We come to your restaurant, film your food, and build a fast video menu where the dishes actually move. Diners scan, watch, and decide.",
};

const DEMO = "/book";

const features = [
  { icon: Video, title: "Dishes that move", body: "A short, silent looping clip for every dish. People order what they can see." },
  { icon: LayoutGrid, title: "Four templates", body: "Reel, Grid, Classic, or Spotlight — the same menu, your look." },
  { icon: MapPin, title: "One-tap action bar", body: "Directions, Call, WhatsApp, Reserve, Order, Reviews, WiFi — you choose." },
  { icon: QrCode, title: "QR & NFC, tracked", body: "Every scan and tap is counted, so you see what's working." },
  { icon: Languages, title: "USD/AWG · EN/ES", body: "A clean currency toggle and Spanish, ready for every visitor." },
  { icon: BarChart3, title: "Real analytics", body: "Views, top dishes, scans, and directions — all in your dashboard." },
  { icon: Camera, title: "Done for you", body: "We shoot the food and build the menu — on every plan." },
  { icon: Tablet, title: "Optional tablet", body: "A kiosk-locked tablet for your counter, rented monthly." },
];

const steps = [
  { n: "01", title: "We come and film", body: "Our team visits and shoots your dishes to one consistent, mouth-watering standard." },
  { n: "02", title: "We build your menu", body: "Photos, video, prices, Spanish translation, and your chosen template — handled for you." },
  { n: "03", title: "You go live", body: "Share the link, place the QR, and watch the views roll in. Quick edits are one tap." },
];

const plans = [
  { name: "Starter", price: 99, setup: 199, highlight: false,
    items: ["Video menu page", "On-site photo & video capture", "One QR code stand", "Dashboard & basic analytics", "Up to 40 items"] },
  { name: "Growth", price: 249, setup: 299, highlight: true,
    items: ["Everything in Starter", "Full video menu, more items", "NFC + QR sticker pack, window decal", "Custom domain · EN & ES", "Advanced analytics"] },
  { name: "Premium", price: 499, setup: 499, highlight: false,
    items: ["Everything in Growth", "Unlimited items", "Spot on the Discover page", "Quarterly re-shoot · flyer design", "Full hardware kit · priority support"] },
];

function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <Image src="/brand/plato-appicon.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
      <span className="font-display text-lg font-extrabold tracking-tight">Plato</span>
    </Link>
  );
}

export default function Landing() {
  const year = new Date().getFullYear();
  return (
    <div className="bg-ink text-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <div className="hidden items-center gap-7 text-sm text-white/70 md:flex">
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#templates" className="hover:text-white">Templates</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white">Log in</Link>
            <a href={DEMO} className="rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep">Book a Demo</a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[36rem] w-[36rem] rounded-full bg-accent/30 blur-[120px]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Digital menus for Aruba restaurants
            </span>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              People eat with<br />their <span className="text-accent">eyes.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/70">
              We come to your restaurant, film your menu, and build a beautiful page where the
              food actually moves. Diners scan, watch, and decide. You don&apos;t build a thing.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={DEMO} className="rounded-btn bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-deep">Book a Demo →</a>
              <Link href="/hungparadise" className="rounded-btn border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5">See a live menu</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> Live in a day</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> Nothing to install</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> We film it for you</span>
            </div>
          </div>

          {/* Phone preview */}
          <div className="relative mx-auto w-[260px]">
            <div className="overflow-hidden rounded-[2.2rem] border-[7px] border-ink bg-black shadow-2xl ring-1 ring-white/10">
              <div className="relative h-[150px]" style={{ background: "linear-gradient(135deg,#FB6A1A,#F4B740 55%,#0E5B5B)" }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="font-display text-xl font-extrabold drop-shadow">Brisa</p>
                  <p className="text-[11px] text-white/80">Beach kitchen · Eagle Beach</p>
                </div>
              </div>
              <div className="bg-surface p-3 text-ink">
                <p className="text-xs font-semibold text-muted">Most Popular</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["Catch of the Day", "Garlic Shrimp"].map((d, i) => (
                    <div key={d} className="overflow-hidden rounded-lg border border-line">
                      <div className="h-16 w-full" style={{ background: i ? "#FB6A1A22" : "#0E5B5B22" }} />
                      <div className="p-1.5">
                        <p className="truncate text-[11px] font-medium">{d}</p>
                        <p className="text-[11px] font-semibold text-accent">${i ? "24" : "29"}.00</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -left-6 top-6 rounded-xl bg-white px-3 py-2 text-ink shadow-lg">
              <p className="text-[10px] text-muted">Menu views</p>
              <p className="font-display text-lg font-bold leading-none">1,284 <span className="text-xs font-semibold text-sea">▲19%</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-surface text-ink">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-3xl font-bold">How it works</h2>
          <p className="mt-2 text-muted">A live, filmed menu within a day or two of our visit.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-card border border-line p-6">
                <span className="font-display text-2xl font-extrabold text-accent">{s.n}</span>
                <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-surface text-ink">
        <div className="mx-auto max-w-6xl px-5 pb-16">
          <h2 className="font-display text-3xl font-bold">Everything your menu needs</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-card border border-line p-5">
                <f.icon className="h-6 w-6 text-accent" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="border-y border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-3xl font-bold">One menu, your look</h2>
          <p className="mt-2 max-w-lg text-white/70">Switch templates anytime — the same dishes, a different feel.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Reel", "Full-screen video, swipe to the next dish."],
              ["Grid", "Two-column cards. The scannable default."],
              ["Classic", "An elegant single-column list."],
              ["Spotlight", "A magazine hero per category."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-card border border-white/10 bg-white/5 p-5">
                <p className="font-display text-lg font-bold text-accent">{t}</p>
                <p className="mt-1 text-sm text-white/70">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-surface text-ink">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-3xl font-bold">Simple plans</h2>
          <p className="mt-2 text-muted">Capture and menu-building are included on every plan. Annual: pay 10 months, get 12.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {plans.map((p) => (
              <div key={p.name} className={`rounded-card border p-6 ${p.highlight ? "border-accent ring-1 ring-accent" : "border-line"}`}>
                {p.highlight && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">Most popular</span>}
                <h3 className="mt-2 font-display text-xl font-bold">{p.name}</h3>
                <p className="mt-1"><span className="font-display text-3xl font-extrabold">${p.price}</span><span className="text-muted">/mo</span></p>
                <p className="text-xs text-muted">+ ${p.setup} one-time setup</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {p.items.map((it) => (
                    <li key={it} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span>{it}</span></li>
                  ))}
                </ul>
                <a href={DEMO} className={`mt-6 block rounded-btn px-4 py-2.5 text-center text-sm font-semibold ${p.highlight ? "bg-accent text-white hover:bg-accent-deep" : "border border-line text-ink hover:bg-line"}`}>Book a Demo</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 80% at 50% 0%, rgba(251,106,26,.25), transparent)" }} />
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h2 className="font-display text-4xl font-extrabold">Show your food in motion.</h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">Book a free demo — we&apos;ll confirm a capture time and have your filmed menu live before your next dinner service.</p>
          <a href={DEMO} className="mt-7 inline-block rounded-btn bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-deep">Book a Demo →</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-white/60 sm:flex-row">
          <Logo />
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/discover" className="hover:text-white">Discover</Link>
            <Link href="/login" className="hover:text-white">Log in</Link>
            <a href={DEMO} className="hover:text-white">Book a Demo</a>
          </div>
          <p>© {year} Plato · GMS Innovations, Aruba</p>
        </div>
      </footer>
    </div>
  );
}
