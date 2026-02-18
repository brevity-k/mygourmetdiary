import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Note, NoteType } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
}

function getNoteSubtitle(note: Note): string {
  const ext = note.extension;
  switch (note.type) {
    case NoteType.RESTAURANT:
      return [ext?.dishName, note.venue?.name].filter(Boolean).join(' at ');
    case NoteType.WINE:
      return [ext?.wineName, ext?.wineType, ext?.vintage].filter(Boolean).join(' · ');
    case NoteType.SPIRIT:
      return [ext?.spiritName, ext?.spiritType, ext?.subType].filter(Boolean).join(' · ');
    case NoteType.WINERY_VISIT:
      return note.venue?.name || 'Winery Visit';
    default:
      return '';
  }
}

function getTypeIcon(type: NoteType): keyof typeof MaterialIcons.glyphMap {
  switch (type) {
    case NoteType.RESTAURANT:
      return 'restaurant';
    case NoteType.WINE:
      return 'wine-bar';
    case NoteType.SPIRIT:
      return 'local-bar';
    case NoteType.WINERY_VISIT:
      return 'storefront';
  }
}

export function NoteCard({ note, onPress }: NoteCardProps) {
  const subtitle = getNoteSubtitle(note);
  const photo = note.photos?.[0];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={`${note.title}, rated ${note.rating} out of 10`}
    >
      {photo && (
        <Image source={{ uri: photo.publicUrl }} style={styles.photo} />
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialIcons
            name={getTypeIcon(note.type)}
            size={16}
            color={colors.textTertiary}
          />
          <Text style={styles.date}>
            {format(new Date(note.experiencedAt), 'MMM d, yyyy')}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {note.title}
        </Text>

        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.rating}>
            <Text style={styles.ratingText}>{note.rating}</Text>
            <Text style={styles.ratingMax}>/10</Text>
          </View>

          {note.extension?.wouldOrderAgain !== undefined && (
            <View style={styles.badge}>
              <MaterialIcons
                name={note.extension.wouldOrderAgain ? 'thumb-up' : 'thumb-down'}
                size={12}
                color={
                  note.extension.wouldOrderAgain
                    ? colors.success
                    : colors.textTertiary
                }
              />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  photo: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratingText: {
    ...typography.h3,
    color: colors.primary,
  },
  ratingMax: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  badge: {
    padding: 4,
  },
});
