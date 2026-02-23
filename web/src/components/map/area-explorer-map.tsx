'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { MapPin as MapPinType } from '@mygourmetdiary/shared-types';
import { Loader2 } from 'lucide-react';
import { areaExplorerApi } from '@/lib/api';
import { GoogleMapsProvider } from './google-maps-provider';
import { DIARY_MAP_STYLES, MARKER_COLORS, DEFAULT_CENTER, DEFAULT_ZOOM } from './map-styles';
import { useMapRegion } from './use-map-region';
import { VenuePreviewPanel, VenuePreviewBottomPanel } from './venue-preview-panel';
import { cn } from '@/lib/utils';

function getMarkerColor(pin: MapPinType): string {
  if (pin.myNoteCount > 0) return MARKER_COLORS.myNote;
  if (pin.friendNoteCount > 0) return MARKER_COLORS.friendNote;
  return MARKER_COLORS.generalNote;
}

type CategoryFilter = 'RESTAURANT' | 'WINERY_VISIT' | undefined;

function AreaExplorerMapInner() {
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
  const { queryRegion, radiusKm, handleCameraChange } = useMapRegion();
  const [category, setCategory] = useState<CategoryFilter>(undefined);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [selectedPin, setSelectedPin] = useState<MapPinType | null>(null);

  const { data: pins = [], isLoading } = useQuery({
    queryKey: [
      'mapPins',
      queryRegion.lat.toFixed(3),
      queryRegion.lng.toFixed(3),
      radiusKm.toFixed(1),
      category,
      friendsOnly,
    ],
    queryFn: () =>
      areaExplorerApi.getMapPins({
        lat: queryRegion.lat,
        lng: queryRegion.lng,
        radiusKm,
        category,
        friendsOnly,
      }),
  });

  const handleMarkerClick = useCallback((pin: MapPinType) => {
    setSelectedPin(pin);
  }, []);

  const toggleCategory = (cat: CategoryFilter) => {
    setCategory((prev) => (prev === cat ? undefined : cat));
  };

  return (
    <div className="relative w-full h-full">
      <Map
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        mapId={mapId}
        styles={mapId ? undefined : DIARY_MAP_STYLES}
        onCameraChanged={handleCameraChange}
      >
        <ClusteredMarkers pins={pins} onMarkerClick={handleMarkerClick} />
      </Map>

      {/* Filter chips */}
      <div className="absolute top-4 left-4 right-4 lg:right-auto flex gap-2 z-10">
        <FilterChip
          label="Friends Only"
          active={friendsOnly}
          onClick={() => setFriendsOnly(!friendsOnly)}
        />
        <FilterChip
          label="Restaurants"
          active={category === 'RESTAURANT'}
          onClick={() => toggleCategory('RESTAURANT')}
        />
        <FilterChip
          label="Wineries"
          active={category === 'WINERY_VISIT'}
          onClick={() => toggleCategory('WINERY_VISIT')}
        />
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-surface rounded-full px-3 py-1.5 shadow-md border border-border flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading...</span>
          </div>
        </div>
      )}

      {/* Venue preview - desktop panel */}
      {selectedPin && (
        <VenuePreviewPanel pin={selectedPin} onClose={() => setSelectedPin(null)} />
      )}

      {/* Venue preview - mobile bottom panel */}
      {selectedPin && (
        <VenuePreviewBottomPanel pin={selectedPin} onClose={() => setSelectedPin(null)} />
      )}
    </div>
  );
}

/** Clustered markers using @googlemaps/markerclusterer */
function ClusteredMarkers({
  pins,
  onMarkerClick,
}: {
  pins: MapPinType[];
  onMarkerClick: (pin: MapPinType) => void;
}) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new globalThis.Map());

  useEffect(() => {
    if (!map) return;
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({ map, markers: [] });
    }
  }, [map]);

  // Update clusterer when pins change
  useEffect(() => {
    if (!clustererRef.current) return;
    const currentMarkers = Array.from(markersRef.current.values());
    clustererRef.current.clearMarkers();
    clustererRef.current.addMarkers(currentMarkers);
  }, [pins]);

  const setMarkerRef = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null, key: string) => {
      if (marker) {
        markersRef.current.set(key, marker);
      } else {
        markersRef.current.delete(key);
      }
    },
    [],
  );

  return (
    <>
      {pins.map((pin) => {
        const color = getMarkerColor(pin);
        return (
          <AdvancedMarker
            key={pin.venue.id}
            position={{ lat: pin.venue.lat!, lng: pin.venue.lng! }}
            title={pin.venue.name}
            onClick={() => onMarkerClick(pin)}
            ref={(marker) => setMarkerRef(marker, pin.venue.id)}
          >
            <Pin background={color} glyphColor="#fff" borderColor={color} scale={0.9} />
          </AdvancedMarker>
        );
      })}
    </>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-surface text-foreground border-border hover:bg-surface-elevated',
      )}
    >
      {label}
    </button>
  );
}

export function AreaExplorerMap() {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <p className="text-muted-foreground text-sm">Google Maps API key not configured.</p>
      </div>
    );
  }

  return (
    <GoogleMapsProvider>
      <AreaExplorerMapInner />
    </GoogleMapsProvider>
  );
}
