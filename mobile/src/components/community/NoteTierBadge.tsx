import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface NoteTierBadgeProps {
  tier: number;
  similarityPercent?: number;
}

export function NoteTierBadge({ tier, similarityPercent }: NoteTierBadgeProps) {
  if (tier === 1) {
    return (
      <View style={[styles.badge, styles.friendBadge]}>
        <Text style={[styles.badgeText, styles.friendText]}>Friend</Text>
      </View>
    );
  }

  if (tier === 2 && similarityPercent != null) {
    return (
      <View style={[styles.badge, styles.matchBadge]}>
        <Text style={[styles.badgeText, styles.matchText]}>
          {similarityPercent}% match
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
  friendBadge: {
    backgroundColor: colors.primary,
  },
  matchBadge: {
    backgroundColor: colors.accentLight,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  friendText: {
    color: colors.textInverse,
  },
  matchText: {
    color: colors.primaryDark,
  },
});
