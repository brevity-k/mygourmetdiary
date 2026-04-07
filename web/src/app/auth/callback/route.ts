import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/feed';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // Create response first — a simple HTML page that redirects client-side.
  // This ensures cookies are fully set before the browser navigates away.
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${next}"><script>window.location.href="${next}"</script></head><body>Redirecting...</body></html>`;
  const response = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              // Ensure cookies are NOT HttpOnly so browser client can read them
              httpOnly: false,
            });
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback error:', error.message);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  return response;
}
