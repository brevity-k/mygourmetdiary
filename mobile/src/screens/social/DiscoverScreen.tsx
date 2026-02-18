import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { discoveryApi } from '../../api/endpoints';
import { UserCard } from '../../components/social/UserCard';
import { TasteMatchBadge } from '../../components/social/TasteMatchBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchStackParamList } from '../../navigation/types';
import { TasteCategory, UserSuggestion } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

type NavProp = NativeStackNavigationProp<SearchStackParamList>;

const CATEGORY_FILTERS: { label: string; value: TasteCategory | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Restaurant', value: TasteCategory.RESTAURANT },
  { label: 'Wine', value: TasteCategory.WINE },
  { label: 'Spirit', value: TasteCategory.SPIRIT },
];

export function DiscoverScreen() {
  const navigation = useNavigation<NavProp>();
  const [category, setCategory] = useState<TasteCategory | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['discover', 'similar-users', category],
    queryFn: () => discoveryApi.getSimilarUsers(category, 30),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {CATEGORY_FILTERS.map((opt) => (
          <TouchableOpacity
            key={opt.label}
            style={[
              styles.filterChip,
              category === opt.value && styles.filterChipActive,
            ]}
            onPress={() => setCategory(opt.value)}
          >
            <Text
              style={[
                styles.filterText,
                category === opt.value && styles.filterTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data?.items || []}
        keyExtractor={(item) => item.user.id}
        renderItem={({ item }: { item: UserSuggestion }) => (
          <View style={styles.card}>
            <UserCard
              user={item.user}
              subtitle={`${item.sharedItemCount} shared items`}
              onPress={() => navigation.navigate('UserProfile', { userId: item.user.id })}
            />
            <View style={styles.badges}>
              {item.similarities.map((s) => (
                <TasteMatchBadge
                  key={s.category}
                  category={s.category}
                  score={s.score}
                  overlapCount={s.overlapCount}
                />
              ))}
            </View>
          </View>
        )}
        contentContainerStyle={[
          styles.list,
          (!data?.items || data.items.length === 0) && styles.emptyList,
        ]}
        ListEmptyComponent={
          <EmptyState
            title="No similar users found"
            description="Keep rating items to build your taste profile and find matching gourmets."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  filterTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  list: {
    padding: spacing.md,
  },
  emptyList: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
