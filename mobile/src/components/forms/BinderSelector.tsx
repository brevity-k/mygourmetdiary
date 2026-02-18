import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Binder } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface BinderSelectorProps {
  binders: Binder[];
  selectedId: string | null;
  onChange: (binderId: string) => void;
  label?: string;
}

export function BinderSelector({
  binders,
  selectedId,
  onChange,
  label = 'Binder',
}: BinderSelectorProps) {
  const [visible, setVisible] = useState(false);
  const selected = binders.find((b) => b.id === selectedId);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        accessibilityLabel="Select binder"
      >
        <Text
          style={[styles.triggerText, !selected && styles.placeholder]}
          numberOfLines={1}
        >
          {selected?.name || 'Select a binder...'}
        </Text>
        <MaterialIcons
          name="expand-more"
          size={20}
          color={colors.textTertiary}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Binder</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={binders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.option,
                  item.id === selectedId && styles.optionSelected,
                ]}
                onPress={() => {
                  onChange(item.id);
                  setVisible(false);
                }}
              >
                <Text style={styles.optionName}>{item.name}</Text>
                <Text style={styles.optionCategory}>{item.category}</Text>
                {item.id === selectedId && (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
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
    marginBottom: spacing.xs,
  },
  trigger: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  triggerText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textTertiary,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  optionSelected: {
    backgroundColor: colors.surfaceElevated,
  },
  optionName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  optionCategory: {
    ...typography.caption,
    color: colors.textTertiary,
    marginRight: spacing.sm,
  },
});
