import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/supabase/urls";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const providerError = searchParams.get("error");
  let next = searchParams.get("next") ?? "/";

  if (!next.startsWith("/")) {
    next = "/";
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${await getRequestOrigin()}${next}`);
    }

    console.error(
      `Supabase OAuth code exchange failed: ${JSON.stringify({
        code: error.code,
        message: error.message,
        status: error.status,
      })}`,
    );

    return NextResponse.redirect(
      `${await getRequestOrigin()}/auth/auth-code-error?reason=exchange_failed`,
    );
  }

  if (providerError) {
    console.error(
      `OAuth provider rejected the request: ${JSON.stringify({
        error: providerError,
        errorCode: searchParams.get("error_code"),
        errorDescription: searchParams.get("error_description"),
      })}`,
    );
  }

  const reason = providerError ? "provider_rejected" : "missing_code";
  return NextResponse.redirect(
    `${await getRequestOrigin()}/auth/auth-code-error?reason=${reason}`,
  );
}
