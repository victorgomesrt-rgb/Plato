import type { NextConfig } from "next";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in the home dir otherwise confuses detection.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Native / heavy modules used only on the server — don't bundle them.
  serverExternalPackages: ["sharp", "heic-convert"],
  images: {
    // Bunny poster frames + Supabase Storage images are remote.
    remotePatterns: [
      { protocol: "https", hostname: "**.b-cdn.net" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

// Wrap with Sentry: uploads source maps at build time when SENTRY_AUTH_TOKEN / SENTRY_ORG /
// SENTRY_PROJECT are set (read from env by the plugin), and no-ops gracefully without them.
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI, // only log during CI builds
  widenClientFileUpload: true, // better stack traces for bundled client code
  telemetry: false,
});
