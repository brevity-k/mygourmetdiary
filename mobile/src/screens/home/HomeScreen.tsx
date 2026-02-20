import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import { notesApi, exploreApi } from '../../api/endpoints';
import { NoteCard } from '../../components/notes/NoteCard';
import { SocialNoteCard } from '../../components/notes/SocialNoteCard';
import { SegmentControl } from '../../components/common/SegmentControl';
import { EmptyState } from '../../components/common/EmptyState';
import { NoteCardSkeleton } from '../../components/common/NoteCardSkeleton';
import { HomeStackParamList } from '../../navigation/types';
import { NoteType, SocialNote } from '../../types';
import { colors, typography, spacing } from '../../theme';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const SEGMENTS = [
  { label: 'My Notes', value: 'mine' },
  { label: 'Following', value: 'following' },
];

const FILTER_OPTIONS: { label: string; value: NoteType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Restaurant', value: NoteType.RESTAURANT },
  { label: 'Wine', value: NoteType.WINE },
  { label: 'Spirit', value: NoteType.SPIRIT },
  { label: 'Visits', value: NoteType.WINERY_VISIT },
];

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [segment, setSegment] = useState('mine');
  const [typeFilter, setTypeFilter] = useState<NoteType | undefined>();

  // Personal feed
  const myFeed = useInfiniteQuery({
    queryKey: ['notes', 'feed', typeFilter],
    queryFn: ({ pageParam }) =>
      notesApi.feed({ cursor: pageParam, type: typeFilter, limit: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: segment === 'mine',
  });

  // Social feed (followed binders)
  const socialFeed = useInfiniteQuery({
    queryKey: ['notes', 'social', typeFilter],
    queryFn: ({ pageParam }) =>
      exploreApi.followedFeed({ cursor: pageParam, type: typeFilter, limit: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: segment === 'following',
  });

  const activeFeed = segment === 'mine' ? myFeed : socialFeed;
  const notes = activeFeed.data?.pages.flatMap((page) => page.items) || [];

  const handleEndReached = useCallback(() => {
    if (activeFeed.hasNextPage && !activeFeed.isFetchingNextPage) {
      activeFeed.fetchNextPage();
    }
  }, [activeFeed.hasNextPage, activeFeed.isFetchingNextPage, activeFeed.fetchNextPage]);

  if (activeFeed.isLoading) return <NoteCardSkeleton />;

  if (activeFeed.isError) {
    return (
      <EmptyState
        title="Something went wrong"
        description="Pull to refresh or tap to retry."
        actionLabel="Retry"
        onAction={() => activeFeed.refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <SegmentControl
        segments={SEGMENTS}
        selected={segment}
        onSelect={setSegment}
      />

      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
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
        </ScrollView>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          segment === 'following' ? (
            <SocialNoteCard
              note={item as SocialNote}
              onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
              onAuthorPress={
                (item as SocialNote).author
                  ? () => navigation.navigate('UserProfile', { userId: (item as SocialNote).author!.id })
                  : undefined
              }
            />
          ) : (
            <NoteCard
              note={item}
              onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
            />
          )
        }
        contentContainerStyle={[
          styles.list,
          notes.length === 0 && styles.emptyList,
        ]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={activeFeed.isRefetching}
            onRefresh={activeFeed.refetch}
            tintColor={colors.primary}
          />
        }
        ListFooterComponent={
          activeFeed.isFetchingNextPage ? (
            <ActivityIndicator
              style={{ paddingVertical: spacing.md }}
              size="small"
              color={colors.primary}
            />
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title={segment === 'mine' ? 'No notes yet' : 'No posts from followed binders'}
            description={
              segment === 'mine'
                ? 'Tap the + button to create your first gourmet note.'
                : 'Follow binders from other gourmets to see their notes here.'
            }
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
  filterWrapper: {
    paddingVertical: spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
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
