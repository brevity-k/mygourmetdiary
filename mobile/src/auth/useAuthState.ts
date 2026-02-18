import { useEffect } from 'react';
import { onAuthStateChanged, getIdToken, autoDevSignIn, shouldAutoSkipOnboarding } from './firebase';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/endpoints';

export function useAuthState() {
  const { setUser, setFirebaseToken, setLoading, setOnboarded, isAuthenticated, isLoading, user, hasOnboarded } =
    useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await getIdToken();
          setFirebaseToken(token);

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
          setFirebaseToken(null);
        }
      } else {
        setUser(null);
        setFirebaseToken(null);
      }
      setLoading(false);
    });

    // Auto sign-in for development
    autoDevSignIn();

    return unsubscribe;
  }, [setUser, setFirebaseToken, setLoading]);

  return {
    isAuthenticated: !!isAuthenticated,
    isLoading: !!isLoading,
    user,
    hasOnboarded: !!hasOnboarded,
  };
}
