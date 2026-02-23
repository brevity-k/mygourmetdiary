'use client';

import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { GoogleMapsProvider } from './google-maps-provider';
import { DIARY_MAP_STYLES, MARKER_COLORS } from './map-styles';
import type { NoteType } from '@mygourmetdiary/shared-types';

const NOTE_TYPE_MARKER_COLOR: Record<string, string> = {
  RESTAURANT: MARKER_COLORS.restaurant,
  WINE: MARKER_COLORS.wine,
  SPIRIT: MARKER_COLORS.spirit,
  WINERY_VISIT: MARKER_COLORS.winery,
};

interface StaticVenueMapProps {
  lat: number;
  lng: number;
  venueName: string;
  noteType?: NoteType;
}

function StaticVenueMapInner({ lat, lng, venueName, noteType }: StaticVenueMapProps) {
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
  const pinColor = noteType ? NOTE_TYPE_MARKER_COLOR[noteType] ?? MARKER_COLORS.restaurant : MARKER_COLORS.restaurant;

  return (
    <div className="w-full h-[200px] rounded-lg overflow-hidden border border-border">
      <Map
        defaultCenter={{ lat, lng }}
        defaultZoom={15}
        gestureHandling="cooperative"
        disableDefaultUI
        zoomControl
        mapId={mapId}
        styles={mapId ? undefined : DIARY_MAP_STYLES}
      >
        <AdvancedMarker position={{ lat, lng }} title={venueName}>
          <Pin background={pinColor} glyphColor="#fff" borderColor={pinColor} />
        </AdvancedMarker>
      </Map>
    </div>
  );
}

export function StaticVenueMap(props: StaticVenueMapProps) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return null;

  return (
    <GoogleMapsProvider>
      <StaticVenueMapInner {...props} />
    </GoogleMapsProvider>
  );
}
