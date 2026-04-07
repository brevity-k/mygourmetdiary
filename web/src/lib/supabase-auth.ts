import { createSupabaseBrowserClient } from './supabase/client';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export const isDev = process.env.NODE_ENV === 'development';

export async function signInWithGoogle(): Promise<AuthUser> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw error;
  // OAuth redirects — this won't return normally.
  // The user will land on /auth/callback which exchanges the code.
  // Return a placeholder; the actual user is set via onAuthStateChanged.
  return { uid: '', email: null, displayName: null };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const user = data.user;
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
  };
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<AuthUser> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: displayName } },
  });
  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error('Sign up failed');
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName,
  };
}

export async function signOut(): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
}

export async function getIdToken(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export function onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
  const supabase = createSupabaseBrowserClient();

  // onAuthStateChange fires INITIAL_SESSION on subscribe (Supabase v2),
  // then SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED on subsequent changes.
  // No need for a separate getSession() call.
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    // Skip TOKEN_REFRESHED — session user hasn't changed, avoid unnecessary re-renders
    if (event === 'TOKEN_REFRESHED') return;

    if (session?.user) {
      callback({
        uid: session.user.id,
        email: session.user.email ?? null,
        displayName: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? null,
      });
    } else {
      callback(null);
    }
  });
  return () => subscription.unsubscribe();
}

export async function devSignIn(): Promise<AuthUser> {
  if (!isDev) throw new Error('devSignIn only available in development');
  return {
    uid: 'test-supabase-uid',
    email: 'test@gourmet.dev',
    displayName: 'Test Gourmet',
  };
}
