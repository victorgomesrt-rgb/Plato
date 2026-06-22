"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, BarChart3, MessageSquare, AppWindow, CreditCard, ExternalLink } from "lucide-react";

type Item = { href: string; label: string; icon: typeof LayoutDashboard; badge?: number };

export function DashboardSidebar({
  name, slug, plan, price, live, renews, requestCount = 0, ownerName, ownerEmail,
}: {
  name: string;
  slug: string;
  plan: string;
  price: string;
  live: boolean;
  renews: string | null;
  requestCount?: number;
  ownerName: string;
  ownerEmail: string;
}) {
  const path = usePathname();
  const nav: Item[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/menu", label: "Menu", icon: List },
    { href: "/dashboard/analytics", label: "Insights", icon: BarChart3 },
    { href: "/dashboard/requests", label: "Requests", icon: MessageSquare, badge: requestCount },
    { href: "/dashboard/page-settings", label: "Your page", icon: AppWindow },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  ];
  const initial = name.trim().charAt(0).toUpperCase() || "•";
  const ownerInitials =
    (ownerName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("") || ownerEmail.charAt(0)).toUpperCase() || "•";

  return (
    <aside className="bg-ink text-white md:fixed md:inset-y-0 md:left-0 md:flex md:w-60 md:flex-col">
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-display text-lg font-bold text-white shadow-[0_0_22px_-4px_rgba(251,106,26,0.8)]">{initial}</span>
        <div className="min-w-0">
          <p className="truncate font-display font-semibold">{name}</p>
          <p className="truncate text-xs text-white/50">platodigital.io/{slug}</p>
        </div>
      </div>

      <div className="px-5">
        {live ? (
          <a href={`/${slug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-btn bg-white/[0.06] px-3 py-2 text-sm font-medium text-white hover:bg-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Page is live
            <ExternalLink className="ml-auto h-3.5 w-3.5 text-white/40" />
          </a>
        ) : (
          <span className="flex items-center gap-2 rounded-btn bg-white/10 px-3 py-2 text-sm font-medium text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            Building
          </span>
        )}
      </div>

      <nav className="mt-4 flex gap-1 overflow-x-auto px-3 pb-2 md:mt-5 md:flex-1 md:flex-col md:gap-0.5 md:overflow-visible md:px-0 md:pb-0">
        {nav.map(({ href, label, icon: Icon, badge }) => {
          const active = href === "/dashboard" ? path === href : path.startsWith(href);
          const cls = `flex shrink-0 items-center gap-3 rounded-btn border-l-2 px-4 py-2.5 text-[15px] font-medium md:rounded-none md:px-5 ${
            active ? "border-accent bg-white/[0.06] text-white" : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
          }`;
          return (
            <Link key={label} href={href} className={cls}>
              <Icon className="h-[18px] w-[18px]" />
              {label}
              {badge ? (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">{badge}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-4 md:mt-auto">
        <div className="hidden rounded-card border border-white/10 bg-white/5 p-4 md:block">
          <p className="text-xs">
            <span className="font-semibold uppercase tracking-wide text-accent">{plan}</span>
            <span className="text-white/60"> · {price}/mo</span>
          </p>
          {renews && <p className="mt-1 text-xs text-white/55">Renews {renews}</p>}
          <Link href="/dashboard/billing" className="mt-3 block rounded-btn border border-white/15 bg-white/[0.06] px-3 py-2 text-center text-sm font-semibold text-white hover:bg-white/10">Manage plan</Link>
        </div>

        <Link href="/dashboard/settings" className="mt-3 flex items-center gap-3 rounded-btn px-1 py-2 hover:bg-white/5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 font-display text-sm font-bold text-white/80">{ownerInitials}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{ownerName}</p>
            <p className="truncate text-xs text-white/50">Owner</p>
          </div>
          <Image src="/brand/plato-mark.png" alt="" width={20} height={20} className="h-5 w-5 shrink-0 opacity-70" />
        </Link>
      </div>
    </aside>
  );
}
