/**
 * Supabase auth abstraction.
 *
 * In development (__DEV__), provides a mock auth layer that bypasses Supabase
 * entirely and uses `dev:<uid>` tokens the backend accepts in dev mode.
 *
 * In production, uses the real Supabase JS SDK.
 */

import { supabase } from '../lib/supabase';

// Store the current access token from onAuthStateChange
let currentAccessToken: string | null = null;

// ── Shared types ─────────────────────────────────────────────────────
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

type AuthStateCallback = (user: AuthUser | null) => void;

// ── Dev-mode mock ────────────────────────────────────────────────────
const DEV_AUTH_UID = 'test-supabase-uid';
let currentDevUser: AuthUser | null = null;
let authStateListeners: AuthStateCallback[] = [];

function notifyDevListeners() {
  authStateListeners.forEach((cb) => cb(currentDevUser));
}

export async function devSignIn(): Promise<AuthUser> {
  const user: AuthUser = {
    uid: DEV_AUTH_UID,
    email: 'test@gourmet.dev',
    displayName: 'Test Gourmet',
  };
  currentDevUser = user;
  notifyDevListeners();
  return user;
}

export let shouldAutoSkipOnboarding = false;

export function autoDevSignIn(): void {
  // Disabled — use real Google sign-in even in dev mode
  // since the API is on production Vercel (no dev token support)
}

// ── Production auth functions ────────────────────────────────────────

export async function signInWithGoogle(idToken: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw error;
  const user = data.user;
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName:
      user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
  };
}

export async function signInWithApple(
  identityToken: string,
  nonce: string,
): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: identityToken,
    nonce,
  });
  if (error) throw error;
  const user = data.user;
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName:
      user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
  };
}

export async function signOut(): Promise<void> {
  if (__DEV__) {
    currentDevUser = null;
    notifyDevListeners();
    return;
  }
  currentAccessToken = null;
  await supabase.auth.signOut();
}

export async function getIdToken(): Promise<string | null> {
  if (__DEV__) {
    if (!currentDevUser) return null;
    return `dev:${currentDevUser.uid}`;
  }
  // Return stored token from onAuthStateChange (available immediately)
  if (currentAccessToken) return currentAccessToken;
  // Fallback: try getSession
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export function onAuthStateChanged(callback: AuthStateCallback): () => void {
  if (__DEV__) {
    authStateListeners.push(callback);
    callback(currentDevUser);
    return () => {
      authStateListeners = authStateListeners.filter((cb) => cb !== callback);
    };
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    // Store token immediately so getIdToken() can return it
    currentAccessToken = session?.access_token ?? null;
    if (session?.user) {
      callback({
        uid: session.user.id,
        email: session.user.email ?? null,
        displayName:
          session.user.user_metadata?.full_name ??
          session.user.user_metadata?.name ??
          null,
      });
    } else {
      callback(null);
    }
  });
  return () => subscription.unsubscribe();
}
