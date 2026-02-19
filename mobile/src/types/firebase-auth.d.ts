import { Persistence } from 'firebase/auth';

/**
 * Type augmentation for firebase/auth in React Native.
 *
 * Firebase v11+ only exposes getReactNativePersistence via the
 * react-native export condition, which TypeScript's type resolution
 * does not pick up even with customConditions. At runtime, Metro's
 * resolver correctly resolves the RN bundle.
 */
declare module 'firebase/auth' {
  interface ReactNativeAsyncStorage {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage,
  ): Persistence;
}
