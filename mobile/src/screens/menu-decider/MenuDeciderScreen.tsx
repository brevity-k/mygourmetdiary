import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { menuDeciderApi } from '../../api/endpoints';
import { DishCard } from '../../components/menu-decider/DishCard';
import { PremiumGate } from '../../components/common/PremiumGate';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, typography, spacing } from '../../theme';

type RouteParams = RouteProp<{ MenuDecider: { venueId: string; venueName: string } }, 'MenuDecider'>;

export function MenuDeciderScreen() {
  const route = useRoute<RouteParams>();
  const { venueId, venueName } = route.params;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['menuDecider', venueId],
    queryFn: () => menuDeciderApi.getRecommendations(venueId),
  });

  return (
    <PremiumGate featureName="Menu Decider">
      <View style={styles.container}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : isError ? (
          <EmptyState
            title="Could not load recommendations"
            description="Tap to retry"
            actionLabel="Retry"
            onAction={() => refetch()}
          />
        ) : data && data.dishes.length > 0 ? (
          <FlatList
            data={data.dishes}
            keyExtractor={(item) => item.dishName}
            renderItem={({ item }) => <DishCard dish={item} />}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.header}>
                <Text style={styles.venueName}>{data.venue.name}</Text>
                {data.venue.address && (
                  <Text style={styles.address}>{data.venue.address}</Text>
                )}
                <View style={styles.summaryRow}>
                  <MaterialIcons name="people" size={16} color={colors.accent} />
                  <Text style={styles.summaryText}>
                    {data.hasFriendData
                      ? 'Taste-matched friends have dined here'
                      : 'No friend data yet — showing community ratings'}
                  </Text>
                </View>
              </View>
            }
          />
        ) : (
          <EmptyState
            title="No dishes rated yet"
            description={`No one has rated dishes at ${venueName} yet. Be the first!`}
          />
        )}
      </View>
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center' },
  list: { padding: spacing.md },
  header: { marginBottom: spacing.lg, gap: spacing.xs },
  venueName: { ...typography.h2, color: colors.text },
  address: { ...typography.bodySmall, color: colors.textSecondary },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  summaryText: { ...typography.bodySmall, color: colors.textSecondary },
});
