import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { gourmetFriendsApi, profilesApi } from '../../api/endpoints';
import { TasteMatchBadge } from '../../components/social/TasteMatchBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { ProfileStackParamList } from '../../navigation/types';
import { TasteCategory } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

type RouteType = RouteProp<ProfileStackParamList, 'PinGourmetFriend'>;

export function PinGourmetFriendScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { userId } = route.params;

  const [selected, setSelected] = useState<TasteCategory[]>([]);

  const { data: canPinData, isLoading } = useQuery({
    queryKey: ['canPin', userId],
    queryFn: () => gourmetFriendsApi.canPin(userId),
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profilesApi.getProfile(userId),
  });

  const pinMutation = useMutation({
    mutationFn: () => gourmetFriendsApi.pin(userId, selected),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      navigation.goBack();
    },
    onError: () => {
      Alert.alert('Error', 'Could not pin this user. Please try again.');
    },
  });

  if (isLoading || !canPinData) return <LoadingSpinner />;

  const toggleCategory = (cat: TasteCategory) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Pin {profile?.displayName || 'User'} as Gourmet Friend
      </Text>
      <Text style={styles.subtitle}>
        Select categories where you trust their taste:
      </Text>

      <View style={styles.categories}>
        {canPinData.compatibility.map((comp) => {
          const eligible = canPinData.eligibleCategories.includes(comp.category);
          const isSelected = selected.includes(comp.category);

          return (
            <TouchableOpacity
              key={comp.category}
              style={[
                styles.categoryCard,
                !eligible && styles.categoryDisabled,
                isSelected && styles.categorySelected,
              ]}
              onPress={() => eligible && toggleCategory(comp.category)}
              disabled={!eligible}
            >
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{comp.category}</Text>
                {isSelected && (
                  <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                )}
              </View>
              <TasteMatchBadge
                category={comp.category}
                score={comp.score}
                overlapCount={comp.overlapCount}
              />
              {!eligible && (
                <Text style={styles.disabledText}>
                  Need TSS {'\u2265'} 70% and 5+ shared items
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Button
          title="Pin as Gourmet Friend"
          onPress={() => pinMutation.mutate()}
          loading={pinMutation.isPending}
          disabled={selected.length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  categories: {
    gap: spacing.md,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  categoryDisabled: {
    opacity: 0.5,
  },
  categorySelected: {
    borderColor: colors.primary,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryName: {
    ...typography.h3,
    color: colors.text,
  },
  disabledText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  actions: {
    marginTop: 'auto',
    paddingBottom: spacing.lg,
  },
});
