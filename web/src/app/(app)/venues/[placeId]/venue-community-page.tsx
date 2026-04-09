'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Venue, CommunityStats } from '@mygourmetdiary/shared-types';
import { venuesApi, communityApi } from '@/lib/api';
import { CommunityView } from '@/components/community/community-view';
import { VenueHero } from '@/components/community/venue-hero';
import { Skeleton } from '@/components/ui/skeleton';

interface VenueCommunityPageProps {
  paramsPromise: Promise<{ placeId: string }>;
}

export function VenueCommunityPage({ paramsPromise }: VenueCommunityPageProps) {
  const { placeId } = use(paramsPromise);

  const venueQuery = useQuery<Venue>({
    queryKey: ['venue', placeId],
    queryFn: () => venuesApi.get(placeId),
  });

  const venue = venueQuery.data;
  const venueId = venue?.id;

  const statsQuery = useQuery<CommunityStats>({
    queryKey: ['community', 'stats', 'venue', venueId],
    queryFn: () => communityApi.getStats('venue', venueId!),
    enabled: !!venueId,
  });

  if (venueQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (venueQuery.isError || !venue || !venueId) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Venue not found.</p>
      </div>
    );
  }

  const venueName = venue.name || '';
  const writeNoteHref = `/notes/new/restaurant?venueId=${encodeURIComponent(placeId)}&venueName=${encodeURIComponent(venueName)}`;

  return (
    <CommunityView
      subjectType="venue"
      subjectId={venueId}
      hero={
        <VenueHero
          venue={venue}
          stats={statsQuery.data}
          isLoading={statsQuery.isLoading}
        />
      }
      writeNoteHref={writeNoteHref}
    />
  );
}
