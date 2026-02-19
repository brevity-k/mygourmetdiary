import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../../store/subscription.store';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface PremiumGateProps {
  children: React.ReactNode;
  featureName?: string;
}

export function PremiumGate({ children, featureName }: PremiumGateProps) {
  const isActive = useSubscriptionStore((s) => s.isActive);
  const navigation = useNavigation<any>();

  if (isActive) return <>{children}</>;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <MaterialIcons name="workspace-premium" size={48} color={colors.accent} />
        <Text style={styles.title}>Connoisseur Feature</Text>
        <Text style={styles.description}>
          {featureName
            ? `${featureName} is available with a Connoisseur subscription.`
            : 'This feature requires a Connoisseur subscription.'}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ProfileTab', { screen: 'Paywall' })}
        >
          <Text style={styles.buttonText}>Upgrade Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  buttonText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '600',
  },
});
