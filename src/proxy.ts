import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAppHost } from "@/lib/reserved-slugs";
import { getTenantByCustomDomain } from "@/lib/tenant";

// Path- and host-based routing (docs/architecture.md §2) + Supabase session refresh.
// - Custom domains resolve by host and rewrite to the tenant's /[slug] page.
// - On the app domain, real routes (/dashboard, /admin, /login, /api, …) take
//   precedence via the App Router; any other first segment falls through to /[slug].
export async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();

  // Custom-domain → rewrite root traffic onto the mapped tenant's menu.
  let rewriteTo: URL | null = null;
  if (!isAppHost(host)) {
    const tenant = await getTenantByCustomDomain(host);
    if (tenant && !nextUrl.pathname.startsWith(`/${tenant.slug}`)) {
      const url = nextUrl.clone();
      url.pathname = `/${tenant.slug}${nextUrl.pathname === "/" ? "" : nextUrl.pathname}`;
      rewriteTo = url;
    }
  }

  const build = () =>
    rewriteTo
      ? NextResponse.rewrite(rewriteTo, { request })
      : NextResponse.next({ request });

  let response = build();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = build();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the auth cookie if needed. Do not run logic between this and the response.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on everything except Next internals and static asset files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
