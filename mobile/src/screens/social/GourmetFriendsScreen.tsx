import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Swipeable } from 'react-native-gesture-handler';
import { gourmetFriendsApi } from '../../api/endpoints';
import { UserCard } from '../../components/social/UserCard';
import { TasteMatchBadge } from '../../components/social/TasteMatchBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ProfileStackParamList } from '../../navigation/types';
import { GourmetFriend } from '../../types';
import { colors, typography, spacing } from '../../theme';

type NavProp = NativeStackNavigationProp<ProfileStackParamList>;

export function GourmetFriendsScreen() {
  const navigation = useNavigation<NavProp>();
  const queryClient = useQueryClient();

  const { data: friends, isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: () => gourmetFriendsApi.list(),
  });

  const unpinMutation = useMutation({
    mutationFn: (pinnedId: string) => gourmetFriendsApi.unpin(pinnedId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  const handleUnpin = (friend: GourmetFriend) => {
    Alert.alert(
      'Unpin Friend',
      `Remove ${friend.pinned.displayName} as a Gourmet Friend?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpin',
          style: 'destructive',
          onPress: () => unpinMutation.mutate(friend.pinnedId),
        },
      ],
    );
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <FlatList
      style={styles.container}
      data={friends || []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <UserCard
            user={item.pinned}
            subtitle={item.categories.join(' · ')}
            onPress={() => navigation.navigate('UserProfile', { userId: item.pinnedId })}
          />
          {item.similarities && (
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
          )}
        </View>
      )}
      contentContainerStyle={[
        styles.list,
        (!friends || friends.length === 0) && styles.emptyList,
      ]}
      ListEmptyComponent={
        <EmptyState
          title="No Gourmet Friends yet"
          description="Discover users with similar taste and pin them as Gourmet Friends."
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
    borderRadius: 12,
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
