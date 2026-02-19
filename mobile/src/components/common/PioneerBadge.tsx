import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';

interface PioneerBadgeProps {
  count: number;
  compact?: boolean;
}

export function PioneerBadgeComponent({ count, compact }: PioneerBadgeProps) {
  if (count === 0) return null;

  if (compact) {
    return (
      <View style={styles.compact}>
        <MaterialIcons name="flag" size={14} color={colors.warning} />
        <Text style={styles.compactText}>{count}</Text>
      </View>
    );
  }

  return (
    <View style={styles.badge}>
      <MaterialIcons name="flag" size={16} color={colors.warning} />
      <Text style={styles.text}>
        {count} Pioneer Badge{count > 1 ? 's' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  text: { ...typography.caption, color: colors.warning, fontWeight: '600' },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  compactText: { ...typography.caption, color: colors.warning, fontWeight: '600' },
});
