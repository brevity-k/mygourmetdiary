import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  SectionList,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { searchApi, socialSearchApi } from '../../api/endpoints';
import { NoteCard } from '../../components/notes/NoteCard';
import { SocialNoteCard } from '../../components/notes/SocialNoteCard';
import { TierBadge } from '../../components/social/TierBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchStackParamList } from '../../navigation/types';
import { SocialNote } from '../../types';
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

  // Personal search
  const personalSearch = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  // Social tiered search
  const socialSearch = useQuery({
    queryKey: ['search', 'public', debouncedQuery],
    queryFn: () => socialSearchApi.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const hasQuery = debouncedQuery.length >= 2;
  const personalHits = personalSearch.data?.hits || [];

  // Build tiered sections from social search
  const sections = [];
  if (socialSearch.data) {
    const { tier1, tier2, tier3, tier4 } = socialSearch.data;
    if (tier1.length > 0) sections.push({ title: 'Gourmet Friends', tier: 1, data: tier1 });
    if (tier2.length > 0) sections.push({ title: 'High Match', tier: 2, data: tier2 });
    if (tier3.length > 0) sections.push({ title: 'Moderate Match', tier: 3, data: tier3 });
    if (tier4.length > 0) sections.push({ title: 'Other Results', tier: 4, data: tier4 });
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={styles.input}
          placeholder="Search notes..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={handleChange}
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

      {/* Quick access cards when search is empty */}
      {!hasQuery && (
        <View style={styles.quickAccess}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Explore')}
          >
            <MaterialIcons name="explore" size={28} color={colors.primary} />
            <Text style={styles.quickTitle}>Explore</Text>
            <Text style={styles.quickDesc}>Browse public notes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Discover')}
          >
            <MaterialIcons name="people" size={28} color={colors.primary} />
            <Text style={styles.quickTitle}>Discover</Text>
            <Text style={styles.quickDesc}>Find taste matches</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tiered results when searching */}
      {hasQuery && sections.length > 0 && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <TierBadge tier={section.tier} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <SocialNoteCard
              note={item as SocialNote}
              onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
              onAuthorPress={
                (item as SocialNote).author
                  ? () => navigation.navigate('UserProfile', { userId: (item as SocialNote).author!.id })
                  : undefined
              }
            />
          )}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Personal results fallback */}
      {hasQuery && sections.length === 0 && personalHits.length > 0 && (
        <FlatList
          data={personalHits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      {hasQuery && personalHits.length === 0 && sections.length === 0 && !personalSearch.isLoading && (
        <EmptyState
          title="No results"
          description={`No notes matching "${debouncedQuery}"`}
        />
      )}
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
  quickAccess: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickTitle: {
    ...typography.h3,
    color: colors.text,
  },
  quickDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  list: { padding: spacing.md },
});
