import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CommunityGourmet } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface GourmetCardProps {
  gourmet: CommunityGourmet;
  onPress: () => void;
}

function getTierLabel(gourmet: CommunityGourmet): string | null {
  if (gourmet.tier === 1) return 'Friend';
  if (gourmet.tier === 2) {
    const best = gourmet.tasteSimilarity?.reduce<number | null>((max, ts) => {
      const score = ts.score ?? 0;
      return max === null || score > max ? score : max;
    }, null);
    if (best != null) return `${Math.round(best * 100)}% match`;
  }
  return null;
}

export function GourmetCard({ gourmet, onPress }: GourmetCardProps) {
  const tierLabel = getTierLabel(gourmet);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {gourmet.user.avatarUrl ? (
        <Image source={{ uri: gourmet.user.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <MaterialIcons name="person" size={24} color={colors.textTertiary} />
        </View>
      )}
      <Text style={styles.name} numberOfLines={1}>
        {gourmet.user.displayName}
      </Text>
      {tierLabel && (
        <Text
          style={[
            styles.tierText,
            gourmet.tier === 1 ? styles.tierFriend : styles.tierMatch,
          ]}
          numberOfLines={1}
        >
          {tierLabel}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    width: 80,
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '500',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  tierText: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  tierFriend: {
    color: colors.primary,
  },
  tierMatch: {
    color: colors.accent,
  },
});
