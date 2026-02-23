'use client';

import { useState, useCallback } from 'react';
import { Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import type { Note } from '@mygourmetdiary/shared-types';
import { GoogleMapsProvider } from './google-maps-provider';
import { DIARY_MAP_STYLES, MARKER_COLORS, DEFAULT_CENTER, DEFAULT_ZOOM } from './map-styles';
import { VenueInfoPopover } from './venue-info-popover';
import { NoteCard } from '@/components/note-card';
import { cn } from '@/lib/utils';

const NOTE_TYPE_PIN_COLOR: Record<string, string> = {
  RESTAURANT: MARKER_COLORS.restaurant,
  WINE: MARKER_COLORS.wine,
  SPIRIT: MARKER_COLORS.spirit,
  WINERY_VISIT: MARKER_COLORS.winery,
};

interface SearchMapViewProps {
  notes: Note[];
  highlightedNoteId?: string;
  onNoteHover?: (noteId: string | null) => void;
}

function SearchMapViewInner({ notes, highlightedNoteId, onNoteHover }: SearchMapViewProps) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  const notesWithLocation = notes.filter(
    (n) => n.venue?.lat != null && n.venue?.lng != null,
  );

  const handleMarkerClick = useCallback((note: Note) => {
    setSelectedNote(note);
  }, []);

  // Compute bounds
  const lats = notesWithLocation.map((n) => n.venue!.lat!);
  const lngs = notesWithLocation.map((n) => n.venue!.lng!);
  const center =
    notesWithLocation.length > 0
      ? {
          lat: (Math.min(...lats) + Math.max(...lats)) / 2,
          lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
        }
      : DEFAULT_CENTER;

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[500px]">
      {/* List panel */}
      <div className="lg:w-[360px] shrink-0 space-y-3 max-h-[600px] overflow-y-auto">
        {notes.map((note) => (
          <div
            key={note.id}
            onMouseEnter={() => onNoteHover?.(note.id)}
            onMouseLeave={() => onNoteHover?.(null)}
            className={cn(
              'rounded-lg transition-shadow',
              highlightedNoteId === note.id && 'ring-2 ring-primary',
            )}
          >
            <NoteCard note={note} />
          </div>
        ))}
      </div>

      {/* Map panel */}
      <div className="flex-1 h-[500px] lg:h-auto rounded-lg overflow-hidden border border-border">
        <Map
          defaultCenter={center}
          defaultZoom={notesWithLocation.length <= 1 ? 15 : DEFAULT_ZOOM}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          mapId={mapId}
          styles={mapId ? undefined : DIARY_MAP_STYLES}
        >
          {notesWithLocation.map((note) => {
            const pinColor = NOTE_TYPE_PIN_COLOR[note.type] ?? MARKER_COLORS.restaurant;
            const isHighlighted = highlightedNoteId === note.id;
            return (
              <AdvancedMarker
                key={note.id}
                position={{ lat: note.venue!.lat!, lng: note.venue!.lng! }}
                title={note.title}
                onClick={() => handleMarkerClick(note)}
                zIndex={isHighlighted ? 10 : 1}
              >
                <Pin
                  background={isHighlighted ? '#ef4444' : pinColor}
                  glyphColor="#fff"
                  borderColor={isHighlighted ? '#ef4444' : pinColor}
                  scale={isHighlighted ? 1.2 : 0.9}
                />
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
    </div>
  );
}

export function SearchMapView(props: SearchMapViewProps) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-lg border border-border bg-surface">
        <p className="text-muted-foreground text-sm">Google Maps API key not configured.</p>
      </div>
    );
  }

  return (
    <GoogleMapsProvider>
      <SearchMapViewInner {...props} />
    </GoogleMapsProvider>
  );
}
