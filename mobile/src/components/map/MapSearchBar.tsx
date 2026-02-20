import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { venuesApi } from '../../api/endpoints';
import { VenueSelection } from '../../store/ui.store';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface MapSearchBarProps {
  mapCenter: { latitude: number; longitude: number };
  onVenueSelect: (venue: VenueSelection) => void;
}

interface VenueResult {
  placeId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export function MapSearchBar({ mapCenter, onVenueSelect }: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VenueResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.trim().length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        try {
          const data = await venuesApi.search(
            text.trim(),
            mapCenter.latitude,
            mapCenter.longitude,
          );
          setResults(data);
          setShowResults(true);
        } catch {
          setResults([]);
        }
      }, 300);
    },
    [mapCenter.latitude, mapCenter.longitude],
  );

  const handleSelect = useCallback(
    (venue: VenueResult) => {
      Keyboard.dismiss();
      setQuery('');
      setResults([]);
      setShowResults(false);
      onVenueSelect({
        placeId: venue.placeId,
        name: venue.name,
        address: venue.address ?? undefined,
        coordinate:
          venue.lat != null && venue.lng != null
            ? { latitude: venue.lat, longitude: venue.lng }
            : undefined,
      });
    },
    [onVenueSelect],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <MaterialIcons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={styles.input}
          placeholder="Search venues..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {showResults && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.placeId}
          keyboardShouldPersistTaps="handled"
          style={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelect(item)}
            >
              <MaterialIcons name="place" size={18} color={colors.textSecondary} />
              <View style={styles.resultText}>
                <Text style={styles.resultName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.address && (
                  <Text style={styles.resultAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  input: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.text,
    paddingVertical: 4,
  },
  resultsList: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    maxHeight: 240,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  resultText: {
    flex: 1,
  },
  resultName: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  resultAddress: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
