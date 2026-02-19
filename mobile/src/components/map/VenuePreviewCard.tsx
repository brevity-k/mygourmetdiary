import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MapPin } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface VenuePreviewCardProps {
  pin: MapPin;
  onViewNotes: () => void;
  onMenuDecider?: () => void;
}

export function VenuePreviewCard({ pin, onViewNotes, onMenuDecider }: VenuePreviewCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.name} numberOfLines={1}>{pin.venue.name}</Text>
      {pin.venue.address && (
        <Text style={styles.address} numberOfLines={1}>{pin.venue.address}</Text>
      )}

      <View style={styles.stats}>
        {pin.avgRating !== null && (
          <View style={styles.stat}>
            <MaterialIcons name="star" size={14} color={colors.ratingActive} />
            <Text style={styles.statText}>{pin.avgRating}</Text>
          </View>
        )}
        <View style={styles.stat}>
          <MaterialIcons name="description" size={14} color={colors.textSecondary} />
          <Text style={styles.statText}>{pin.noteCount} notes</Text>
        </View>
        {pin.friendNoteCount > 0 && (
          <View style={styles.stat}>
            <MaterialIcons name="people" size={14} color={colors.accent} />
            <Text style={[styles.statText, { color: colors.accent }]}>
              {pin.friendNoteCount} friend{pin.friendNoteCount > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {pin.topFriendNames.length > 0 && (
        <Text style={styles.friendNames} numberOfLines={1}>
          {pin.topFriendNames.join(', ')}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onViewNotes}>
          <Text style={styles.actionText}>View Notes</Text>
        </TouchableOpacity>
        {onMenuDecider && pin.category === 'RESTAURANT' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionPrimary]}
            onPress={onMenuDecider}
          >
            <MaterialIcons name="restaurant-menu" size={14} color={colors.textInverse} />
            <Text style={[styles.actionText, styles.actionTextPrimary]}>Menu Decider</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  name: { ...typography.h3, color: colors.text },
  address: { ...typography.caption, color: colors.textSecondary },
  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  statText: { ...typography.caption, color: colors.textSecondary },
  friendNames: { ...typography.caption, color: colors.accent, fontStyle: 'italic' },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  actionTextPrimary: { color: colors.textInverse },
});
