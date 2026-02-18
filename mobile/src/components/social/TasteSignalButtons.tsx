import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { tasteSignalsApi } from '../../api/endpoints';
import { TasteSignalType, TasteSignalSummary } from '../../types';
import { RatingInputModal } from './RatingInputModal';
import { colors, typography, spacing } from '../../theme';

interface TasteSignalButtonsProps {
  noteId: string;
}

export function TasteSignalButtons({ noteId }: TasteSignalButtonsProps) {
  const queryClient = useQueryClient();
  const [ratingModal, setRatingModal] = useState<{
    visible: boolean;
    type: TasteSignalType.ECHOED | TasteSignalType.DIVERGED;
  }>({ visible: false, type: TasteSignalType.ECHOED });

  const { data: summary } = useQuery({
    queryKey: ['signals', noteId],
    queryFn: () => tasteSignalsApi.getSummary(noteId),
  });

  const sendMutation = useMutation({
    mutationFn: ({ signalType, rating }: { signalType: TasteSignalType; rating?: number }) =>
      tasteSignalsApi.send(noteId, signalType, rating),
    onMutate: async ({ signalType }) => {
      await queryClient.cancelQueries({ queryKey: ['signals', noteId] });
      const prev = queryClient.getQueryData<TasteSignalSummary>(['signals', noteId]);
      if (prev) {
        const updated = { ...prev };
        if (!updated.mySignals.includes(signalType)) {
          updated.mySignals = [...updated.mySignals, signalType];
        }
        if (signalType === TasteSignalType.BOOKMARKED) {
          updated.bookmarkCount++;
        } else if (signalType === TasteSignalType.ECHOED) {
          updated.echoCount++;
          updated.mySignals = updated.mySignals.filter((s) => s !== TasteSignalType.DIVERGED);
        } else if (signalType === TasteSignalType.DIVERGED) {
          updated.divergeCount++;
          updated.mySignals = updated.mySignals.filter((s) => s !== TasteSignalType.ECHOED);
        }
        queryClient.setQueryData(['signals', noteId], updated);
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['signals', noteId], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['signals', noteId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (signalType: TasteSignalType) =>
      tasteSignalsApi.remove(noteId, signalType),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['signals', noteId] });
    },
  });

  const mySignals = summary?.mySignals || [];
  const isBookmarked = mySignals.includes(TasteSignalType.BOOKMARKED);
  const isEchoed = mySignals.includes(TasteSignalType.ECHOED);
  const isDiverged = mySignals.includes(TasteSignalType.DIVERGED);

  const handleBookmark = () => {
    if (isBookmarked) {
      removeMutation.mutate(TasteSignalType.BOOKMARKED);
    } else {
      sendMutation.mutate({ signalType: TasteSignalType.BOOKMARKED });
    }
  };

  const handleEcho = () => {
    if (isEchoed) {
      removeMutation.mutate(TasteSignalType.ECHOED);
    } else {
      setRatingModal({ visible: true, type: TasteSignalType.ECHOED });
    }
  };

  const handleDiverge = () => {
    if (isDiverged) {
      removeMutation.mutate(TasteSignalType.DIVERGED);
    } else {
      setRatingModal({ visible: true, type: TasteSignalType.DIVERGED });
    }
  };

  const handleRatingSubmit = (rating: number) => {
    sendMutation.mutate({ signalType: ratingModal.type, rating });
    setRatingModal({ ...ratingModal, visible: false });
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={handleBookmark}>
          <MaterialIcons
            name={isBookmarked ? 'bookmark' : 'bookmark-border'}
            size={20}
            color={isBookmarked ? colors.primary : colors.textTertiary}
          />
          <Text style={[styles.count, isBookmarked && styles.countActive]}>
            {summary?.bookmarkCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleEcho}>
          <MaterialIcons
            name={isEchoed ? 'thumb-up' : 'thumb-up-off-alt'}
            size={20}
            color={isEchoed ? colors.success : colors.textTertiary}
          />
          <Text style={[styles.count, isEchoed && { color: colors.success }]}>
            {summary?.echoCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleDiverge}>
          <MaterialIcons
            name={isDiverged ? 'thumb-down' : 'thumb-down-off-alt'}
            size={20}
            color={isDiverged ? colors.error : colors.textTertiary}
          />
          <Text style={[styles.count, isDiverged && { color: colors.error }]}>
            {summary?.divergeCount || 0}
          </Text>
        </TouchableOpacity>
      </View>

      <RatingInputModal
        visible={ratingModal.visible}
        title={ratingModal.type === TasteSignalType.ECHOED ? 'Your Rating (Echo)' : 'Your Rating (Diverge)'}
        onSubmit={handleRatingSubmit}
        onClose={() => setRatingModal({ ...ratingModal, visible: false })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  count: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  countActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
