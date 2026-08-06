// Next.js instrumentation hook. Loads the right Sentry init per runtime and forwards
// server-side request errors (RSC, route handlers, server actions) to Sentry.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
