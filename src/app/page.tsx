import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Phone, Wifi, CalendarCheck, QrCode, Play, Check, Video, PenTool, CheckCircle2,
  Languages, Coins, ScanLine, BarChart3, Sparkles, Hand,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/diner/brand-icons";
import { PlatoMark } from "@/components/plato-logo";
import { EmailCapture } from "@/components/email-capture";
import { TemplateSwitcher } from "@/components/landing/template-switcher";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Plato — Video menus for Caribbean restaurants",
  description:
    "We come to your restaurant, film every dish, and build a beautiful menu page where the food actually moves. Diners scan, watch, and decide.",
};

const WAITLIST = "#waitlist";
const KB = (s: number) => ({ animation: `plato-kenburns ${s}s ease-in-out infinite alternate` });

const TICKER = ["Brisa", "Zeerover", "Gostoso", "Pinchos Grill", "Madame Janette", "Flying Fishbone", "Quinta del Carmen", "Yemanja"];

const why = [
  { icon: Play, tint: "bg-accent/10 text-accent", title: "Food is the hero", body: "Short looping clips fill the screen. A dish in motion sells itself — far better than a line of text and a price." },
  { icon: Hand, tint: "bg-sea/10 text-sea", title: "One tap to value", body: "No app, no login, no waiting. Scan the QR, see the food, get directions or call — even on slow data by the beach." },
  { icon: Sparkles, tint: "bg-citrus/20 text-[#9a7b15]", title: "Made for the island", body: "English and Spanish, USD and AWG, a Caribbean look. Built for tourists and locals alike — and for you to never touch it." },
];

const features = [
  { icon: MapPin, title: "Action bar", body: "Directions, call, WhatsApp, reserve, wifi, Instagram — the buttons you choose, one tap away." },
  { icon: Languages, title: "Two languages", body: "English and Spanish per dish. We auto-translate a draft, then review it by hand before you go live." },
  { icon: Coins, title: "Two currencies", body: "USD and AWG at the island peg. Diners always know exactly what they’ll pay before they sit down." },
  { icon: ScanLine, title: "QR + NFC", body: "Tap or scan from the table, window, or host stand. Every scan is tracked back to that spot." },
  { icon: BarChart3, title: "Analytics", body: "Views, top dishes, video plays, scans, directions, calls. See what diners actually crave." },
  { icon: Sparkles, title: "Done for you", body: "You build nothing. We capture, cut, write, translate, place the codes, and publish. You just open." },
];

const steps = [
  { n: "1", icon: Video, title: "We come and film", body: "Our team visits and shoots every dish to one standard — vertical, 4–8 second loops, soft light, no busy moves." },
  { n: "2", icon: PenTool, title: "We build your page", body: "We cut the clips, write your descriptions in EN and ES, set prices and currency, and pick the template that fits." },
  { n: "3", icon: CheckCircle2, title: "You go live", body: "We place your QR and NFC, hand you the link, and show it on your phone. Need a change? Ask — it lands in our queue." },
];

const stats = [["63", "Live menu pages"], ["4", "Menu templates"], ["2", "Languages · EN & ES"], ["1", "Day from shoot to live"]];

const plans = [
  { name: "Starter", tagline: "For cafes & casual spots", price: 99, cta: "Get started", dark: false,
    items: ["On-site photo & video capture", "Your menu page + one QR stand", "Sold-out & price quick edits", "Up to 40 items", "Basic analytics"] },
  { name: "Growth", tagline: "For busy restaurants", price: 249, cta: "Get started", dark: true,
    items: ["Everything in Starter", "Full video menu, more items", "English & Spanish · USD & AWG", "NFC + QR stickers & window decal", "Custom domain", "Advanced analytics · 1 re-shoot/yr"] },
  { name: "Premium", tagline: "For beach clubs & fine dining", price: 499, cta: "Get started", dark: false,
    items: ["Everything in Growth", "Unlimited items", "Featured on Discover", "Quarterly re-shoot · full hardware kit", "Flyer design · priority support"] },
];

const ACTIONS = [
  { icon: MapPin, label: "Route", primary: true },
  { icon: Phone, label: "Call" },
  { icon: WhatsAppIcon, label: "WhatsApp" },
  { icon: Wifi, label: "Wifi" },
  { icon: CalendarCheck, label: "Reserve" },
];

