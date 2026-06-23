"use client";

import { useState, type ComponentType } from "react";
import {
  MapPin, Phone, Globe, CalendarCheck, ShoppingBag, Mail, Star, FileText, Wifi, Share2, Wallet,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { track } from "@/lib/track-client";
import { WhatsAppIcon, InstagramIcon, FacebookIcon, TikTokIcon } from "./brand-icons";
import type { TenantLink } from "@/lib/tenant";

type Icon = ComponentType<{ className?: string }>;

const ICONS: Record<string, Icon> = {
  directions: MapPin, call: Phone, whatsapp: WhatsAppIcon, website: Globe,
  reserve: CalendarCheck, order: ShoppingBag, email: Mail, instagram: InstagramIcon,
  tiktok: TikTokIcon, facebook: FacebookIcon, reviews: Star, menu_pdf: FileText,
  wifi: Wifi, share: Share2, plato_card: Wallet,
};

function eventFor(type: string): string {
  if (type === "directions") return "directions_click";
  if (type === "call") return "call_click";
  return "link_click";
}

type TenantBits = {
  name: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
};

function hrefFor(link: TenantLink, tn: TenantBits): string | null {
  switch (link.type) {
    case "directions":
      if (tn.lat != null && tn.lng != null)
        return `https://www.google.com/maps/search/?api=1&query=${tn.lat},${tn.lng}`;
      return tn.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tn.address)}`
        : null;
    case "call":
      return tn.phone ? `tel:${tn.phone}` : null;
    case "whatsapp":
      return tn.whatsapp ? `https://wa.me/${tn.whatsapp.replace(/\D/g, "")}` : null;
    case "email":
      return link.url ? `mailto:${link.url}` : null;
    default:
      return link.url ?? null;
  }
}

const WRAP = "flex min-w-[60px] shrink-0 flex-col items-center gap-1.5";

// Match the mockup: only WhatsApp gets its brand green; everything else is neutral ink.
const BRAND: Record<string, string> = {
  whatsapp: "#25D366",
};

function Circle({ Icon, type, primary, accent }: { Icon: Icon; type: string; primary: boolean; accent: string }) {
  const brand = BRAND[type];
  const card = type === "plato_card";
  return (
    <span
      className={`grid h-12 w-12 place-items-center rounded-full transition ${primary ? "text-white" : card ? "border border-white/15 text-white shadow-sm backdrop-blur-md" : "bg-line"}`}
      style={primary ? { background: accent } : card ? { background: "rgba(22,17,14,0.92)" } : brand ? { color: brand } : { color: "var(--color-ink)" }}
    >
      <Icon className="h-[22px] w-[22px]" />
    </span>
  );
}

function ActionButton({
  link, tenant, tenantId, locale, accent, onWifi, onShare,
}: {
  link: TenantLink;
  tenant: TenantBits;
  tenantId: string;
  locale: string;
  accent: string;
  onWifi: () => void;
  onShare: () => void;
}) {
  const Icon = ICONS[link.type];
  const label = link.label || t(locale, link.type);
  const primary = link.type === "directions";
  const inner = (
    <>
      <Circle Icon={Icon} type={link.type} primary={primary} accent={accent} />
      <span className="text-[11px] font-medium text-ink">{label}</span>
    </>
  );

  if (link.type === "wifi")
    return (
      <button className={WRAP} onClick={() => { track(tenantId, "link_click"); onWifi(); }}>
        {inner}
      </button>
    );
  if (link.type === "share")
    return (
      <button className={WRAP} onClick={() => { track(tenantId, "link_click"); onShare(); }}>
        {inner}
      </button>
    );

  const href = hrefFor(link, tenant);
  if (!href) return null;
  return (
    <a className={WRAP} href={href} target="_blank" rel="noopener noreferrer" onClick={() => track(tenantId, eventFor(link.type))}>
      {inner}
    </a>
  );
}

export function ActionBar({
  links, tenant, tenantId, locale, shareUrl, accent,
}: {
  links: TenantLink[];
  tenant: TenantBits;
  tenantId: string;
  locale: string;
  shareUrl: string;
  accent: string;
}) {
  const [wifiFor, setWifiFor] = useState<TenantLink | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const enabled = links.filter((l) => l.enabled !== false && ICONS[l.type]);
  if (enabled.length === 0) return null;

  async function onShare() {
    try {
      if (navigator.share) await navigator.share({ title: tenant.name, url: shareUrl });
      else {
        await navigator.clipboard.writeText(shareUrl);
        setToast(t(locale, "linkCopied"));
        setTimeout(() => setToast(null), 1800);
      }
    } catch {
      /* user cancelled */
    }
  }

  const wifiLink = enabled.find((l) => l.type === "wifi") ?? null;

  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {enabled.map((l, i) => (
          <ActionButton
            key={`${l.type}-${i}`}
            link={l}
            tenant={tenant}
            tenantId={tenantId}
            locale={locale}
            accent={accent}
            onWifi={() => setWifiFor((cur) => (cur ? null : wifiLink))}
            onShare={onShare}
          />
        ))}
      </div>

      {wifiFor && (
        <div className="mt-2 rounded-card border border-line bg-surface p-3 text-sm">
          {wifiFor.ssid ? (
            <>
              <p className="text-ink"><span className="text-muted">Network:</span> {wifiFor.ssid}</p>
              {wifiFor.password && (
                <p className="text-ink"><span className="text-muted">Password:</span> {wifiFor.password}</p>
              )}
            </>
          ) : (
            <p className="text-muted">Ask our staff for the WiFi password.</p>
          )}
        </div>
      )}

      {toast && (
        <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-full bg-ink px-3 py-1 text-xs text-white">
          {toast}
        </div>
      )}
    </div>
  );
}
