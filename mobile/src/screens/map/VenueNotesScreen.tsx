import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { MaterialIcons } from '@expo/vector-icons';
import { areaExplorerApi } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchStackParamList } from '../../navigation/types';
import { Note, NoteType } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

type RouteType = RouteProp<SearchStackParamList, 'VenueNotes'>;
type NavProp = NativeStackNavigationProp<SearchStackParamList>;

const NOTE_TYPE_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  RESTAURANT: 'restaurant',
  WINE: 'wine-bar',
  SPIRIT: 'local-bar',
  WINERY_VISIT: 'storefront',
};

function NoteCard({ note, onPress }: { note: Note; onPress: () => void }) {
  const icon = NOTE_TYPE_ICONS[note.type] ?? 'description';
  const ext = note.extension;
  const subtitle =
    note.type === NoteType.RESTAURANT
      ? ext?.dishName
      : note.type === NoteType.WINE
        ? ext?.wineName
        : note.type === NoteType.SPIRIT
          ? ext?.spiritName
          : null;

  return (
    <TouchableOpacity style={styles.noteCard} onPress={onPress} activeOpacity={0.7}>
      {note.photos?.length > 0 ? (
        <Image source={{ uri: note.photos[0].publicUrl }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderThumb]}>
          <MaterialIcons name={icon} size={24} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.noteInfo}>
        <Text style={styles.noteTitle} numberOfLines={1}>{note.title}</Text>
        {subtitle && (
          <Text style={styles.noteSubtitle} numberOfLines={1}>{subtitle}</Text>
        )}
        <View style={styles.noteMeta}>
          <View style={styles.ratingBadge}>
            <MaterialIcons name="star" size={12} color={colors.ratingActive} />
            <Text style={styles.ratingText}>{note.rating}/10</Text>
          </View>
          <Text style={styles.dateText}>
            {format(new Date(note.experiencedAt), 'MMM d, yyyy')}
          </Text>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

export function VenueNotesScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavProp>();
  const { venueId, venueName } = route.params;

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: venueName });
  }, [navigation, venueName]);

  const { data: notes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['venueNotes', venueId],
    queryFn: () => areaExplorerApi.getVenueNotes(venueId),
  });

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <EmptyState
        title="Something went wrong"
        description="Could not load notes for this venue."
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    );
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        title="No notes yet"
        description="Be the first to write a note for this venue!"
      />
    );
  }

  return (
    <FlatList
      data={notes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <NoteCard
          note={item}
          onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.sm },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
  },
  placeholderThumb: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteInfo: { flex: 1 },
  noteTitle: { ...typography.label, color: colors.text },
  noteSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  noteMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  dateText: { ...typography.caption, color: colors.textTertiary },
});