function Sparkline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 36" className={className} fill="none" preserveAspectRatio="none">
      <path d="M0 30 L14 26 L28 28 L42 20 L56 23 L70 14 L84 17 L98 9 L120 4" stroke="#FB6A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeroPhone() {
  return (
    <div className="relative mx-auto w-[312px]">
      {/* Phone frame: 312x632, ink body, big soft shadow + 2px white ring (exact mockup) */}
      <div className="h-[632px] w-[312px] rounded-[44px] bg-[#14110F] p-[9px] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.8),0_0_0_2px_rgba(255,255,255,0.06)]">
        <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-surface">
          {/* Notch */}
          <div className="absolute left-1/2 top-0 z-10 h-[26px] w-[110px] -translate-x-1/2 rounded-b-2xl bg-[#14110F]" />

          {/* Cover */}
          <div className="relative h-[252px] overflow-hidden bg-[#2A211B]">
            <Image src="/landing/dish-8.jpg" alt="" fill sizes="312px" className="object-cover" style={KB(13)} priority />
            <div className="absolute inset-0" style={{ background: "linear-gradient(rgba(0,0,0,.34) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,.8) 100%)" }} />
            <div className="absolute left-4 top-9 flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Open now
            </div>
            <div className="absolute right-4 top-[38px] flex gap-1.5">
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-ink">EN</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-ink">USD</span>
            </div>
            <div className="absolute bottom-3.5 left-4">
              <p className="font-display text-[26px] font-extrabold leading-none text-white drop-shadow">Brisa</p>
              <p className="mt-1 text-[11px] text-white/85">Beach kitchen · Eagle Beach</p>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex gap-3.5 px-4 pb-2 pt-3.5">
            {ACTIONS.map((a) => (
              <span key={a.label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className={`grid h-10 w-10 place-items-center rounded-full ${a.primary ? "bg-accent text-white" : "bg-line text-ink"}`}>
                  <a.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="text-[9px] font-medium text-muted">{a.label}</span>
              </span>
            ))}
          </div>

          {/* Most popular */}
          <div className="px-4 pt-2">
            <div className="flex items-baseline justify-between">
              <p className="text-[13px] font-semibold text-ink">Most Popular</p>
              <span className="text-[10px] text-muted">Tap to open</span>
            </div>
            <div className="mt-2.5 flex gap-2.5">
              {[{ img: "/landing/dish-7.jpg", n: "Garlic Shrimp", p: "$24", s: 14 }, { img: "/landing/dish-4.jpg", n: "Mango Colada", p: "$12", s: 16 }].map((d) => (
                <div key={d.n} className="w-[128px] shrink-0 overflow-hidden rounded-2xl border border-line">
                  <div className="relative h-[124px] overflow-hidden">
                    <Image src={d.img} alt="" fill sizes="128px" className="object-cover" style={KB(d.s)} />
                    <span className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/40 backdrop-blur">
                      <Play className="h-3.5 w-3.5 fill-white text-white" />
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-[12px] font-semibold text-ink">{d.n}</p>
                    <p className="text-[12px] font-bold text-accent">{d.p}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating "views" chip — top:38 left:-28 w:184 */}
      <div className="absolute left-[-28px] top-[38px] w-[184px] rounded-2xl bg-white/95 px-[15px] py-[13px] text-ink shadow-[0_22px_44px_-20px_rgba(0,0,0,0.6)]" style={{ animation: "plato-float 5s ease-in-out infinite" }}>
        <p className="text-[11px] font-semibold text-[#9A938A]">This week</p>
        <p className="flex items-baseline gap-1.5"><span className="font-display text-2xl font-extrabold leading-none text-ink">1,284</span><span className="text-xs font-bold text-[#157A48]">▲ 22%</span></p>
        <p className="text-[11px] text-[#9A938A]">menu views</p>
        <Sparkline className="mt-1.5 h-7 w-full" />
      </div>

      {/* Floating "scan" chip — bottom:70 right:-24 */}
      <div className="absolute bottom-[70px] right-[-24px] flex items-center gap-[11px] rounded-2xl bg-white/95 px-[14px] py-3 text-ink shadow-[0_22px_44px_-20px_rgba(0,0,0,0.6)]" style={{ animation: "plato-float-slow 6s ease-in-out infinite" }}>
        <span className="grid h-[42px] w-[42px] place-items-center rounded-[10px] bg-ink text-white"><QrCode className="h-6 w-6" /></span>
        <div><p className="text-[12px] font-bold leading-tight">Scan to view</p><p className="text-[11px] text-[#9A938A]">Tracked QR &amp; NFC</p></div>
      </div>
    </div>
  );
}

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <p className={`text-xs font-bold uppercase tracking-[0.18em] ${dark ? "text-accent" : "text-accent"}`}>{children}</p>;
}

export default function Landing() {
  const year = new Date().getFullYear();
  return (
    <div className="bg-ink text-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2"><PlatoMark className="h-7 w-auto" onDark /><span className="font-display text-lg font-extrabold tracking-tight">Plato</span></Link>
          <div className="hidden items-center gap-7 text-sm text-white/70 md:flex">
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#templates" className="hover:text-white">Templates</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white">Log in</Link>
            <a href={WAITLIST} className="rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep">Get started</a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-40 h-[40rem] w-[40rem] rounded-full bg-accent/25 blur-[130px]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Digital menus for Aruba’s restaurants
            </span>
            <h1 className="mt-5 font-display text-hero font-extrabold leading-[0.96] tracking-tight">
              People eat with their <span className="text-accent">eyes.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/70">
              We come to your restaurant, film every dish, and build you a beautiful menu page where the
              food actually moves. Diners scan, watch, and decide. You don’t build a thing.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={WAITLIST} className="rounded-btn bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-deep">Get started →</a>
              <Link href="/hungparadise" className="rounded-btn border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5">See a live menu</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> Live in a day</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> EN & ES</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-accent" /> No app to download</span>
            </div>
          </div>
          <HeroPhone />
        </div>
        {/* Ticker — label centered above, names scroll cleanly on their own line (exact mockup) */}
        <div className="overflow-hidden pb-7 pt-1">
          <p className="mb-3 text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-white/40">Now serving the island</p>
          <div className="flex w-max" style={{ animation: "plato-marquee 32s linear infinite" }}>
            {[...TICKER, ...TICKER].map((n, i) => (
              <span key={i} className="flex items-center gap-9 whitespace-nowrap px-[18px] text-[20px] font-bold text-white/[0.62]">
                {n}<span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why it works */}
      <section id="how" className="bg-surface text-ink">
        <Reveal className="mx-auto max-w-6xl px-5 py-20">
          <Eyebrow>Why it works</Eyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-section font-extrabold leading-tight">A paper menu can’t show how good it tastes.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {why.map((c) => (
              <div key={c.title} className="rounded-card border border-line bg-white p-6 shadow-sm">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${c.tint}`}><c.icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-display text-lg font-bold">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Templates */}
      <section id="templates" className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-accent/15 blur-[120px]" />
        <Reveal className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center">
            <Eyebrow>Four templates, one shoot</Eyebrow>
            <h2 className="mt-3 font-display text-section font-extrabold">Pick the look that fits your room.</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/65">Same dishes, four presentations. From TikTok-style full-screen reels to a calm fine-dining list — switch anytime, no re-shoot needed.</p>
          </div>
          <TemplateSwitcher />
        </Reveal>
      </section>

      {/* Features + dashboard */}
      <section id="features" className="bg-surface text-ink">
        <Reveal className="mx-auto max-w-6xl px-5 py-20">
          <Eyebrow>Everything included</Eyebrow>
          <h2 className="mt-3 font-display text-section font-extrabold">Built for diners on the island.</h2>

          <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-[1.1fr_1fr]">
            {/* Dashboard preview */}
            <div className="rounded-card bg-ink p-6 text-white shadow-lg">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-white"><BarChart3 className="h-5 w-5" /></span>
              <h3 className="mt-4 font-display text-xl font-bold">Know what they crave.</h3>
              <p className="mt-1.5 text-sm text-white/65">Views, top dishes, video plays, QR scans, directions and calls — all in one dashboard. We even email you a monthly recap so the value stays visible.</p>
              <div className="mt-5 rounded-card bg-white p-4 text-ink">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted">Menu views · 30 days</p>
                  <span className="text-xs font-bold text-sea">▲ 19%</span>
                </div>
                <p className="font-display text-3xl font-extrabold">8,420</p>
                <Sparkline className="mt-1 h-10 w-full" />
                <div className="mt-3 space-y-2 border-t border-line pt-3">
                  {[["Garlic Shrimp", "1,204", "/landing/dish-7.jpg", 100], ["Catch of the Day", "986", "/landing/dish-2.jpg", 82], ["Mango Colada", "742", "/landing/dish-4.jpg", 62]].map(([n, plays, img, w]) => (
                    <div key={n as string} className="flex items-center gap-2.5">
                      <span className="relative h-7 w-7 overflow-hidden rounded-md"><Image src={img as string} alt="" fill sizes="28px" className="object-cover" /></span>
                      <span className="flex-1 text-xs font-medium">{n}</span>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-accent" style={{ width: `${w}%` }} /></div>
                      <span className="w-12 text-right text-[11px] text-muted">{plays} plays</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Feature grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((f) => (
                <div key={f.title} className="rounded-card border border-line bg-white p-5">
                  <f.icon className="h-6 w-6 text-accent" />
                  <h3 className="mt-3 font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Steps */}
      <section className="relative overflow-hidden">
        <Reveal className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center">
            <Eyebrow>Done for you</Eyebrow>
            <h2 className="mt-3 font-display text-section font-extrabold">From shoot to live in a day.</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/65">You run the restaurant. We handle the rest — filming, building, translating, and placing your QR codes.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-card border border-white/10 bg-white/[0.03] p-6">
                <span className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-xl bg-accent text-white"><s.icon className="h-5 w-5" /></span>
                <span className="font-display text-5xl font-extrabold text-white/10">{s.n}</span>
                <h3 className="mt-3 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{s.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Stat band */}
      <section className="bg-accent text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-14 md:grid-cols-4">
          {stats.map(([n, l]) => (
            <div key={l} className="text-center">
              <p className="font-display text-5xl font-extrabold leading-none">{n}</p>
              <p className="mt-2 text-sm font-medium text-white/85">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-surface text-ink">
        <Reveal className="mx-auto max-w-6xl px-5 py-20">
          <div className="text-center">
            <Eyebrow>Simple pricing</Eyebrow>
            <h2 className="mt-3 font-display text-section font-extrabold">One monthly price. We do the work.</h2>
            <p className="mt-3 text-muted">Plus a one-time on-site capture fee. No contracts, cancel anytime.</p>
          </div>
          <div className="mt-12 grid items-start gap-5 md:grid-cols-3">
            {plans.map((p) => (
              <div key={p.name} className={`rounded-card p-6 ${p.dark ? "bg-ink text-white shadow-xl ring-1 ring-accent/40 md:-mt-3 md:pb-9" : "border border-line bg-white"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold">{p.name}</h3>
                  {p.dark && <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Most popular</span>}
                </div>
                <p className={`text-sm ${p.dark ? "text-white/60" : "text-muted"}`}>{p.tagline}</p>
                <p className="mt-4"><span className="font-display text-section font-extrabold">${p.price}</span><span className={p.dark ? "text-white/60" : "text-muted"}>/mo</span></p>
                <a href={WAITLIST} className={`mt-5 block rounded-btn px-4 py-2.5 text-center text-sm font-semibold ${p.dark ? "bg-accent text-white hover:bg-accent-deep" : "bg-ink text-white hover:bg-ink/90"}`}>{p.cta}</a>
                <ul className="mt-5 space-y-2.5 text-sm">
                  {p.items.map((it) => (
                    <li key={it} className="flex gap-2"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.dark ? "text-accent" : "text-sea"}`} /><span className={p.dark ? "text-white/85" : ""}>{it}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Final CTA — email capture */}
      <section id="waitlist" className="relative overflow-hidden scroll-mt-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(55% 70% at 50% 35%, rgba(251,106,26,.32), transparent)" }} />
        <div className="mx-auto max-w-2xl px-5 py-24 text-center">
          <PlatoMark className="mx-auto h-12 w-auto" onDark />
          <h2 className="mt-5 font-display text-section font-extrabold">Let’s bring your menu to life.</h2>
          <p className="mx-auto mt-3 max-w-md text-lg text-white/70">Leave your email and we’ll reach out to book a capture visit — your filmed menu can be live before your next dinner service.</p>
          <div className="mt-8"><EmailCapture variant="dark" /></div>
          <Link href="/hungparadise" className="mt-4 inline-block text-sm font-medium text-white/70 hover:text-white">See a live menu →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-white/55 sm:flex-row">
          <div className="flex items-center gap-2">
            <PlatoMark className="h-6 w-auto" onDark />
            <span className="font-display font-extrabold text-white">Plato</span>
            <span className="ml-2 hidden text-white/40 sm:inline">Digital menus · Oranjestad, Aruba</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#templates" className="hover:text-white">Templates</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </div>
          <p>© {year} Plato</p>
        </div>
      </footer>
    </div>
  );
}
