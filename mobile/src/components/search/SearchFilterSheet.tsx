import React, { forwardRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { MaterialIcons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../../store/subscription.store';
import { NoteType } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

export interface SearchFilters {
  minRating?: number;
  maxPrice?: number;
  cuisineTags?: string;
  wineType?: string;
  spiritType?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface SearchFilterSheetProps {
  noteType?: string;
  onApply: (filters: SearchFilters) => void;
  onClear: () => void;
}

const CUISINE_OPTIONS = ['JAPANESE', 'KOREAN', 'ITALIAN', 'MEXICAN', 'CHINESE', 'AMERICAN', 'FRENCH', 'THAI'];
const WINE_TYPE_OPTIONS = ['RED', 'WHITE', 'ROSE', 'SPARKLING', 'ORANGE', 'DESSERT'];
const SPIRIT_TYPE_OPTIONS = ['WHISKEY', 'SAKE', 'TEQUILA', 'RUM', 'GIN', 'BRANDY', 'VODKA'];

export const SearchFilterSheet = forwardRef<BottomSheet, SearchFilterSheetProps>(
  ({ noteType, onApply, onClear }, ref) => {
    const isConnoisseur = useSubscriptionStore((s) => s.isActive);
    const [minRating, setMinRating] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedCuisine, setSelectedCuisine] = useState<string[]>([]);
    const [selectedWineType, setSelectedWineType] = useState('');
    const [selectedSpiritType, setSelectedSpiritType] = useState('');

    const handleApply = useCallback(() => {
      const filters: SearchFilters = {};
      if (minRating) filters.minRating = parseInt(minRating);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      if (selectedCuisine.length > 0) filters.cuisineTags = selectedCuisine.join(',');
      if (selectedWineType) filters.wineType = selectedWineType;
      if (selectedSpiritType) filters.spiritType = selectedSpiritType;
      onApply(filters);
    }, [minRating, maxPrice, selectedCuisine, selectedWineType, selectedSpiritType, onApply]);

    const handleClear = useCallback(() => {
      setMinRating('');
      setMaxPrice('');
      setSelectedCuisine([]);
      setSelectedWineType('');
      setSelectedSpiritType('');
      onClear();
    }, [onClear]);

    const toggleCuisine = (tag: string) => {
      setSelectedCuisine((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
      );
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={[400]}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={{ backgroundColor: colors.textTertiary }}
      >
        <BottomSheetView>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Filters</Text>
              {!isConnoisseur && (
                <View style={styles.premiumBadge}>
                  <MaterialIcons name="lock" size={12} color={colors.accent} />
                  <Text style={styles.premiumLabel}>Premium</Text>
                </View>
              )}
            </View>

            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Min Rating</Text>
                <TextInput
                  style={styles.input}
                  value={minRating}
                  onChangeText={setMinRating}
                  keyboardType="numeric"
                  placeholder="1-10"
                  placeholderTextColor={colors.textTertiary}
                  editable={isConnoisseur}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Max Price</Text>
                <TextInput
                  style={styles.input}
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="numeric"
                  placeholder="$"
                  placeholderTextColor={colors.textTertiary}
                  editable={isConnoisseur}
                />
              </View>
            </View>

            {(!noteType || noteType === 'RESTAURANT') && (
              <View style={styles.section}>
                <Text style={styles.label}>Cuisine</Text>
                <View style={styles.chips}>
                  {CUISINE_OPTIONS.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.chip, selectedCuisine.includes(tag) && styles.chipActive]}
                      onPress={() => isConnoisseur && toggleCuisine(tag)}
                    >
                      <Text
                        style={[styles.chipText, selectedCuisine.includes(tag) && styles.chipTextActive]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {(!noteType || noteType === 'WINE') && (
              <View style={styles.section}>
                <Text style={styles.label}>Wine Type</Text>
                <View style={styles.chips}>
                  {WINE_TYPE_OPTIONS.map((wt) => (
                    <TouchableOpacity
                      key={wt}
                      style={[styles.chip, selectedWineType === wt && styles.chipActive]}
                      onPress={() => isConnoisseur && setSelectedWineType(selectedWineType === wt ? '' : wt)}
                    >
                      <Text style={[styles.chipText, selectedWineType === wt && styles.chipTextActive]}>
                        {wt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {(!noteType || noteType === 'SPIRIT') && (
              <View style={styles.section}>
                <Text style={styles.label}>Spirit Type</Text>
                <View style={styles.chips}>
                  {SPIRIT_TYPE_OPTIONS.map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.chip, selectedSpiritType === st && styles.chipActive]}
                      onPress={() => isConnoisseur && setSelectedSpiritType(selectedSpiritType === st ? '' : st)}
                    >
                      <Text style={[styles.chipText, selectedSpiritType === st && styles.chipTextActive]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyButton, !isConnoisseur && styles.applyDisabled]}
                onPress={isConnoisseur ? handleApply : undefined}
              >
                <Text style={styles.applyText}>
                  {isConnoisseur ? 'Apply Filters' : 'Upgrade to Filter'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { ...typography.h3, color: colors.text },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  premiumLabel: { ...typography.caption, color: colors.accent },
  row: { flexDirection: 'row', gap: spacing.md },
  field: { flex: 1, marginBottom: spacing.md },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  section: { marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { ...typography.caption, color: colors.text },
  chipTextActive: { color: colors.textInverse },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearText: { ...typography.body, color: colors.textSecondary },
  applyButton: {
    flex: 2,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  applyDisabled: { backgroundColor: colors.textTertiary },
  applyText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },
});
