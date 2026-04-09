import React from 'react';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { venuesApi } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { CommunityView } from '../../components/community/CommunityView';
import { VenueHero } from '../../components/community/VenueHero';
import { useUIStore } from '../../store/ui.store';
import { SearchStackParamList } from '../../navigation/types';
import { Venue } from '../../types';

type RouteType = RouteProp<SearchStackParamList, 'VenueCommunity'>;
type NavProp = NativeStackNavigationProp<SearchStackParamList>;

export function VenueCommunityScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavProp>();
  const { venueId, venueName } = route.params;
  const openNoteCreation = useUIStore((s) => s.openNoteCreation);

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: venueName });
  }, [navigation, venueName]);

  const venueQuery = useQuery<Venue>({
    queryKey: ['venue', venueId],
    queryFn: () => venuesApi.get(venueId),
  });

  if (venueQuery.isLoading) return <LoadingSpinner />;

  if (venueQuery.isError || !venueQuery.data) {
    return (
      <EmptyState
        title="Something went wrong"
        description="Could not load venue details."
        actionLabel="Retry"
        onAction={() => venueQuery.refetch()}
      />
    );
  }

  const venue = venueQuery.data;

  return (
    <CommunityView
      subjectType="venue"
      subjectId={venueId}
      heroComponent={(stats) => (
        <VenueHero venue={venue} stats={stats} />
      )}
      onGourmetPress={(userId) =>
        navigation.navigate('UserProfile', { userId })
      }
      onNotePress={(noteId) =>
        navigation.navigate('NoteDetail', { noteId })
      }
      onWriteNote={() =>
        openNoteCreation({
          placeId: venue.placeId,
          name: venue.name,
          address: venue.address ?? undefined,
          coordinate:
            venue.lat != null && venue.lng != null
              ? { latitude: venue.lat, longitude: venue.lng }
              : undefined,
        })
      }
    />
  );
}
