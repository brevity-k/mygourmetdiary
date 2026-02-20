import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NoteCreationStackParamList } from '../../navigation/types';
import { useUIStore } from '../../store/ui.store';
import { colors, typography, spacing, borderRadius } from '../../theme';

type NavigationProp = NativeStackNavigationProp<NoteCreationStackParamList>;

const NOTE_TYPES = [
  {
    key: 'RestaurantNoteForm' as const,
    title: 'Restaurant / Dish',
    description: 'Log a specific dish you tried',
    icon: 'restaurant' as const,
  },
  {
    key: 'WineNoteForm' as const,
    title: 'Wine',
    description: 'Record a wine tasting note',
    icon: 'wine-bar' as const,
  },
  {
    key: 'SpiritNoteForm' as const,
    title: 'Spirit',
    description: 'Whiskey, sake, tequila, and more',
    icon: 'local-bar' as const,
  },
  {
    key: 'WineryVisitNoteForm' as const,
    title: 'Winery / Distillery Visit',
    description: 'Document your visit experience',
    icon: 'storefront' as const,
  },
];

export function NoteTypeSelectScreen() {
  const navigation = useNavigation<NavigationProp>();
  const pendingVenue = useUIStore((s) => s.pendingVenue);

  const handleSelect = (screen: keyof NoteCreationStackParamList) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>What are you noting?</Text>

      {pendingVenue && (
        <View style={styles.venueBanner}>
          <MaterialIcons name="place" size={18} color={colors.primary} />
          <Text style={styles.venueBannerText} numberOfLines={1}>
            Writing note for: {pendingVenue.name}
          </Text>
        </View>
      )}

      <View style={styles.options}>
        {NOTE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={styles.option}
            onPress={() => handleSelect(type.key)}
            accessibilityLabel={type.title}
          >
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={type.icon}
                size={28}
                color={colors.primary}
              />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{type.title}</Text>
              <Text style={styles.optionDescription}>{type.description}</Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        ))}
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
  heading: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  venueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  venueBannerText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },
  options: {
    gap: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    ...typography.label,
    color: colors.text,
    fontSize: 16,
  },
  optionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
