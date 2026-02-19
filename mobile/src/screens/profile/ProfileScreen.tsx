import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { bindersApi, gourmetFriendsApi, pioneersApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/auth.store';
import { useSubscriptionStore } from '../../store/subscription.store';
import { EmptyState } from '../../components/common/EmptyState';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);

  const isConnoisseur = useSubscriptionStore((s) => s.isActive);

  const { data: binders = [], isError, refetch } = useQuery({
    queryKey: ['binders'],
    queryFn: bindersApi.list,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: gourmetFriendsApi.list,
  });

  const { data: pioneerBadges = [] } = useQuery({
    queryKey: ['pioneerBadges'],
    queryFn: pioneersApi.getBadges,
  });

  const totalNotes = binders.reduce((sum, b) => sum + (b._count?.notes || 0), 0);

  if (isError) {
    return (
      <EmptyState
        title="Something went wrong"
        description="Could not load profile data. Tap to retry."
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile header */}
      <View style={styles.header}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MaterialIcons name="person" size={32} color={colors.textTertiary} />
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={styles.name}>{user?.displayName}</Text>
          {isConnoisseur && (
            <View style={styles.premiumBadge}>
              <MaterialIcons name="workspace-premium" size={14} color={colors.accent} />
              <Text style={styles.premiumText}>Connoisseur</Text>
            </View>
          )}
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalNotes}</Text>
          <Text style={styles.statLabel}>Notes</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{binders.length}</Text>
          <Text style={styles.statLabel}>Binders</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{friends.length}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </View>
        {pioneerBadges.length > 0 && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{pioneerBadges.length}</Text>
            <Text style={styles.statLabel}>Pioneer</Text>
          </View>
        )}
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {!isConnoisseur && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Paywall')}
          >
            <MaterialIcons name="workspace-premium" size={22} color={colors.accent} />
            <Text style={[styles.menuText, { color: colors.accent }]}>
              Upgrade to Connoisseur
            </Text>
            <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('GourmetFriends')}
        >
          <MaterialIcons name="star" size={22} color={colors.primary} />
          <Text style={styles.menuText}>Gourmet Friends</Text>
          <Text style={styles.menuBadge}>{friends.length}</Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <MaterialIcons name="settings" size={22} color={colors.text} />
          <Text style={styles.menuText}>Settings</Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { ...typography.h2, color: colors.text },
  email: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    marginHorizontal: spacing.lg,
  },
  stat: { alignItems: 'center' },
  statValue: { ...typography.h2, color: colors.primary },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  menu: { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuText: { ...typography.body, color: colors.text, flex: 1 },
  menuBadge: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  premiumText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
});
