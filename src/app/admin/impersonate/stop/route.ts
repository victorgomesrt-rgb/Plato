import { NextResponse, type NextRequest } from "next/server";
import { IMP_COOKIE } from "@/lib/dashboard-context";

// Stop impersonation: clear the cookie, return to the admin console via a clean GET.
export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin", req.url), 303);
  res.cookies.delete(IMP_COOKIE);
  return res;
}
