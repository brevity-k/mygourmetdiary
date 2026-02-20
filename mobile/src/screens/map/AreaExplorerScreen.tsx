import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, Platform } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE, PoiClickEvent } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { areaExplorerApi } from '../../api/endpoints';
import { VenuePreviewCard } from '../../components/map/VenuePreviewCard';
import { MapSearchBar } from '../../components/map/MapSearchBar';
import { useSubscriptionStore } from '../../store/subscription.store';
import { useUIStore, VenueSelection } from '../../store/ui.store';
import { SearchStackParamList } from '../../navigation/types';
import { MapPin } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

type NavigationProp = NativeStackNavigationProp<SearchStackParamList>;

const { width, height } = Dimensions.get('window');

// Default to Los Angeles (launch market)
const DEFAULT_REGION: Region = {
  latitude: 34.0522,
  longitude: -118.2437,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function getMarkerColor(pin: MapPin): string {
  if (pin.myNoteCount > 0) return colors.primary; // brown — "I've been here"
  if (pin.friendNoteCount > 0) return '#D4A017'; // gold — "Friends visited"
  return colors.textTertiary; // gray — general notes
}

export function AreaExplorerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isConnoisseur = useSubscriptionStore((s) => s.isActive);
  const openNoteCreation = useUIStore((s) => s.openNoteCreation);

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [category, setCategory] = useState<string | undefined>();
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<VenueSelection | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [queryRegion, setQueryRegion] = useState(DEFAULT_REGION);

  const radiusKm = Math.max(
    queryRegion.latitudeDelta * 111 * 0.5,
    1,
  );

  const { data: pins = [], isLoading } = useQuery({
    queryKey: [
      'mapPins',
      queryRegion.latitude.toFixed(3),
      queryRegion.longitude.toFixed(3),
      radiusKm.toFixed(1),
      category,
      friendsOnly,
    ],
    queryFn: () =>
      areaExplorerApi.getMapPins({
        lat: queryRegion.latitude,
        lng: queryRegion.longitude,
        radiusKm,
        category,
        friendsOnly,
      }),
  });

  const handleRegionChange = useCallback((newRegion: Region) => {
    setRegion(newRegion);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQueryRegion(newRegion);
    }, 500);
  }, []);

  const handleMarkerPress = useCallback((pin: MapPin) => {
    setSelectedPin(pin);
    setSelectedPoi(null);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handlePoiClick = useCallback((event: PoiClickEvent) => {
    const { placeId, name, coordinate } = event.nativeEvent;
    // Check if this POI already has a DB marker
    const existingPin = pins.find((p) => p.venue.placeId === placeId);
    if (existingPin) {
      handleMarkerPress(existingPin);
      return;
    }
    // Show as POI venue (no notes in our DB)
    setSelectedPoi({
      placeId,
      name,
      coordinate: { latitude: coordinate.latitude, longitude: coordinate.longitude },
    });
    setSelectedPin(null);
    bottomSheetRef.current?.snapToIndex(0);
  }, [pins, handleMarkerPress]);

  const handleVenueFromSearch = useCallback((venue: VenueSelection) => {
    setSelectedPoi(venue);
    setSelectedPin(null);
    bottomSheetRef.current?.snapToIndex(0);
    if (venue.coordinate) {
      mapRef.current?.animateToRegion({
        ...venue.coordinate,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  }, []);

  const toggleFriendsOnly = () => {
    if (!isConnoisseur && !friendsOnly) return;
    setFriendsOnly(!friendsOnly);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'ios' ? PROVIDER_GOOGLE : undefined}
        initialRegion={DEFAULT_REGION}
        onRegionChangeComplete={handleRegionChange}
        onPoiClick={handlePoiClick}
        showsUserLocation
        showsMyLocationButton
      >
        {pins.map((pin) => (
          <Marker
            key={pin.venue.id}
            coordinate={{
              latitude: pin.venue.lat!,
              longitude: pin.venue.lng!,
            }}
            pinColor={getMarkerColor(pin)}
            onPress={() => handleMarkerPress(pin)}
          />
        ))}
      </MapView>

      {/* Search bar overlay */}
      <MapSearchBar
        mapCenter={{ latitude: region.latitude, longitude: region.longitude }}
        onVenueSelect={handleVenueFromSearch}
      />

      {/* Filters overlay */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            friendsOnly && styles.filterActive,
            !isConnoisseur && !friendsOnly && styles.filterLocked,
          ]}
          onPress={toggleFriendsOnly}
        >
          <MaterialIcons
            name={friendsOnly ? 'people' : 'people-outline'}
            size={16}
            color={friendsOnly ? colors.textInverse : colors.text}
          />
          <Text style={[styles.filterText, friendsOnly && styles.filterTextActive]}>
            Friends Only
          </Text>
          {!isConnoisseur && !friendsOnly && (
            <MaterialIcons name="lock" size={12} color={colors.textTertiary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, category === 'RESTAURANT' && styles.filterActive]}
          onPress={() => setCategory(category === 'RESTAURANT' ? undefined : 'RESTAURANT')}
        >
          <Text style={[styles.filterText, category === 'RESTAURANT' && styles.filterTextActive]}>
            Restaurants
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, category === 'WINERY_VISIT' && styles.filterActive]}
          onPress={() => setCategory(category === 'WINERY_VISIT' ? undefined : 'WINERY_VISIT')}
        >
          <Text style={[styles.filterText, category === 'WINERY_VISIT' && styles.filterTextActive]}>
            Wineries
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <ActivityIndicator
          style={styles.loader}
          size="small"
          color={colors.primary}
        />
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={[200]}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={{ backgroundColor: colors.textTertiary }}
      >
        <BottomSheetView style={styles.sheetContent}>
          {selectedPin && (
            <VenuePreviewCard
              pin={selectedPin}
              onViewNotes={() =>
                navigation.navigate('NoteDetail', { noteId: selectedPin.venue.id })
              }
              onWriteNote={() =>
                openNoteCreation({
                  placeId: selectedPin.venue.placeId,
                  name: selectedPin.venue.name,
                  address: selectedPin.venue.address ?? undefined,
                  coordinate: selectedPin.venue.lat != null && selectedPin.venue.lng != null
                    ? { latitude: selectedPin.venue.lat, longitude: selectedPin.venue.lng }
                    : undefined,
                })
              }
              onMenuDecider={
                isConnoisseur && selectedPin.category === 'RESTAURANT'
                  ? () =>
                      navigation.navigate('MenuDecider', {
                        venueId: selectedPin.venue.id,
                        venueName: selectedPin.venue.name,
                      })
                  : undefined
              }
            />
          )}
          {selectedPoi && !selectedPin && (
            <VenuePreviewCard
              poiVenue={selectedPoi}
              onWriteNote={() => openNoteCreation(selectedPoi)}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  filters: {
    position: 'absolute',
    top: 72,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  filterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterLocked: { opacity: 0.6 },
  filterText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  filterTextActive: { color: colors.textInverse },
  loader: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
  },
  sheetBackground: { backgroundColor: colors.background },
  sheetContent: { paddingHorizontal: spacing.md },
});
