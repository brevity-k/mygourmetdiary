import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { colors, typography, spacing } from '../../theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Your Gourmet Journal',
    description:
      'Log detailed notes on every dish, wine, and spirit you experience. This is your personal diary — specific, structured, and private.',
  },
  {
    title: 'Four Note Types',
    description:
      'Restaurant dishes, wines, spirits, and winery visits. Each type has specialized fields to capture what matters most.',
  },
  {
    title: 'Organize with Binders',
    description:
      'Group your notes into collections like "Tokyo Ramen" or "California Pinots Under $30". Your notes, your way.',
  },
];

export function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const setOnboarded = useAuthStore((s) => s.setOnboarded);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      setOnboarded(true);
    }
  };

  const handleSkip = () => {
    setOnboarded(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        accessibilityLabel="Skip onboarding"
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconPlaceholder}>
              <Text style={styles.iconEmoji}>
                {item.title.includes('Journal')
                  ? '📓'
                  : item.title.includes('Four')
                    ? '🍽️'
                    : '📚'}
              </Text>
            </View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideDescription}>{item.description}</Text>
          </View>
        )}
        keyExtractor={(_, i) => String(i)}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          accessibilityLabel={
            activeIndex === SLIDES.length - 1 ? 'Get started' : 'Next slide'
          }
        >
          <Text style={styles.nextButtonText}>
            {activeIndex === SLIDES.length - 1 ? "Let's Go" : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    zIndex: 1,
    padding: spacing.sm,
  },
  skipText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  slide: {
    width,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconEmoji: {
    fontSize: 48,
  },
  slideTitle: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  slideDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  nextButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  nextButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
