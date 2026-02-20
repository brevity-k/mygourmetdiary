import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { venuesApi } from '../../api/endpoints';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface VenueSearchInputProps {
  value: { placeId: string; name: string; address: string } | null;
  onChange: (venue: { placeId: string; name: string; address: string } | null) => void;
  label?: string;
}

export function VenueSearchInput({
  value,
  onChange,
  label = 'Venue',
}: VenueSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.length < 2) {
        setResults([]);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const data = await venuesApi.search(text);
          setResults(data);
        } catch {
          setResults([]);
        }
        setSearching(false);
      }, 400);
    },
    [],
  );

  const handleSelect = (venue: any) => {
    onChange({
      placeId: venue.placeId,
      name: venue.name,
      address: venue.address || '',
    });
    setQuery('');
    setResults([]);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setResults([]);
  };

  if (value) {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={styles.selected}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName}>{value.name}</Text>
            <Text style={styles.selectedAddress} numberOfLines={1}>
              {value.address}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClear} accessibilityLabel="Clear venue">
            <MaterialIcons name="close" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <MaterialIcons
          name="search"
          size={20}
          color={colors.textTertiary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Search for a venue..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={handleSearch}
        />
      </View>

      {results.length > 0 && (
        <View style={styles.dropdown}>
          {results.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.placeId}
              style={styles.result}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultAddress} numberOfLines={1}>
                {item.address}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    zIndex: 10,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  searchIcon: {
    marginLeft: spacing.md,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  result: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  resultName: {
    ...typography.label,
    color: colors.text,
  },
  resultAddress: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    ...typography.label,
    color: colors.text,
  },
  selectedAddress: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
