'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function AuthDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [supabase] = useState(() =>
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { flowType: 'implicit', persistSession: true, detectSessionInUrl: true } },
    ),
  );

  const log = (msg: string) => {
    console.log('[AUTH-DEBUG]', msg);
    setLogs((prev) => [...prev, `${new Date().toISOString().slice(11, 19)} ${msg}`]);
  };

  useEffect(() => {
    log('Page loaded. URL hash: ' + (window.location.hash ? 'YES (' + window.location.hash.substring(0, 50) + '...)' : 'NONE'));

    const lsKey = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0]}-auth-token`;
    const stored = localStorage.getItem(lsKey);
    log('localStorage session: ' + (stored ? 'EXISTS' : 'NONE'));

    supabase.auth.getSession().then(({ data, error }) => {
      log('getSession: ' + (error ? 'ERROR: ' + error.message : data.session ? 'HAS SESSION (user: ' + data.session.user.email + ')' : 'NO SESSION'));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: unknown) => {
      const s = session as { user?: { email?: string }; access_token?: string } | null;
      log(`onAuthStateChange: event=${event} session=${s ? 'YES (user: ' + s.user?.email + ', token: ' + (s.access_token ? 'yes' : 'no') + ')' : 'null'}`);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleGoogleLogin = async () => {
    log('Starting Google OAuth (implicit flow)...');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth-debug',
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) log('signInWithOAuth ERROR: ' + error.message);
    else log('Redirecting to Google...');
  };

  const handleTestApi = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    log('Token for API: ' + (token ? token.substring(0, 20) + '...' : 'NULL'));
    if (token) {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      log('Register: ' + res.status + ' ' + JSON.stringify(body).substring(0, 100));
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 14 }}>
      <h1>Auth Debug</h1>
      <button onClick={handleGoogleLogin} style={{ padding: '10px 20px', marginRight: 10 }}>
        Sign in with Google
      </button>
      <button onClick={handleTestApi} style={{ padding: '10px 20px' }}>
        Test API Call
      </button>
      <pre style={{ marginTop: 20, background: '#111', color: '#0f0', padding: 15, borderRadius: 8, maxHeight: 400, overflow: 'auto' }}>
        {logs.join('\n') || 'No logs yet. Click "Sign in with Google" to start.'}
      </pre>
    </div>
  );
}
