import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import { notesApi } from '../../api/endpoints';
import { NoteCard } from '../../components/notes/NoteCard';
import { EmptyState } from '../../components/common/EmptyState';
import { NoteCardSkeleton } from '../../components/common/NoteCardSkeleton';
import { BindersStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type RouteType = RouteProp<BindersStackParamList, 'BinderDetail'>;
type NavigationProp = NativeStackNavigationProp<BindersStackParamList>;

export function BinderDetailScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationProp>();

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
    queryKey: ['notes', 'feed', { binderId: route.params.binderId }],
    queryFn: ({ pageParam }) =>
      notesApi.feed({
        cursor: pageParam,
        binderId: route.params.binderId,
        limit: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
  });

  const notes = data?.pages.flatMap((page) => page.items) || [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
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
          title="No notes in this binder"
          description="Create a note and add it to this binder."
        />
      }
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  emptyList: { flex: 1 },
});
