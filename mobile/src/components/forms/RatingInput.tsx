import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '../../theme';

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export function RatingInput({ value, onChange, label }: RatingInputProps) {
  const handlePress = (rating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(rating);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.grid}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.cell,
              num <= value && styles.cellActive,
            ]}
            onPress={() => handlePress(num)}
            accessibilityLabel={`Rating ${num} of 10`}
            accessibilityRole="radio"
            accessibilityState={{ selected: num === value }}
          >
            <Text
              style={[
                styles.cellText,
                num <= value && styles.cellTextActive,
              ]}
            >
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.ratingInactive,
    flex: 1,
  },
  cellActive: {
    backgroundColor: colors.ratingActive,
  },
  cellText: {
    ...typography.label,
    color: colors.textTertiary,
  },
  cellTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
});
