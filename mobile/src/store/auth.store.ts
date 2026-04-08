import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasOnboarded: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      hasOnboarded: false,
      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),
      setAccessToken: (accessToken) =>
        set({ accessToken }),
      setLoading: (isLoading) =>
        set({ isLoading }),
      setOnboarded: (hasOnboarded) =>
        set({ hasOnboarded }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasOnboarded: state.hasOnboarded,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<AuthState>),
        // Ensure boolean type after rehydration from AsyncStorage
        hasOnboarded: Boolean((persisted as any)?.hasOnboarded),
      }),
    },
  ),
);
