import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MenuDeciderDish } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface DishCardProps {
  dish: MenuDeciderDish;
}

export function DishCard({ dish }: DishCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.dishName}>{dish.dishName}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{dish.dishCategory}</Text>
          </View>
        </View>

        <View style={styles.ratings}>
          {dish.avgFriendRating !== null && (
            <View style={styles.ratingChip}>
              <MaterialIcons name="star" size={14} color={colors.accent} />
              <Text style={styles.ratingValue}>{dish.avgFriendRating}</Text>
              <Text style={styles.ratingLabel}>friends</Text>
            </View>
          )}
          <View style={styles.ratingChip}>
            <MaterialIcons name="star-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.ratingValue}>{dish.avgOverallRating}</Text>
            <Text style={styles.ratingLabel}>overall</Text>
          </View>
        </View>

        <View style={styles.meta}>
          {dish.friendCount > 0 && (
            <Text style={styles.metaText}>
              {dish.friendCount} friend{dish.friendCount > 1 ? 's' : ''} rated
            </Text>
          )}
          <Text style={styles.metaText}>
            {dish.wouldOrderAgainPct}% would order again
          </Text>
          <Text style={styles.metaText}>
            {dish.totalCount} total rating{dish.totalCount > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {expanded && dish.topFriendNotes.length > 0 && (
        <View style={styles.friendNotes}>
          {dish.topFriendNotes.map((note, i) => (
            <View key={i} style={styles.friendNote}>
              <View style={styles.friendRow}>
                {note.authorAvatar ? (
                  <Image source={{ uri: note.authorAvatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <MaterialIcons name="person" size={12} color={colors.textTertiary} />
                  </View>
                )}
                <Text style={styles.friendName}>{note.authorName}</Text>
                <View style={[styles.tierBadge, note.tier === 1 ? styles.tier1 : styles.tier2]}>
                  <Text style={styles.tierText}>
                    {note.tier === 1 ? 'Friend' : 'Match'}
                  </Text>
                </View>
                <Text style={styles.friendRating}>{note.rating}/10</Text>
              </View>
              {note.freeText && (
                <Text style={styles.friendComment} numberOfLines={3}>
                  {note.freeText}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {dish.topFriendNotes.length > 0 && (
        <View style={styles.expandHint}>
          <MaterialIcons
            name={expanded ? 'expand-less' : 'expand-more'}
            size={20}
            color={colors.textTertiary}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { gap: spacing.sm },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dishName: { ...typography.h3, color: colors.text, flex: 1 },
  categoryBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  ratings: { flexDirection: 'row', gap: spacing.md },
  ratingChip: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingValue: { ...typography.body, color: colors.text, fontWeight: '600' },
  ratingLabel: { ...typography.caption, color: colors.textSecondary },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metaText: { ...typography.caption, color: colors.textSecondary },
  friendNotes: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  friendNote: { gap: spacing.xs },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 24, height: 24, borderRadius: 12 },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendName: { ...typography.bodySmall, color: colors.text, flex: 1 },
  tierBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  tier1: { backgroundColor: '#FFF3E0' },
  tier2: { backgroundColor: '#E3F2FD' },
  tierText: { ...typography.caption, fontWeight: '600', fontSize: 10 },
  friendRating: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  friendComment: { ...typography.caption, color: colors.textSecondary, marginLeft: 36 },
  expandHint: { alignItems: 'center', marginTop: spacing.xs },
});
