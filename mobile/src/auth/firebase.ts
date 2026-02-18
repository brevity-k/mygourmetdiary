/**
 * Firebase auth abstraction.
 *
 * In development (__DEV__), provides a mock auth layer that bypasses Firebase
 * entirely and uses `dev:<uid>` tokens the backend accepts in dev mode.
 *
 * In production, uses the real Firebase JS SDK.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';

// ── Firebase config ──────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'REDACTED_FIREBASE_API_KEY',
  authDomain: 'REDACTED_FIREBASE_AUTH_DOMAIN',
  projectId: 'mygourmetdiary-653f1',
  storageBucket: 'REDACTED_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'REDACTED_FIREBASE_SENDER_ID',
  appId: 'REDACTED_FIREBASE_APP_ID',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
