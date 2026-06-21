"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Building2, UserPlus, Receipt } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/admin/new-client", label: "New client", icon: UserPlus },
  { href: "/admin/billing", label: "Billing", icon: Receipt },
];

export function AdminSidebar({ email }: { email: string }) {
  const path = usePathname();
  return (
    <aside className="bg-ink text-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col">
      <div className="flex items-center gap-2 px-5 py-4">
        <Image src="/brand/plato-appicon.png" alt="" width={28} height={28} className="h-7 w-7 rounded-lg" />
        <span className="font-display font-extrabold">Plato</span>
        <span className="rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">Admin</span>
      </div>

      <nav className="mt-1 flex gap-1 overflow-x-auto px-3 pb-2 lg:mt-4 lg:flex-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? path === href : path.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex shrink-0 items-center gap-2.5 rounded-btn px-3 py-2 text-sm font-medium ${active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden px-4 pb-4 lg:block">
        <div className="flex items-center gap-2.5 rounded-card border border-white/10 bg-white/5 p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">OP</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Plato HQ</p>
            <p className="truncate text-xs text-white/50">{email}</p>
          </div>
        </div>
        <div className="mt-3 px-1"><SignOutButton /></div>
      </div>
    </aside>
  );
}
