import "server-only";
import { createAdminClient } from "./supabase/admin";

// Minimal tenant shape for routing + the public page. Full generated DB types come later.
export type Tenant = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  accent_color: string | null;
  custom_domain: string | null;
  base_currency: string;
  fx_rate: number;
  dual_currency: boolean;
  template: string;
  default_locale: string;
  locales: string[];
  status: string;
  published_at: string | null;
  previous_slug: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  hours: Record<string, [string, string] | null> | null;
  links: TenantLink[] | null;
  wallet_partner: boolean | null;
  review_only: boolean | null;
};

export type TenantLink = {
  type: string;
  url?: string;
  enabled?: boolean;
  label?: string;
  ssid?: string;
  password?: string;
};

const TENANT_COLS =
  "id, slug, name, description, logo_url, cover_url, accent_color, custom_domain, base_currency, fx_rate, dual_currency, template, default_locale, locales, status, published_at, previous_slug, address, lat, lng, phone, whatsapp, hours, links, wallet_partner, review_only";

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select(TENANT_COLS)
    .eq("slug", slug.toLowerCase())
    .maybeSingle();
  return (data as Tenant) ?? null;
}

export async function getTenantByPreviousSlug(slug: string): Promise<Tenant | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select(TENANT_COLS)
    .eq("previous_slug", slug.toLowerCase())
    .maybeSingle();
  return (data as Tenant) ?? null;
}

export async function getTenantByCustomDomain(host: string): Promise<Tenant | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select(TENANT_COLS)
    .eq("custom_domain", host.toLowerCase())
    .maybeSingle();
  return (data as Tenant) ?? null;
}

// Publish gate, docs/architecture.md §6 / CLAUDE.md.
// Public only when published_at is set and status is not suspended/canceled.
// Building tenants 404. past_due stays live (short grace window).
export type PublicState = "ok" | "not_found" | "unavailable";

export function publicState(tenant: Tenant | null): PublicState {
  if (!tenant) return "not_found";
  if (tenant.review_only) return "not_found"; // review-only clients have no public menu page
  if (tenant.status === "suspended" || tenant.status === "canceled") return "unavailable";
  if (!tenant.published_at || tenant.status === "building") return "not_found";
  return "ok";
}
