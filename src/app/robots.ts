import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://platodigital.io";

// Index public menus + marketing; keep private surfaces out (architecture §25).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/api", "/auth"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
