import { useEffect } from 'react';
import { onAuthStateChanged, getIdToken, autoDevSignIn, shouldAutoSkipOnboarding } from './supabase';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/endpoints';

export function useAuthState() {
  const { setUser, setAccessToken, setLoading, setOnboarded, isAuthenticated, isLoading, user, hasOnboarded } =
    useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      if (authUser) {
        try {
          const token = await getIdToken();
          setAccessToken(token);

          // Register/upsert with backend
          const backendUser = await authApi.register();
          setUser(backendUser);

          // Skip onboarding in dev auto-login
          if (shouldAutoSkipOnboarding) {
            setOnboarded(true);
          }
        } catch (error) {
          console.error('Auth state sync failed:', error);
          setUser(null);
          setAccessToken(null);
        }
      } else {
        setUser(null);
        setAccessToken(null);
      }
      setLoading(false);
    });

    // Auto sign-in for development
    autoDevSignIn();

    return unsubscribe;
  }, [setUser, setAccessToken, setLoading]);

  return {
    isAuthenticated: !!isAuthenticated,
    isLoading: !!isLoading,
    user,
    hasOnboarded: !!hasOnboarded,
  };
}
