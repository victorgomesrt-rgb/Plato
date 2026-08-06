// Sentry init for the Edge runtime (proxy.ts / any edge route). Loaded by
// src/instrumentation.ts. No DSN → no-op.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === "production",
  sendDefaultPii: false,
});
