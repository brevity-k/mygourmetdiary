import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { colors, spacing, borderRadius } from '../../theme';

function SingleBinderSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={44} height={44} borderRadius={borderRadius.md} />
      <Skeleton width="80%" height={14} style={styles.nameBar} />
      <Skeleton width={60} height={12} />
    </View>
  );
}

export function BinderCardSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <SingleBinderSkeleton />
        <SingleBinderSkeleton />
      </View>
      <View style={styles.row}>
        <SingleBinderSkeleton />
        <SingleBinderSkeleton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 130,
  },
  nameBar: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
});
