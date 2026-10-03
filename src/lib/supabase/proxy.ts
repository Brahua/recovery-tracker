import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  let response = NextResponse.next({ request });

  if (!env) {
    return response;
  }

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const cookie of cookiesToSet) {
          request.cookies.set(cookie.name, cookie.value);
        }

        // Rebuild the response so the page rendered in this same request reads the refreshed
        // tokens too; otherwise it would refresh again with a refresh token already rotated.
        response = NextResponse.next({ request });

        for (const cookie of cookiesToSet) {
          response.cookies.set(cookie.name, cookie.value, cookie.options);
        }

        // Responses that set auth cookies must never be cached.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  await supabase.auth.getClaims();

  return response;
}
