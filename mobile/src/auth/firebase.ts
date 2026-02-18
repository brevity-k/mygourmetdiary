import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

export const firebaseAuth = auth();

export const signInWithCredential = (credential: FirebaseAuthTypes.AuthCredential) =>
  firebaseAuth.signInWithCredential(credential);

export const signOut = () => firebaseAuth.signOut();

export const getCurrentUser = () => firebaseAuth.currentUser;

export const getIdToken = async (): Promise<string | null> => {
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

export const onAuthStateChanged = (callback: (user: FirebaseAuthTypes.User | null) => void) =>
  firebaseAuth.onAuthStateChanged(callback);
