import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Product, CommunityStats, ProductCategory } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface ProductHeroProps {
  product: Product;
  stats: CommunityStats | null;
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.WINE]: 'Wine',
  [ProductCategory.SPIRIT]: 'Spirit',
  [ProductCategory.SAKE]: 'Sake',
  [ProductCategory.BEER]: 'Beer',
};

export function ProductHero({ product, stats }: ProductHeroProps) {
  const details: string[] = [];
  if (product.subType) details.push(product.subType);
  if (product.vintage) details.push(String(product.vintage));
  if (product.region) details.push(product.region);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.name}>{product.name}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {CATEGORY_LABELS[product.category] ?? product.category}
          </Text>
        </View>
      </View>
      {product.producer && (
        <Text style={styles.producer}>{product.producer}</Text>
      )}
      {details.length > 0 && (
        <Text style={styles.details} numberOfLines={1}>
          {details.join(' \u00B7 ')}
        </Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
  categoryText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },
  producer: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  details: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
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
