import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import { binderFollowsApi } from '../../api/endpoints';
import { UserCard } from '../../components/social/UserCard';
import { FollowButton } from '../../components/social/FollowButton';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BindersStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius } from '../../theme';

type NavProp = NativeStackNavigationProp<BindersStackParamList>;

export function FollowedBindersScreen() {
  const navigation = useNavigation<NavProp>();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['following'],
    queryFn: ({ pageParam }) => binderFollowsApi.listFollowed(pageParam, 20),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
  });

  const follows = data?.pages.flatMap((page) => page.items) || [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <FlatList
      style={styles.container}
      data={follows}
      keyExtractor={(item) => item.binder.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate('BinderDetail', {
              binderId: item.binder.id,
              binderName: item.binder.name,
            })
          }
        >
          <Text style={styles.binderName}>{item.binder.name}</Text>
          <Text style={styles.binderMeta}>
            {item.binder._count?.notes || 0} notes
          </Text>
          {item.binder.owner && (
            <UserCard
              user={item.binder.owner}
              onPress={() =>
                navigation.navigate('UserProfile', { userId: item.binder.owner!.id })
              }
              rightElement={
                <FollowButton binderId={item.binder.id} isFollowing={true} />
              }
            />
          )}
        </TouchableOpacity>
      )}
      contentContainerStyle={[
        styles.list,
        follows.length === 0 && styles.emptyList,
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
          title="Not following any binders"
          description="Browse public profiles and follow binders that match your taste."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  binderName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 2,
  },
  binderMeta: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
});
