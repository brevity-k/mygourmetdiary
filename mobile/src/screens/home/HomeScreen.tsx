import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import { notesApi } from '../../api/endpoints';
import { NoteCard } from '../../components/notes/NoteCard';
import { EmptyState } from '../../components/common/EmptyState';
import { NoteCardSkeleton } from '../../components/common/NoteCardSkeleton';
import { HomeStackParamList } from '../../navigation/types';
import { NoteType } from '../../types';
import { colors, typography, spacing } from '../../theme';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const FILTER_OPTIONS: { label: string; value: NoteType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Restaurant', value: NoteType.RESTAURANT },
  { label: 'Wine', value: NoteType.WINE },
  { label: 'Spirit', value: NoteType.SPIRIT },
  { label: 'Visits', value: NoteType.WINERY_VISIT },
];

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [typeFilter, setTypeFilter] = useState<NoteType | undefined>();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['notes', 'feed', typeFilter],
    queryFn: ({ pageParam }) =>
      notesApi.feed({ cursor: pageParam, type: typeFilter, limit: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
  });

  const notes = data?.pages.flatMap((page) => page.items) || [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <NoteCardSkeleton />;

  if (isError) {
    return (
      <EmptyState
        title="Something went wrong"
        description="Pull to refresh or tap to retry."
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.label}
            style={[
              styles.filterChip,
              typeFilter === opt.value && styles.filterChipActive,
            ]}
            onPress={() => setTypeFilter(opt.value)}
          >
            <Text
              style={[
                styles.filterText,
                typeFilter === opt.value && styles.filterTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
          />
        )}
        contentContainerStyle={[
          styles.list,
          notes.length === 0 && styles.emptyList,
        ]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No notes yet"
            description="Tap the + button to create your first gourmet note."
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
});
