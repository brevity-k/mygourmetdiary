import { useEffect } from 'react';
import { onAuthStateChanged, getIdToken } from './firebase';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/endpoints';

export function useAuthState() {
  const { setUser, setFirebaseToken, setLoading, isAuthenticated, isLoading, user, hasOnboarded } =
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

    return unsubscribe;
  }, [setUser, setFirebaseToken, setLoading]);

  return { isAuthenticated, isLoading, user, hasOnboarded };
}
