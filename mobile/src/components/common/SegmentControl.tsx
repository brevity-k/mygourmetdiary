import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Segment {
  label: string;
  value: string;
}

interface SegmentControlProps {
  segments: Segment[];
  selected: string;
  onSelect: (value: string) => void;
}

export function SegmentControl({ segments, selected, onSelect }: SegmentControlProps) {
  return (
    <View style={styles.container}>
      {segments.map((seg) => (
        <TouchableOpacity
          key={seg.value}
          style={[styles.segment, selected === seg.value && styles.segmentActive]}
          onPress={() => onSelect(seg.value)}
        >
          <Text
            style={[
              styles.label,
              selected === seg.value && styles.labelActive,
            ]}
          >
            {seg.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 2,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md - 2,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.text,
    fontWeight: '600',
  },
});
