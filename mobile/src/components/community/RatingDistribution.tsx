import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface RatingDistributionProps {
  distribution: Record<string, number>;
}

const MAX_BAR_HEIGHT = 80;

export function RatingDistribution({ distribution }: RatingDistributionProps) {
  const entries = Array.from({ length: 10 }, (_, i) => {
    const key = String(i + 1);
    return { rating: i + 1, count: distribution[key] ?? 0 };
  });

  const maxCount = Math.max(...entries.map((e) => e.count), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rating Distribution</Text>
      <View style={styles.chart}>
        {entries.map((entry) => {
          const height = (entry.count / maxCount) * MAX_BAR_HEIGHT;
          return (
            <View key={entry.rating} style={styles.column}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(height, 2),
                      backgroundColor:
                        entry.count > 0 ? colors.ratingActive : colors.ratingInactive,
                    },
                  ]}
                />
              </View>
              <Text style={styles.label}>{entry.rating}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: MAX_BAR_HEIGHT + 24,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 16,
    borderRadius: borderRadius.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
