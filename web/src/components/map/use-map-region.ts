'use client';

import { useState, useRef, useCallback } from 'react';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './map-styles';

export interface MapRegion {
  lat: number;
  lng: number;
  zoom: number;
}

interface UseMapRegionOptions {
  debounceMs?: number;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

export function useMapRegion(options: UseMapRegionOptions = {}) {
  const {
    debounceMs = 500,
    initialCenter = DEFAULT_CENTER,
    initialZoom = DEFAULT_ZOOM,
  } = options;

  const [queryRegion, setQueryRegion] = useState<MapRegion>({
    lat: initialCenter.lat,
    lng: initialCenter.lng,
    zoom: initialZoom,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCameraChange = useCallback(
    (ev: { detail: { center: { lat: number; lng: number }; zoom: number } }) => {
      const { center, zoom } = ev.detail;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setQueryRegion({ lat: center.lat, lng: center.lng, zoom });
      }, debounceMs);
    },
    [debounceMs],
  );

  // Approximate radius in km from zoom level
  // zoom 13 ~ 5km, zoom 15 ~ 1.5km, zoom 11 ~ 20km
  const radiusKm = Math.max(40000 / Math.pow(2, queryRegion.zoom) * 0.5, 1);

  return { queryRegion, radiusKm, handleCameraChange };
}
