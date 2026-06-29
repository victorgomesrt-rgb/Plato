// Reserved slugs and slug validation, see docs/architecture.md §2.
// Tenant pages share the root path, so no restaurant may take a slug that collides
// with a real route. Enforced at signup and on slug change (M3) and respected in routing.

export const RESERVED_SLUGS = new Set<string>([
  "dashboard",
  "admin",
  "api",
  "login",
  "signup",
  "logout",
  "auth",
  "pricing",
  "about",
  "contact",
  "terms",
  "privacy",
  "blog",
  "help",
  "support",
  "discover",
  "app",
  "www",
  "static",
  "assets",
  "favicon",
  "robots",
  "sitemap",
  "q", // tracked QR redirect
  "t", // tracked NFC redirect
  "r", // gated review-card redirect
  "review-unavailable", // review-card paused page
]);

// Hosts served as the application itself (marketing, dashboard, admin), not tenant
// custom domains. Anything else on a request is treated as a custom domain.
export const APP_HOSTS = new Set<string>([
  "platodigital.io",
  "www.platodigital.io",
  "localhost",
  "127.0.0.1",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

// lowercase letters, numbers, hyphens; no leading/trailing hyphen (mirrors the DB check)
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug);
}

export function isAppHost(host: string): boolean {
  const h = host.split(":")[0].toLowerCase();
  return APP_HOSTS.has(h) || h.endsWith(".vercel.app");
}
