import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { CommunityGourmet } from '../../types';
import { GourmetCard } from './GourmetCard';
import { colors, typography, spacing } from '../../theme';

interface TopGourmetsRowProps {
  gourmets: CommunityGourmet[];
  onGourmetPress: (userId: string) => void;
}

export function TopGourmetsRow({ gourmets, onGourmetPress }: TopGourmetsRowProps) {
  if (gourmets.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Top Gourmets</Text>
      <FlatList
        data={gourmets}
        keyExtractor={(item) => item.user.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <GourmetCard
            gourmet={item}
            onPress={() => onGourmetPress(item.user.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
});
