import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Venue, CommunityStats } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface VenueHeroProps {
  venue: Venue;
  stats: CommunityStats | null;
}

export function VenueHero({ venue, stats }: VenueHeroProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{venue.name}</Text>
      {venue.address && (
        <View style={styles.addressRow}>
          <MaterialIcons name="place" size={14} color={colors.textTertiary} />
          <Text style={styles.address} numberOfLines={2}>
            {venue.address}
          </Text>
        </View>
      )}
      {stats && (
        <View style={styles.statsRow}>
          {stats.avgRating != null && (
            <View style={styles.statBadge}>
              <MaterialIcons name="star" size={14} color={colors.ratingActive} />
              <Text style={styles.statText}>
                {stats.avgRating.toFixed(1)}
              </Text>
            </View>
          )}
          <View style={styles.statBadge}>
            <MaterialIcons name="description" size={14} color={colors.textTertiary} />
            <Text style={styles.statText}>
              {stats.totalNotes} {stats.totalNotes === 1 ? 'note' : 'notes'}
            </Text>
          </View>
          <View style={styles.statBadge}>
            <MaterialIcons name="people" size={14} color={colors.textTertiary} />
            <Text style={styles.statText}>
              {stats.totalGourmets} {stats.totalGourmets === 1 ? 'gourmet' : 'gourmets'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  name: {
    ...typography.h2,
    color: colors.text,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  address: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  statText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
});
