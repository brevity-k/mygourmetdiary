/**
 * Firebase auth abstraction.
 *
 * In development (__DEV__), provides a mock auth layer that bypasses Firebase
 * entirely and uses `dev:<uid>` tokens the backend accepts in dev mode.
 *
 * In production, uses the real Firebase JS SDK.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// ── Firebase config ──────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Use initializeAuth on first load, getAuth on hot reload
let auth: ReturnType<typeof initializeAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  auth = getAuth(app) as ReturnType<typeof initializeAuth>;
}

// ── Shared types ─────────────────────────────────────────────────────
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

type AuthStateCallback = (user: AuthUser | null) => void;

// ── Dev-mode mock (unchanged from before) ────────────────────────────
const DEV_AUTH_UID = 'test-firebase-uid';
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
  if (__DEV__ && !currentDevUser) {
    shouldAutoSkipOnboarding = true;
    setTimeout(() => {
      devSignIn();
    }, 500);
  }
}

// ── Production auth functions ────────────────────────────────────────

export async function signInWithGoogle(idToken: string): Promise<AuthUser> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return firebaseUserToAuthUser(result.user);
}

export async function signInWithApple(
  identityToken: string,
  nonce: string,
): Promise<AuthUser> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: identityToken, rawNonce: nonce });
  const result = await signInWithCredential(auth, credential);
  return firebaseUserToAuthUser(result.user);
}

export async function signOut(): Promise<void> {
  if (__DEV__) {
    currentDevUser = null;
    notifyDevListeners();
    return;
  }
  await firebaseSignOut(auth);
}

export async function getIdToken(): Promise<string | null> {
  if (__DEV__) {
    if (!currentDevUser) return null;
    return `dev:${currentDevUser.uid}`;
  }
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export function onAuthStateChanged(callback: AuthStateCallback): () => void {
  if (__DEV__) {
    authStateListeners.push(callback);
    callback(currentDevUser);
    return () => {
      authStateListeners = authStateListeners.filter((cb) => cb !== callback);
    };
  }

  return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
    callback(firebaseUser ? firebaseUserToAuthUser(firebaseUser) : null);
  });
}

// ── Helpers ──────────────────────────────────────────────────────────

function firebaseUserToAuthUser(user: FirebaseUser): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
}
