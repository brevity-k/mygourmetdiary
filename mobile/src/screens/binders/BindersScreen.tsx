import React, { useState } from 'react';
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
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { bindersApi, binderFollowsApi } from '../../api/endpoints';
import { SegmentControl } from '../../components/common/SegmentControl';
import { BinderCardSkeleton } from '../../components/common/BinderCardSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { UserCard } from '../../components/social/UserCard';
import { FollowButton } from '../../components/social/FollowButton';
import { BindersStackParamList } from '../../navigation/types';
import { Binder, BinderCategory } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

type NavigationProp = NativeStackNavigationProp<BindersStackParamList>;

const SEGMENTS = [
  { label: 'My Binders', value: 'mine' },
  { label: 'Following', value: 'following' },
];

const CATEGORY_ICONS: Record<BinderCategory, keyof typeof MaterialIcons.glyphMap> = {
  [BinderCategory.RESTAURANT]: 'restaurant',
  [BinderCategory.WINE]: 'wine-bar',
  [BinderCategory.SPIRIT]: 'local-bar',
  [BinderCategory.MIXED]: 'folder',
};

export function BindersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [segment, setSegment] = useState('mine');

  const { data: binders = [], isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['binders'],
    queryFn: bindersApi.list,
    enabled: segment === 'mine',
  });

  const followedQuery = useInfiniteQuery({
    queryKey: ['following'],
    queryFn: ({ pageParam }) => binderFollowsApi.listFollowed(pageParam, 20),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: segment === 'following',
  });

  const followedBinders = followedQuery.data?.pages.flatMap((p) => p.items) || [];

  if (segment === 'mine' && isLoading) return <BinderCardSkeleton />;

  if (segment === 'mine' && isError) {
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
      <SegmentControl
        segments={SEGMENTS}
        selected={segment}
        onSelect={setSegment}
      />

      {segment === 'mine' ? (
        <FlatList
          data={binders}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No binders yet"
              description="Your binders will appear here."
            />
          }
          renderItem={({ item }: { item: Binder }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('BinderDetail', {
                  binderId: item.id,
                  binderName: item.name,
                })
              }
            >
              <View style={styles.iconWrapper}>
                <MaterialIcons
                  name={CATEGORY_ICONS[item.category]}
                  size={28}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.binderName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.noteCount}>
                {item._count?.notes || 0} notes
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={followedBinders}
          keyExtractor={(item) => item.binder.id}
          contentContainerStyle={[
            styles.list,
            followedBinders.length === 0 && styles.emptyList,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={followedQuery.isRefetching}
              onRefresh={followedQuery.refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="Not following any binders"
              description="Browse public profiles and follow binders that match your taste."
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.followedCard}
              onPress={() =>
                navigation.navigate('BinderDetail', {
                  binderId: item.binder.id,
                  binderName: item.binder.name,
                })
              }
            >
              <Text style={styles.followedName}>{item.binder.name}</Text>
              <Text style={styles.noteCount}>
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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  emptyList: { flex: 1 },
  row: { gap: spacing.md, marginBottom: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 130,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  binderName: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
  noteCount: { ...typography.caption, color: colors.textTertiary },
  followedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  followedName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 2,
  },
});
