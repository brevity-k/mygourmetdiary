import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
  browserLocalPersistence,
  setPersistence,
  type User as FirebaseUser,
  type Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

// Lazy initialization to avoid SSR issues
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseApp());
  setPersistence(_auth, browserLocalPersistence);
  return _auth;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

function toAuthUser(user: FirebaseUser): AuthUser {
  return { uid: user.uid, email: user.email, displayName: user.displayName };
}

export async function signInWithGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(getFirebaseAuth(), provider);
  return toAuthUser(result.user);
}

export async function signInWithApple(): Promise<AuthUser> {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  const result = await signInWithPopup(getFirebaseAuth(), provider);
  return toAuthUser(result.user);
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return toAuthUser(result.user);
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<AuthUser> {
  const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  await updateProfile(result.user, { displayName });
  return toAuthUser(result.user);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
}

export async function getIdToken(): Promise<string | null> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export function onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
  return firebaseOnAuthStateChanged(getFirebaseAuth(), (firebaseUser) => {
    callback(firebaseUser ? toAuthUser(firebaseUser) : null);
  });
}

// Dev mode helper
export const isDev = process.env.NODE_ENV === 'development';

export async function devSignIn(): Promise<AuthUser> {
  if (!isDev) throw new Error('devSignIn only available in development');
  return {
    uid: 'test-firebase-uid',
    email: 'test@gourmet.dev',
    displayName: 'Test Gourmet',
  };
}
