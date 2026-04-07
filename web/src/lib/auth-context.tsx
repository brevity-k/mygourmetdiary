'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@mygourmetdiary/shared-types';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type AuthUser,
  isDev,
  devSignIn,
} from './supabase-auth';
import { authApi, usersApi, setOnUnauthorized } from './api';

interface AuthContextValue {
  firebaseUser: AuthUser | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  devLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
  devLogin: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const signOut = useCallback(async () => {
    if (isDev) {
      sessionStorage.removeItem('dev_token');
    }
    await firebaseSignOut();
    setFirebaseUser(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  // Only trigger signOut on 401 if user was previously authenticated.
  // During initial OAuth flow, 401s are expected (token not ready yet).
  const isAuthenticatedRef = React.useRef(false);
  useEffect(() => {
    setOnUnauthorized(() => {
      if (isAuthenticatedRef.current) {
        signOut();
      }
    });
  }, [signOut]);

  const registerAndFetchUser = useCallback(async () => {
    // Wait for the token to be available before making API calls
    const { getIdToken } = await import('./supabase-auth');
    let token: string | null = null;
    for (let i = 0; i < 10; i++) {
      token = await getIdToken();
      if (token) break;
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!token) {
      console.warn('No auth token available after waiting');
      return null;
    }

    try {
      const registeredUser = await authApi.register();
      setUser(registeredUser);
      isAuthenticatedRef.current = true;
      return registeredUser;
    } catch (registerErr) {
      console.warn('Auth register failed, trying getMe:', registerErr);
      try {
        const existingUser = await usersApi.getMe();
        setUser(existingUser);
        isAuthenticatedRef.current = true;
        return existingUser;
      } catch (getMeErr) {
        console.warn('Failed to fetch existing user:', getMeErr);
        return null;
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await usersApi.getMe();
      setUser(u);
    } catch (err) {
      console.warn('Failed to refresh user:', err);
    }
  }, []);

  // Listen for Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      setFirebaseUser(authUser);
      if (authUser) {
        await registerAndFetchUser();
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [registerAndFetchUser]);

  // Check for dev token on mount
  useEffect(() => {
    if (isDev && typeof window !== 'undefined') {
      const devToken = sessionStorage.getItem('dev_token');
      if (devToken && !firebaseUser) {
        setFirebaseUser({ uid: 'test-supabase-uid', email: 'test@gourmet.dev', displayName: 'Test Gourmet' });
        registerAndFetchUser().then(() => setLoading(false));
      }
    }
  }, [firebaseUser, registerAndFetchUser]);

  const devLogin = useCallback(async () => {
    const authUser = await devSignIn();
    sessionStorage.setItem('dev_token', `dev:${authUser.uid}`);
    setFirebaseUser(authUser);
    await registerAndFetchUser();
  }, [registerAndFetchUser]);

  // Route protection
  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/onboarding');
    const isAuthenticated = !!firebaseUser;

    if (!isAuthenticated && !isAuthRoute) {
      router.push('/login');
    } else if (isAuthenticated && user && isAuthRoute && pathname !== '/onboarding') {
      router.push('/feed');
    } else if (isAuthenticated && user && !user.displayName && pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [loading, firebaseUser, user, pathname, router]);

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading, signOut, refreshUser, devLogin }}>
      {children}
    </AuthContext.Provider>
  );
}
