import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { passShareUrl } from "@/lib/passbuddy";

// Tracked "Add to Apple Wallet" redirect (cookieless, no PII): logs one tap, then
// 307s to the PassBuddy share page. The tap count is the Plato Card members proxy.
export async function GET(req: NextRequest) {
  const svc = createAdminClient();
  const { data: pass } = await svc.from("wallet_passes").select("share_id").eq("kind", "plato_card").maybeSingle();
  const shareId = (pass as { share_id: string } | null)?.share_id;
  if (!shareId) return NextResponse.redirect(new URL("/card", req.url), 307);

  await svc.from("wallet_card_adds").insert({});
  return NextResponse.redirect(passShareUrl(shareId), 307);
}
