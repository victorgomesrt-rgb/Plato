import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Public-page events insert here via the service role (architecture §17). Cookieless,
// no personal data stored, obvious bots filtered. qr_scan/nfc_tap are NOT accepted here
// (those are written by the /q and /t redirect routes) so clients can't spoof scans.
const ALLOWED = new Set([
  "page_view",
  "item_view",
  "video_play",
  "directions_click",
  "call_click",
  "link_click",
]);

const BOT =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|pinterest|telegrambot|headless|lighthouse|inspectiontool|curl|wget/i;

// In-memory rate limit (this route runs on the Node runtime, so module state persists
// across requests on a warm instance). Best-effort per-instance; stops casual inflation
// of a real tenant's analytics without penalising real diners on shared venue WiFi.
const WINDOW_MS = 60_000;
const IP_LIMIT = 1000; // generous: a busy venue's shared IP can carry many diners/min
const SESSION_LIMIT = 200; // one human can't legitimately exceed this in a minute
const ipHits = new Map<string, { n: number; reset: number }>();
const sessionHits = new Map<string, { n: number; reset: number }>();

function overLimit(map: Map<string, { n: number; reset: number }>, key: string, limit: number): boolean {
  const now = Date.now();
  if (map.size > 10_000) for (const [k, v] of map) if (now > v.reset) map.delete(k); // bound memory
  const e = map.get(key);
  if (!e || now > e.reset) { map.set(key, { n: 1, reset: now + WINDOW_MS }); return false; }
  e.n++;
  return e.n > limit;
}

function arubaDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba" }).format(new Date());
}

export async function POST(req: NextRequest) {
  let body: { tenant_id?: string; event_type?: string; item_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const { tenant_id, event_type, item_id } = body;
  if (!tenant_id || !event_type || !ALLOWED.has(event_type)) {
    return new NextResponse(null, { status: 204 });
  }

  const ua = req.headers.get("user-agent") ?? "";
  if (BOT.test(ua)) return new NextResponse(null, { status: 204 });

  const ip = (req.headers.get("x-forwarded-for") ?? "0").split(",")[0].trim();
  if (overLimit(ipHits, ip, IP_LIMIT)) return new NextResponse(null, { status: 204 });

  // Cookieless session: a daily-rotating hash of coarse signals. Only the hash is stored.
  const salt = process.env.ANALYTICS_SALT ?? "plato";
  const session_id = crypto
    .createHash("sha256")
    .update(`${ip}|${ua}|${arubaDate()}|${salt}`)
    .digest("hex")
    .slice(0, 32);
  if (overLimit(sessionHits, session_id, SESSION_LIMIT)) return new NextResponse(null, { status: 204 });

  const svc = createAdminClient();
  await svc.from("analytics_events").insert({
    tenant_id,
    item_id: item_id ?? null,
    event_type,
    session_id,
    referrer: req.headers.get("referer"),
  });

  return new NextResponse(null, { status: 204 });
}
