import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/feed';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // We need to create the response AFTER exchanging the code,
  // because the cookies must be set during the exchange.
  // Use a mutable cookies approach.
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookiesToSet.push(...cookies);
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback error:', error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  // Now create the redirect response and apply all collected cookies
  const response = NextResponse.redirect(`${origin}${next}`);
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options as Record<string, string>);
  }

  return response;
}
