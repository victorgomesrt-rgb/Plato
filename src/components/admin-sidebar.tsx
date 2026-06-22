"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Building2, UserPlus, Inbox, Package, Tablet, QrCode, Receipt, LineChart, Mail, Megaphone } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { PlatoMark } from "@/components/plato-logo";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/admin/new-client", label: "New client", icon: UserPlus },
  { href: "/admin/requests", label: "Requests", icon: Inbox },
  { href: "/admin/hardware", label: "Hardware", icon: Package },
  { href: "/admin/tablets", label: "Tablets", icon: Tablet },
  { href: "/admin/qr", label: "QR codes", icon: QrCode },
  { href: "/admin/billing", label: "Billing", icon: Receipt },
  { href: "/admin/revenue", label: "Revenue", icon: LineChart },
  { href: "/admin/leads", label: "Leads", icon: Mail },
  { href: "/admin/landing", label: "Landing", icon: Megaphone },
];

export function AdminSidebar({ email, requestCount = 0 }: { email: string; requestCount?: number }) {
  const path = usePathname();
  return (
    <aside className="bg-ink text-white md:fixed md:inset-y-0 md:left-0 md:flex md:w-60 md:flex-col">
      <div className="flex items-center gap-2 px-5 py-4">
        <PlatoMark className="h-7 w-auto" onDark />
        <span className="font-display font-extrabold">Plato</span>
        <span className="rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">Admin</span>
      </div>

      <nav className="mt-1 flex gap-1 overflow-x-auto px-3 pb-2 md:mt-4 md:flex-1 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? path === href : path.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex shrink-0 items-center gap-2.5 rounded-btn px-3 py-2 text-sm font-medium ${active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}>
              <Icon className="h-4 w-4" />{label}
              {href === "/admin/requests" && requestCount > 0 && (
                <span className="ml-auto grid h-5 min-w-[20px] place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">{requestCount}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-4 md:mt-auto">
        <div className="hidden items-center gap-2.5 rounded-card border border-white/10 bg-white/5 p-3 md:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">OP</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Plato HQ</p>
            <p className="truncate text-xs text-white/50">{email}</p>
          </div>
        </div>
        <div className="px-1 md:mt-3"><SignOutButton /></div>
      </div>
    </aside>
  );
}
