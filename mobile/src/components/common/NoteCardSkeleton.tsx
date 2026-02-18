import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { colors, spacing, borderRadius } from '../../theme';

function SingleCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={180} borderRadius={0} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Skeleton width={16} height={16} borderRadius={8} />
          <Skeleton width={80} height={12} />
        </View>
        <Skeleton width="70%" height={18} style={styles.titleBar} />
        <Skeleton width="50%" height={14} style={styles.subtitleBar} />
        <View style={styles.footer}>
          <Skeleton width={40} height={20} />
        </View>
      </View>
    </View>
  );
}

export function NoteCardSkeleton() {
  return (
    <View style={styles.container}>
      <SingleCardSkeleton />
      <SingleCardSkeleton />
      <SingleCardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  titleBar: {
    marginBottom: 4,
  },
  subtitleBar: {
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
