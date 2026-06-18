import { type NextRequest } from "next/server";
import { trackRedirect } from "@/lib/track";

// NFC taps land here, get counted, then redirect to the menu.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return trackRedirect(code, "nfc_tap");
}
