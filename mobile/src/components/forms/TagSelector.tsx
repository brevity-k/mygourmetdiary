import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Chip } from '../common/Chip';
import { Tag } from '../../types';
import { colors, typography, spacing } from '../../theme';

interface TagSelectorProps {
  label: string;
  tags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function TagSelector({
  label,
  tags,
  selectedIds,
  onChange,
}: TagSelectorProps) {
  const handleToggle = (tagId: string) => {
    Haptics.selectionAsync();
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedIds, tagId]);
    }
  };

  // Group tags by their group
  const grouped = tags.reduce(
    (acc, tag) => {
      if (!acc[tag.group]) acc[tag.group] = [];
      acc[tag.group].push(tag);
      return acc;
    },
    {} as Record<string, Tag[]>,
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {Object.entries(grouped).map(([group, groupTags]) => (
        <View key={group} style={styles.group}>
          <Text style={styles.groupLabel}>{group}</Text>
          <View style={styles.chips}>
            {groupTags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                emoji={tag.emoji || undefined}
                selected={selectedIds.includes(tag.id)}
                onPress={() => handleToggle(tag.id)}
              />
            ))}
          </View>
        </View>
      ))}
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
  group: {
    marginBottom: spacing.sm,
  },
  groupLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
