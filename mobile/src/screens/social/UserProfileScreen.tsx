import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { profilesApi, gourmetFriendsApi } from '../../api/endpoints';
import { TasteMatchBadge } from '../../components/social/TasteMatchBadge';
import { FollowButton } from '../../components/social/FollowButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { HomeStackParamList } from '../../navigation/types';
import { TasteCategory } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

type RouteType = RouteProp<HomeStackParamList, 'UserProfile'>;
type NavProp = NativeStackNavigationProp<HomeStackParamList>;

export function UserProfileScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavProp>();
  const queryClient = useQueryClient();
  const { userId } = route.params;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profilesApi.getProfile(userId),
  });

  const pinMutation = useMutation({
    mutationFn: (categories: TasteCategory[]) =>
      gourmetFriendsApi.pin(userId, categories),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: () => gourmetFriendsApi.unpin(userId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  if (isLoading || !profile) return <LoadingSpinner />;

  const handlePinToggle = async () => {
    if (profile.isPinned) {
      unpinMutation.mutate();
    } else {
      const result = await gourmetFriendsApi.canPin(userId);
      if (result.canPin) {
        pinMutation.mutate(result.eligibleCategories);
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MaterialIcons name="person" size={40} color={colors.textTertiary} />
          </View>
        )}
        <Text style={styles.name}>{profile.displayName}</Text>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.stats.publicNoteCount}</Text>
            <Text style={styles.statLabel}>Notes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.stats.publicBinderCount}</Text>
            <Text style={styles.statLabel}>Binders</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.pinButton, profile.isPinned && styles.pinButtonActive]}
          onPress={handlePinToggle}
        >
          <MaterialIcons
            name={profile.isPinned ? 'star' : 'star-border'}
            size={18}
            color={profile.isPinned ? colors.textInverse : colors.primary}
          />
          <Text style={[styles.pinText, profile.isPinned && styles.pinTextActive]}>
            {profile.isPinned ? 'Gourmet Friend' : 'Pin as Friend'}
          </Text>
        </TouchableOpacity>
      </View>

      {profile.tasteSimilarity.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Taste Similarity</Text>
          <View style={styles.matchRow}>
            {profile.tasteSimilarity.map((ts) => (
              <TasteMatchBadge
                key={ts.category}
                category={ts.category}
                score={ts.score}
                overlapCount={ts.overlapCount}
              />
            ))}
          </View>
        </View>
      )}

      {profile.publicBinders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Public Binders</Text>
          {profile.publicBinders.map((binder) => (
            <View key={binder.id} style={styles.binderRow}>
              <View style={styles.binderInfo}>
                <Text style={styles.binderName}>{binder.name}</Text>
                <Text style={styles.binderMeta}>
                  {binder._count?.notes || 0} notes
                </Text>
              </View>
              <FollowButton binderId={binder.id} isFollowing={false} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h3,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pinButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pinText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  pinTextActive: {
    color: colors.textInverse,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  matchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  binderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  binderInfo: {
    flex: 1,
  },
  binderName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  binderMeta: {
    ...typography.caption,
    color: colors.textTertiary,
  },
});
