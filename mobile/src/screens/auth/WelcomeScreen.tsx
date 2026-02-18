import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import auth from '@react-native-firebase/auth';
import { colors, typography, spacing } from '../../theme';

export function WelcomeScreen() {
  const handleGoogleSignIn = async () => {
    // Google sign-in requires additional native setup
    Alert.alert(
      'Google Sign-In',
      'Google Sign-In requires Firebase configuration. Please set up GoogleSignin in your Firebase project.',
    );
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken, fullName } = credential;
      if (!identityToken) throw new Error('No identity token');

      const appleCredential = auth.AppleAuthProvider.credential(
        identityToken,
        credential.authorizationCode || '',
      );

      const userCredential = await auth().signInWithCredential(appleCredential);

      // Update display name from Apple if available
      if (fullName?.givenName && userCredential.user) {
        await userCredential.user.updateProfile({
          displayName: `${fullName.givenName} ${fullName.familyName || ''}`.trim(),
        });
      }
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign-in failed', error.message);
      }
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
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.button, styles.appleButton]}
            onPress={handleAppleSignIn}
            accessibilityLabel="Sign in with Apple"
          >
            <Text style={[styles.buttonText, styles.appleButtonText]}>
              Continue with Apple
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleSignIn}
          accessibilityLabel="Sign in with Google"
        >
          <Text style={[styles.buttonText, styles.googleButtonText]}>
            Continue with Google
          </Text>
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
  appleButton: {
    backgroundColor: '#000000',
  },
  googleButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    ...typography.button,
  },
  appleButtonText: {
    color: '#FFFFFF',
  },
  googleButtonText: {
    color: colors.text,
  },
});
