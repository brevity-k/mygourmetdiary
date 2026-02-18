import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  devSignIn,
  signInWithGoogle,
  signInWithApple,
} from '../../auth/firebase';
import { colors, typography, spacing } from '../../theme';

WebBrowser.maybeCompleteAuthSession();

export function WelcomeScreen() {
  const [signingIn, setSigningIn] = useState(false);

  const [_request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        setSigningIn(true);
        signInWithGoogle(id_token)
          .catch((error: any) => Alert.alert('Sign-in failed', error.message))
          .finally(() => setSigningIn(false));
      }
    }
  }, [response]);

  const handleDevSignIn = async () => {
    setSigningIn(true);
    try {
      await devSignIn();
    } catch (error: any) {
      Alert.alert('Sign-in failed', error.message);
    } finally {
      setSigningIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await promptAsync();
  };

  const handleAppleSignIn = async () => {
    setSigningIn(true);
    try {
      const nonceBytes = await Crypto.getRandomBytesAsync(16);
      const nonce = Array.from(new Uint8Array(nonceBytes))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce,
      );

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!appleCredential.identityToken) {
        throw new Error('No identity token returned from Apple');
      }

      await signInWithApple(appleCredential.identityToken, nonce);
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign-in failed', error.message);
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MyGourmetDiary</Text>
        <Text style={styles.subtitle}>
          Secretly peeking into a gourmet's hidden notes.
        </Text>
      </View>

      <View style={styles.description}>
        <Text style={styles.descriptionText}>
          Your personal journal for restaurants, wines, and spirits.
          Log detailed notes and discover your taste identity.
        </Text>
      </View>

      <View style={styles.buttons}>
        {/* Dev sign-in for local development */}
        {__DEV__ && (
          <TouchableOpacity
            style={[styles.button, styles.devButton]}
            onPress={handleDevSignIn}
            disabled={signingIn}
            accessibilityLabel="Sign in as dev user"
          >
            {signingIn ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={[styles.buttonText, styles.devButtonText]}>
                Dev Sign In
              </Text>
            )}
          </TouchableOpacity>
        )}

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.button, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={signingIn}
            accessibilityLabel="Sign in with Apple"
          >
            {signingIn ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.buttonText, styles.appleButtonText]}>
                Continue with Apple
              </Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleSignIn}
          disabled={signingIn}
          accessibilityLabel="Sign in with Google"
        >
          {signingIn ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={[styles.buttonText, styles.googleButtonText]}>
              Continue with Google
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 34,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  description: {
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  descriptionText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  buttons: {
    gap: spacing.md,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  devButton: {
    backgroundColor: '#2E7D32',
  },
  devButtonText: {
    color: '#FFFFFF',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  appleButtonText: {
    color: '#FFFFFF',
  },
  googleButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleButtonText: {
    color: colors.text,
  },
  buttonText: {
    ...typography.button,
  },
});
