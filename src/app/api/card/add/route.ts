import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { passShareUrl } from "@/lib/passbuddy";

// Tracked "Add to Apple Wallet" redirect (cookieless, no PII): logs one tap, then
// 307s to the PassBuddy share page. The tap count is the Plato Card members proxy.
const BOT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|slack|discord|headless|lighthouse|curl|wget/i;
const WINDOW_MS = 60_000;
const IP_LIMIT = 10; // a real person taps "Add" a few times/min at most
const hits = new Map<string, { n: number; reset: number }>();
function overLimit(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 10_000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
  const e = hits.get(ip);
  if (!e || now > e.reset) { hits.set(ip, { n: 1, reset: now + WINDOW_MS }); return false; }
  e.n++;
  return e.n > IP_LIMIT;
}

export async function GET(req: NextRequest) {
  const svc = createAdminClient();
  const { data: pass } = await svc.from("wallet_passes").select("share_id").eq("kind", "plato_card").maybeSingle();
  const shareId = (pass as { share_id: string } | null)?.share_id;
  if (!shareId) return NextResponse.redirect(new URL("/card", req.url), 307);

  // Only count genuine taps: skip link-preview/unfurl bots and throttle floods so the
  // members proxy can't be inflated. Real users are redirected to Wallet either way.
  const ua = req.headers.get("user-agent") ?? "";
  const ip = (req.headers.get("x-forwarded-for") ?? "0").split(",")[0].trim();
  if (!BOT.test(ua) && !overLimit(ip)) {
    await svc.from("wallet_card_adds").insert({});
  }
  return NextResponse.redirect(passShareUrl(shareId), 307);
}
