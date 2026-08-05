"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#templates", label: "Templates" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

// Mobile-only menu for the landing nav (desktop shows the links inline). The floating
// header is position:fixed, so the dropdown anchors to it via top-full.
export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="press grid h-9 w-9 place-items-center rounded-full text-white/80 hover:text-white"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div className="absolute inset-x-3 top-full mt-2 rounded-card border border-white/10 bg-ink/95 p-2 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-btn px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-btn border-t border-white/10 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white"
          >
            Log in
          </Link>
        </div>
      )}
    </div>
  );
}
