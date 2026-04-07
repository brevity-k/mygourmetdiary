/**
 * Approximate bounding box for a point + radius on earth.
 *
 * Uses the simplification that 1 degree latitude ~ 111 km.
 * Longitude delta is adjusted by cos(latitude).
 */
export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function computeBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number,
): BoundingBox {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}
