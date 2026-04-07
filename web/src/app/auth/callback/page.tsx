'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // The browser client will automatically detect the ?code= param
    // and exchange it for a session, storing it in cookies.
    supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        router.replace('/feed');
      }
    });

    // Also try explicit code exchange as fallback
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }: { error: Error | null }) => {
        if (error) {
          console.error('Code exchange failed:', error.message);
          router.replace('/login?error=auth_callback_failed');
        }
        // onAuthStateChange will handle the redirect
      });
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing in...</p>
    </div>
  );
}
