import { createSupabaseBrowserClient } from './supabase/client';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export const isDev = process.env.NODE_ENV === 'development';

// Store the current access token so getIdToken() can return it immediately
// without relying on getSession() which may not be ready yet.
let currentAccessToken: string | null = null;

export async function signInWithGoogle(): Promise<AuthUser> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/feed`,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
  return { uid: '', email: null, displayName: null };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  currentAccessToken = data.session?.access_token ?? null;
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
  currentAccessToken = data.session?.access_token ?? null;
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName,
  };
}

export async function signOut(): Promise<void> {
  console.trace('[AUTH] signOut called');
  const supabase = createSupabaseBrowserClient();
  currentAccessToken = null;
  await supabase.auth.signOut();
}

export async function getIdToken(): Promise<string | null> {
  // Return the stored token if available (set by onAuthStateChange)
  if (currentAccessToken) return currentAccessToken;

  // Fallback: try to get from session
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export function onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
  const supabase = createSupabaseBrowserClient();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event: string, session: { access_token?: string; user: { id: string; email?: string; user_metadata?: Record<string, string> } } | null) => {
      console.log('[AUTH] onAuthStateChange:', event, 'session:', session ? 'YES' : 'NULL');
      // Always update the stored token
      currentAccessToken = session?.access_token ?? null;

      // Skip TOKEN_REFRESHED to avoid unnecessary re-renders
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
    },
  );
  return () => subscription.unsubscribe();
}

export async function devSignIn(): Promise<AuthUser> {
  if (!isDev) throw new Error('devSignIn only available in development');
  currentAccessToken = 'dev:test-supabase-uid';
  return {
    uid: 'test-supabase-uid',
    email: 'test@gourmet.dev',
    displayName: 'Test Gourmet',
  };
}
