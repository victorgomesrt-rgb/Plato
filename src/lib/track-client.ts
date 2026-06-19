// Fire-and-forget cookieless event beacon from the public page. Never blocks navigation.
export function track(tenantId: string, eventType: string, itemId?: string) {
  if (typeof navigator === "undefined") return;
  try {
    const payload = JSON.stringify({ tenant_id: tenantId, event_type: eventType, item_id: itemId });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    } else {
      void fetch("/api/track", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      });
    }
  } catch {
    /* analytics must never break the page */
  }
}
