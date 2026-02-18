import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface TierBadgeProps {
  tier: number;
  label?: string;
}

function getTierStyle(tier: number) {
  switch (tier) {
    case 1: return { bg: colors.primary, text: colors.textInverse };
    case 2: return { bg: colors.success, text: colors.textInverse };
    case 3: return { bg: colors.warning, text: colors.text };
    default: return { bg: colors.border, text: colors.textSecondary };
  }
}

function getTierLabel(tier: number): string {
  switch (tier) {
    case 1: return 'Gourmet Friend';
    case 2: return 'High Match';
    case 3: return 'Moderate Match';
    default: return '';
  }
}

export function TierBadge({ tier, label }: TierBadgeProps) {
  const displayLabel = label || getTierLabel(tier);
  if (!displayLabel) return null;

  const style = getTierStyle(tier);

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
