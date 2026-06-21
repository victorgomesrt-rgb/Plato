"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, BarChart3, MessageSquare, CreditCard, ExternalLink } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";

type Item = { href: string; label: string; icon: typeof LayoutDashboard; external?: boolean };

export function DashboardSidebar({
  name, slug, plan, price, live, renews,
}: {
  name: string;
  slug: string;
  plan: string;
  price: string;
  live: boolean;
  renews: string | null;
}) {
  const path = usePathname();
  const nav: Item[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: `/${slug}`, label: "My menu", icon: UtensilsCrossed, external: true },
    { href: "/dashboard/analytics", label: "Insights", icon: BarChart3 },
    { href: "mailto:hello@platodigital.io?subject=Change%20request%20—%20" + encodeURIComponent(name), label: "Request a change", icon: MessageSquare, external: true },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  ];
  const initial = name.trim().charAt(0).toUpperCase() || "•";

  return (
    <aside className="bg-ink text-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col">
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-display text-lg font-bold text-white">{initial}</span>
        <div className="min-w-0">
          <p className="truncate font-display font-semibold">{name}</p>
          <p className="truncate text-xs text-white/50">platodigital.io/{slug}</p>
        </div>
      </div>

      <div className="px-5">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${live ? "bg-sea/20 text-emerald-300" : "bg-white/10 text-white/70"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-400" : "bg-white/40"}`} />
          {live ? "Page is live" : "Building"}
        </span>
      </div>

      <nav className="mt-4 flex gap-1 overflow-x-auto px-3 pb-2 lg:mt-5 lg:flex-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
        {nav.map(({ href, label, icon: Icon, external }) => {
          const active = !external && (href === "/dashboard" ? path === href : path.startsWith(href));
          const cls = `flex shrink-0 items-center gap-2.5 rounded-btn px-3 py-2 text-sm font-medium ${active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`;
          return external ? (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
              <Icon className="h-4 w-4" />{label}<ExternalLink className="ml-auto hidden h-3 w-3 text-white/30 lg:block" />
            </a>
          ) : (
            <Link key={label} href={href} className={cls}><Icon className="h-4 w-4" />{label}</Link>
          );
        })}
      </nav>

      <div className="px-4 pb-4 lg:mt-auto">
        <div className="hidden rounded-card border border-white/10 bg-white/5 p-3 lg:block">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">{plan} · {price}/mo</p>
          {renews && <p className="mt-0.5 text-xs text-white/55">Renews {renews}</p>}
          <Link href="/dashboard/billing" className="mt-2 block rounded-btn bg-white/10 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-white/15">Manage plan</Link>
        </div>
        <div className="px-1 lg:mt-3"><SignOutButton /></div>
      </div>
    </aside>
  );
}
