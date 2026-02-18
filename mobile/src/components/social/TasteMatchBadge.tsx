import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TasteCategory } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface TasteMatchBadgeProps {
  category: TasteCategory;
  score: number | null;
  overlapCount: number;
}

function getCategoryIcon(category: TasteCategory): keyof typeof MaterialIcons.glyphMap {
  switch (category) {
    case TasteCategory.RESTAURANT: return 'restaurant';
    case TasteCategory.WINE: return 'wine-bar';
    case TasteCategory.SPIRIT: return 'local-bar';
  }
}

function getScoreColor(score: number | null): string {
  if (score === null || score < 0.5) return colors.textTertiary;
  if (score < 0.7) return colors.warning;
  return colors.success;
}

export function TasteMatchBadge({ category, score, overlapCount }: TasteMatchBadgeProps) {
  const scoreColor = getScoreColor(score);
  const percentage = score !== null ? Math.round(score * 100) : null;

  return (
    <View style={styles.container}>
      <MaterialIcons
        name={getCategoryIcon(category)}
        size={14}
        color={scoreColor}
      />
      {percentage !== null && overlapCount >= 5 ? (
        <>
          <Text style={[styles.score, { color: scoreColor }]}>
            {percentage}%
          </Text>
          <Text style={styles.overlap}>{overlapCount} shared</Text>
        </>
      ) : (
        <Text style={styles.insufficient}>Insufficient data</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
  },
  score: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  overlap: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  insufficient: {
    ...typography.caption,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
});
