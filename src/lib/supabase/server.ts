import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Supabase client (anon key, RLS-enforced) bound to the request cookies.
// Use in server components and server actions for the authenticated user's view.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // setAll can be called from a server component, where cookie writes throw.
          // The middleware refreshes the session, so this is safe to ignore there.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // no-op: called from a context that cannot set cookies
          }
        },
      },
    }
  );
}
