import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { searchApi } from '../../api/endpoints';
import { NoteCard } from '../../components/notes/NoteCard';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius } from '../../theme';

type NavigationProp = NativeStackNavigationProp<SearchStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(text);
    }, 400);
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const hits = data?.hits || [];

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={styles.input}
          placeholder="Search your notes..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={handleChange}
          autoFocus
        />
        {query.length > 0 && (
          <MaterialIcons
            name="close"
            size={20}
            color={colors.textTertiary}
            onPress={() => {
              setQuery('');
              setDebouncedQuery('');
            }}
            accessibilityLabel="Clear search"
          />
        )}
      </View>

      <FlatList
        data={hits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
          />
        )}
        contentContainerStyle={[
          styles.list,
          hits.length === 0 && debouncedQuery.length >= 2 && styles.emptyList,
        ]}
        ListEmptyComponent={
          isError ? (
            <EmptyState
              title="Search failed"
              description="Something went wrong. Tap to retry."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : debouncedQuery.length >= 2 ? (
            <EmptyState
              title="No results"
              description={`No notes matching "${debouncedQuery}"`}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  list: { padding: spacing.md },
  emptyList: { flex: 1 },
});
