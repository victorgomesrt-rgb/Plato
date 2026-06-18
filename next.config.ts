import type { NextConfig } from "next";
import path from "node:path";

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

export default nextConfig;
