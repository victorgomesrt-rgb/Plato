"use client";

import { useState } from "react";
import {
  MapPin, Phone, MessageCircle, Globe, CalendarCheck, ShoppingBag, Mail,
  Camera, ThumbsUp, Star, FileText, Wifi, Share2, Music2, type LucideIcon,
} from "lucide-react";
import { t } from "@/lib/i18n";
import type { TenantLink } from "@/lib/tenant";

// lucide dropped trademarked brand glyphs, so social uses neutral icons; the label
// text still names the network.
const ICONS: Record<string, LucideIcon> = {
  directions: MapPin, call: Phone, whatsapp: MessageCircle, website: Globe,
  reserve: CalendarCheck, order: ShoppingBag, email: Mail, instagram: Camera,
  tiktok: Music2, facebook: ThumbsUp, reviews: Star, menu_pdf: FileText,
  wifi: Wifi, share: Share2,
};

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

const BTN = "flex min-w-[64px] flex-col items-center gap-1 rounded-btn px-3 py-2 text-xs font-medium text-ink";

function ActionButton({
  link,
  tenant,
  locale,
  accent,
  onWifi,
  onShare,
}: {
  link: TenantLink;
  tenant: TenantBits;
  locale: string;
  accent: string;
  onWifi: () => void;
  onShare: () => void;
}) {
  const Icon = ICONS[link.type];
  const label = link.label || t(locale, link.type);
  const inner = (
    <>
      <Icon className="h-5 w-5" style={{ color: accent }} aria-hidden />
      <span>{label}</span>
    </>
  );

  if (link.type === "wifi")
    return (
      <button className={BTN} onClick={onWifi}>
        {inner}
      </button>
    );
  if (link.type === "share")
    return (
      <button className={BTN} onClick={onShare}>
        {inner}
      </button>
    );

  const href = hrefFor(link, tenant);
  if (!href) return null;
  return (
    <a className={BTN} href={href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  );
}

export function ActionBar({
  links,
  tenant,
  locale,
  shareUrl,
  accent,
}: {
  links: TenantLink[];
  tenant: TenantBits;
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
      <div className="flex gap-1 overflow-x-auto pb-1">
        {enabled.map((l, i) => (
          <ActionButton
            key={`${l.type}-${i}`}
            link={l}
            tenant={tenant}
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
              <p className="text-ink">
                <span className="text-muted">Network:</span> {wifiFor.ssid}
              </p>
              {wifiFor.password && (
                <p className="text-ink">
                  <span className="text-muted">Password:</span> {wifiFor.password}
                </p>
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
