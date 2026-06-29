import { NextResponse, type NextRequest } from "next/server";
import { overdueInvoiceIds, remindInvoice, applyDunning } from "@/lib/billing";

// Scheduled by Vercel Cron (see vercel.json). Sends reminders for sent-but-overdue
// invoices, then applies dunning (overdue tenants -> past_due, recovered ones -> active).
// Protected by CRON_SECRET so only the scheduler (or you) can trigger it.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const qs = request.nextUrl.searchParams.get("secret");
  if (!secret || (auth !== `Bearer ${secret}` && qs !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ids = await overdueInvoiceIds();
  let sent = 0;
  for (const id of ids) {
    const r = await remindInvoice(id);
    if (r.ok) sent++;
  }
  const dunning = await applyDunning();
  return NextResponse.json({ overdue: ids.length, reminded: sent, ...dunning });
}
