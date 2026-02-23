'use client';

import { useState, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import type { Note, NoteType } from '@mygourmetdiary/shared-types';
import { notesApi } from '@/lib/api';
import { GoogleMapsProvider } from './google-maps-provider';
import { DIARY_MAP_STYLES, MARKER_COLORS, DEFAULT_CENTER, DEFAULT_ZOOM } from './map-styles';
import { VenueInfoPopover } from './venue-info-popover';
import { Skeleton } from '@/components/ui/skeleton';

const NOTE_TYPE_PIN_COLOR: Record<string, string> = {
  RESTAURANT: MARKER_COLORS.restaurant,
  WINE: MARKER_COLORS.wine,
  SPIRIT: MARKER_COLORS.spirit,
  WINERY_VISIT: MARKER_COLORS.winery,
};

interface FeedMapViewProps {
  typeFilter?: NoteType;
  binderId?: string;
}

function FeedMapViewInner({ typeFilter, binderId }: FeedMapViewProps) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  const { data, isLoading } = useInfiniteQuery({
    queryKey: ['notes', 'feed', { type: typeFilter, binderId }],
    queryFn: ({ pageParam }) =>
      notesApi.feed({
        cursor: pageParam ?? undefined,
        limit: 100,
        type: typeFilter,
        binderId,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: null as string | null,
  });

  const notes = data?.pages.flatMap((p) => p.items) ?? [];
  const notesWithLocation = notes.filter(
    (n) => n.venue?.lat != null && n.venue?.lng != null,
  );

  const handleMarkerClick = useCallback((note: Note) => {
    setSelectedNote(note);
  }, []);

  if (isLoading) {
    return <Skeleton className="w-full h-[500px] rounded-lg" />;
  }

  if (notesWithLocation.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-lg border border-border bg-surface">
        <p className="text-muted-foreground">No notes with location data yet.</p>
      </div>
    );
  }

  // Compute bounds to fit all markers
  const lats = notesWithLocation.map((n) => n.venue!.lat!);
  const lngs = notesWithLocation.map((n) => n.venue!.lng!);
  const center = {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-border">
      <Map
        defaultCenter={notesWithLocation.length > 0 ? center : DEFAULT_CENTER}
        defaultZoom={notesWithLocation.length === 1 ? 15 : DEFAULT_ZOOM}
        gestureHandling="cooperative"
        disableDefaultUI
        zoomControl
        mapId={mapId}
        styles={mapId ? undefined : DIARY_MAP_STYLES}
      >
        {notesWithLocation.map((note) => {
          const pinColor = NOTE_TYPE_PIN_COLOR[note.type] ?? MARKER_COLORS.restaurant;
          return (
            <AdvancedMarker
              key={note.id}
              position={{ lat: note.venue!.lat!, lng: note.venue!.lng! }}
              title={note.title}
              onClick={() => handleMarkerClick(note)}
            >
              <Pin background={pinColor} glyphColor="#fff" borderColor={pinColor} scale={0.9} />
            </AdvancedMarker>
          );
        })}

        {selectedNote?.venue && (
          <InfoWindow
            position={{ lat: selectedNote.venue.lat!, lng: selectedNote.venue.lng! }}
            onCloseClick={() => setSelectedNote(null)}
          >
            <VenueInfoPopover
              venue={selectedNote.venue}
              noteCount={1}
              avgRating={selectedNote.rating}
            />
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}

export function FeedMapView(props: FeedMapViewProps) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-lg border border-border bg-surface">
        <p className="text-muted-foreground text-sm">Google Maps API key not configured.</p>
      </div>
    );
  }

  return (
    <GoogleMapsProvider>
      <FeedMapViewInner {...props} />
    </GoogleMapsProvider>
  );
}
