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

  // Cookieless session: a daily-rotating hash of coarse signals. Only the hash is stored.
  const ip = (req.headers.get("x-forwarded-for") ?? "0").split(",")[0].trim();
  const salt = process.env.ANALYTICS_SALT ?? "plato";
  const session_id = crypto
    .createHash("sha256")
    .update(`${ip}|${ua}|${arubaDate()}|${salt}`)
    .digest("hex")
    .slice(0, 32);

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
