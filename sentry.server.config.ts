// Sentry init for the Node.js server runtime (RSC, server actions, route handlers).
// Loaded by src/instrumentation.ts. No DSN → the SDK is a no-op, so local dev and any
// environment without NEXT_PUBLIC_SENTRY_DSN stays silent.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Performance tracing: sample 10% of transactions (bump if you need more detail).
  tracesSampleRate: 0.1,
  // Don't send events in development even if a DSN is present locally.
  enabled: process.env.NODE_ENV === "production",
  sendDefaultPii: false,
});
