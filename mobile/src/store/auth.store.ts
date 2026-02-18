import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthState {
  user: User | null;
  firebaseToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasOnboarded: boolean;
  setUser: (user: User | null) => void;
  setFirebaseToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      firebaseToken: null,
      isAuthenticated: false,
      isLoading: true,
      hasOnboarded: false,
      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),
      setFirebaseToken: (firebaseToken) =>
        set({ firebaseToken }),
      setLoading: (isLoading) =>
        set({ isLoading }),
      setOnboarded: (hasOnboarded) =>
        set({ hasOnboarded }),
      logout: () =>
        set({
          user: null,
          firebaseToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasOnboarded: state.hasOnboarded,
      }),
    },
  ),
);
