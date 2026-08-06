// Sentry init for the browser. Runs on every page including the public diner menu, so it's
// kept lean (no Session Replay) to protect the mobile bundle. No DSN → no-op.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === "production",
  sendDefaultPii: false,
});

// Instruments client-side navigations (App Router) for performance tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
