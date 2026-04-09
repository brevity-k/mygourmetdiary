import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Visibility } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

const OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: Visibility.PRIVATE, label: 'Private', hint: 'Only you can see this note' },
  { value: Visibility.FRIENDS, label: 'Friends', hint: 'Your pinned Gourmet Friends can see this note' },
  { value: Visibility.PUBLIC, label: 'Public', hint: 'Anyone can discover this note' },
];

interface Props {
  value: Visibility;
  onChange: (v: Visibility) => void;
}

export function VisibilitySelector({ value, onChange }: Props) {
  const selectedOption = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Visibility</Text>
      <View style={styles.segmented}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segment, value === opt.value && styles.segmentActive]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.segmentText, value === opt.value && styles.segmentTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.hint}>{selectedOption.hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  segmentTextActive: { color: colors.textInverse },
  hint: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs },
});
