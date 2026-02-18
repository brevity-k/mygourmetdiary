/**
 * Firebase auth abstraction.
 *
 * In development (__DEV__), this module provides a mock auth layer that
 * bypasses Firebase entirely and uses `dev:<uid>` tokens that the backend
 * accepts in development mode.
 *
 * In production, this will be replaced with real Firebase JS SDK calls.
 */

const DEV_AUTH_UID = 'test-firebase-uid';

type AuthStateCallback = (user: DevUser | null) => void;

interface DevUser {
  uid: string;
  email: string;
  displayName: string;
}

let currentDevUser: DevUser | null = null;
let authStateListeners: AuthStateCallback[] = [];

function notifyListeners() {
  authStateListeners.forEach((cb) => cb(currentDevUser));
}

/**
 * Sign in as the dev test user. Only works in __DEV__ mode.
 * The backend's FirebaseAuthGuard accepts `Bearer dev:<uid>` tokens.
 */
export async function devSignIn(): Promise<DevUser> {
  const user: DevUser = {
    uid: DEV_AUTH_UID,
    email: 'test@gourmet.dev',
    displayName: 'Test Gourmet',
  };
  currentDevUser = user;
  notifyListeners();
  return user;
}

export async function signOut(): Promise<void> {
  currentDevUser = null;
  notifyListeners();
}

export function getCurrentUser(): DevUser | null {
  return currentDevUser;
}

export async function getIdToken(): Promise<string | null> {
  if (!currentDevUser) return null;
  // The backend accepts `dev:<uid>` tokens in development mode
  return `dev:${currentDevUser.uid}`;
}

export function onAuthStateChanged(callback: AuthStateCallback): () => void {
  authStateListeners.push(callback);
  // Immediately fire with current state
  callback(currentDevUser);
  // Return unsubscribe function
  return () => {
    authStateListeners = authStateListeners.filter((cb) => cb !== callback);
  };
}

/**
 * Auto-sign-in for development. Called from useAuthState when __DEV__ is true.
 * Signs in automatically so developers don't need to tap buttons.
 */
/**
 * Auto-sign-in for development. Called from useAuthState when __DEV__ is true.
 * Also marks onboarding as complete to skip the carousel.
 */
export let shouldAutoSkipOnboarding = false;

export function autoDevSignIn(): void {
  if (__DEV__ && !currentDevUser) {
    shouldAutoSkipOnboarding = true;
    setTimeout(() => {
      devSignIn();
    }, 500);
  }
}
