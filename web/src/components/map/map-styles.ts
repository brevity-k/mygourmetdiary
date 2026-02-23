export const DIARY_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ saturation: -40 }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#c9d8e8' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f5f0e8' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#e8e0d4' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d4cabb' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ddd5c5' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry.fill',
    stylers: [{ color: '#e6ddd0' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#d4ddc4' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b5b4e' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#f5f0e8' }, { weight: 3 }],
  },
];

export const MARKER_COLORS = {
  restaurant: '#8B4513',
  wine: '#8B0000',
  spirit: '#D4A017',
  winery: '#4A7C59',
  myNote: '#8B4513',
  friendNote: '#D4A017',
  generalNote: '#9CA3AF',
} as const;

export const DEFAULT_CENTER = { lat: 34.0522, lng: -118.2437 }; // Los Angeles
export const DEFAULT_ZOOM = 13;
