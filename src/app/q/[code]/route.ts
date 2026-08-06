import { type NextRequest } from "next/server";
import { trackRedirect } from "@/lib/track";

// QR scans land here, get counted, then redirect to the menu.
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return trackRedirect(code, "qr_scan", req.headers.get("user-agent") ?? "");
}
