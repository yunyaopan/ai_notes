import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token = requestUrl.searchParams.get("token");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/";

  const supabase = await createClient();

  if (code) {
    // Exchange code for session (PKCE flow)
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Code exchange error:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/error?error=${encodeURIComponent(error.message)}`
      );
    }
  } else if (token && type) {
    // Verify OTP token (email verification flow)
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: type as any,
    });
    if (error) {
      console.error("OTP verification error:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/error?error=${encodeURIComponent(error.message)}`
      );
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}

