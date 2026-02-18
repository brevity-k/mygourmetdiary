import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface RatingInputModalProps {
  visible: boolean;
  title: string;
  onSubmit: (rating: number) => void;
  onClose: () => void;
}

export function RatingInputModal({
  visible,
  title,
  onSubmit,
  onClose,
}: RatingInputModalProps) {
  const [rating, setRating] = useState(5);

  const handleSubmit = () => {
    onSubmit(rating);
    setRating(5);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.ratingRow}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.ratingButton,
                  num === rating && styles.ratingButtonActive,
                ]}
                onPress={() => setRating(num)}
              >
                <Text
                  style={[
                    styles.ratingText,
                    num === rating && styles.ratingTextActive,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  ratingButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
  ratingButtonActive: {
    backgroundColor: colors.primary,
  },
  ratingText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  ratingTextActive: {
    color: colors.textInverse,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
  },
  cancelText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  submitText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '600',
  },
});
