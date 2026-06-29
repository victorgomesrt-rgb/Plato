import { type NextRequest } from "next/server";
import { reviewRedirect } from "@/lib/track";

// Review Card scans/taps land here, get payment-gated + counted, then redirect to the
// restaurant's Google review page (or the paused page if the card isn't active/paid).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return reviewRedirect(code);
}
