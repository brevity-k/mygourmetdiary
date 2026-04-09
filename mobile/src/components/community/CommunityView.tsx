import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { MaterialIcons } from '@expo/vector-icons';
import { communityApi } from '../../api/endpoints';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { RatingDistribution } from './RatingDistribution';
import { TopGourmetsRow } from './TopGourmetsRow';
import { NoteTierBadge } from './NoteTierBadge';
import {
  CommunityStats,
  CommunityGourmet,
  SocialNote,
  NoteType,
  PaginatedResponse,
} from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

export interface CommunityViewProps {
  subjectType: 'venue' | 'product';
  subjectId: string;
  heroComponent: React.ReactNode | ((stats: CommunityStats | null) => React.ReactNode);
  onGourmetPress: (userId: string) => void;
  onNotePress: (noteId: string) => void;
  onWriteNote: () => void;
}

const NOTE_TYPE_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  RESTAURANT: 'restaurant',
  WINE: 'wine-bar',
  SPIRIT: 'local-bar',
  WINERY_VISIT: 'storefront',
};

function getBestSimilarityPercent(note: SocialNote): number | undefined {
  // The tier similarity is derived from the author's taste similarity if available
  return undefined;
}

function CommunityNoteCard({
  note,
  onPress,
}: {
  note: SocialNote;
  onPress: () => void;
}) {
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
        <View style={styles.noteTitleRow}>
          <Text style={styles.noteTitle} numberOfLines={1}>
            {note.title}
          </Text>
          {note.tier != null && (
            <NoteTierBadge
              tier={note.tier}
              similarityPercent={getBestSimilarityPercent(note)}
            />
          )}
        </View>
        {note.author && (
          <Text style={styles.authorName} numberOfLines={1}>
            by {note.author.displayName}
          </Text>
        )}
        {subtitle && (
          <Text style={styles.noteSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
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

export function CommunityView({
  subjectType,
  subjectId,
  heroComponent,
  onGourmetPress,
  onNotePress,
  onWriteNote,
}: CommunityViewProps) {
  const statsQuery = useQuery<CommunityStats>({
    queryKey: ['communityStats', subjectType, subjectId],
    queryFn: () => communityApi.getStats(subjectType, subjectId),
  });

  const gourmetsQuery = useQuery<CommunityGourmet[]>({
    queryKey: ['communityGourmets', subjectType, subjectId],
    queryFn: () => communityApi.getGourmets(subjectType, subjectId, 20),
  });

  const notesQuery = useInfiniteQuery<PaginatedResponse<SocialNote>>({
    queryKey: ['communityNotes', subjectType, subjectId],
    queryFn: ({ pageParam }) =>
      communityApi.getNotes(
        subjectType,
        subjectId,
        pageParam as string | undefined,
        20,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });

  const allNotes =
    notesQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const stats = statsQuery.data ?? null;
  const gourmets = gourmetsQuery.data ?? [];

  const isInitialLoading =
    statsQuery.isLoading && gourmetsQuery.isLoading && notesQuery.isLoading;

  if (isInitialLoading) return <LoadingSpinner />;

  const resolvedHero =
    typeof heroComponent === 'function' ? heroComponent(stats) : heroComponent;

  const ListHeader = (
    <View>
      {resolvedHero}
      {stats && Object.keys(stats.ratingDistribution).length > 0 && (
        <RatingDistribution distribution={stats.ratingDistribution} />
      )}
      <TopGourmetsRow gourmets={gourmets} onGourmetPress={onGourmetPress} />
      {allNotes.length > 0 && (
        <Text style={styles.sectionHeader}>Community Notes</Text>
      )}
    </View>
  );

  const ListEmpty = notesQuery.isLoading ? null : (
    <EmptyState
      title="No notes yet"
      description="Be the first to write a note!"
      actionLabel="Write a Note"
      onAction={onWriteNote}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={allNotes}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CommunityNoteCard
            note={item}
            onPress={() => onNotePress(item.id)}
          />
        )}
        onEndReached={() => {
          if (notesQuery.hasNextPage && !notesQuery.isFetchingNextPage) {
            notesQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          notesQuery.isFetchingNextPage ? (
            <ActivityIndicator
              style={styles.footer}
              size="small"
              color={colors.primary}
            />
          ) : null
        }
      />

      {/* Write Note FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onWriteNote}
        activeOpacity={0.8}
      >
        <MaterialIcons name="edit" size={24} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingBottom: spacing.xxl + spacing.xl,
  },
  sectionHeader: {
    ...typography.h3,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
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
  noteInfo: {
    flex: 1,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  noteTitle: {
    ...typography.label,
    color: colors.text,
    flex: 1,
  },
  authorName: {
    ...typography.caption,
    color: colors.accent,
    marginTop: 2,
  },
  noteSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  dateText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  footer: {
    paddingVertical: spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
