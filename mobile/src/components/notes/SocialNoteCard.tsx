import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SocialNote } from '../../types';
import { NoteCard } from './NoteCard';
import { UserCard } from '../social/UserCard';
import { TierBadge } from '../social/TierBadge';
import { TasteSignalButtons } from '../social/TasteSignalButtons';
import { colors, spacing, borderRadius } from '../../theme';

interface SocialNoteCardProps {
  note: SocialNote;
  onPress: () => void;
  onAuthorPress?: () => void;
}

export function SocialNoteCard({ note, onPress, onAuthorPress }: SocialNoteCardProps) {
  return (
    <View style={styles.container}>
      {note.author && (
        <View style={styles.authorRow}>
          <UserCard
            user={note.author}
            onPress={onAuthorPress}
            rightElement={
              note.tier && note.tier <= 3 ? (
                <TierBadge tier={note.tier} />
              ) : undefined
            }
          />
        </View>
      )}

      <NoteCard note={note} onPress={onPress} />

      <View style={styles.signals}>
        <TasteSignalButtons noteId={note.id} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  authorRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  signals: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
