import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { MaterialIcons } from '@expo/vector-icons';
import { notesApi } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { HomeStackParamList } from '../../navigation/types';
import { NoteType } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RouteType = RouteProp<HomeStackParamList, 'NoteDetail'>;

export function NoteDetailScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: note, isLoading } = useQuery({
    queryKey: ['notes', route.params.noteId],
    queryFn: () => notesApi.get(route.params.noteId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => notesApi.remove(route.params.noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      navigation.goBack();
    },
  });

  const handleDelete = () => {
    Alert.alert('Delete Note', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  if (isLoading || !note) return <LoadingSpinner />;

  const ext = note.extension;

  return (
    <ScrollView style={styles.container}>
      {/* Photo carousel */}
      {note.photos.length > 0 && (
        <FlatList
          data={note.photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item.publicUrl }}
              style={styles.carouselImage}
              accessibilityLabel="Note photo"
            />
          )}
        />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{note.title}</Text>

        <View style={styles.meta}>
          <MaterialIcons name="event" size={14} color={colors.textTertiary} />
          <Text style={styles.metaText}>
            {format(new Date(note.experiencedAt), 'MMMM d, yyyy')}
          </Text>
        </View>

        {note.venue && (
          <View style={styles.meta}>
            <MaterialIcons name="place" size={14} color={colors.textTertiary} />
            <Text style={styles.metaText}>{note.venue.name}</Text>
          </View>
        )}

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Text style={styles.ratingNumber}>{note.rating}</Text>
          <Text style={styles.ratingMax}>/10</Text>
        </View>

        {/* Type-specific details */}
        {note.type === NoteType.RESTAURANT && (
          <View style={styles.section}>
            <DetailRow label="Dish" value={ext?.dishName} />
            <DetailRow label="Category" value={ext?.dishCategory} />
            <DetailRow
              label="Would Order Again"
              value={ext?.wouldOrderAgain ? 'Yes' : 'No'}
            />
            {ext?.portionSize && (
              <DetailRow label="Portion" value={ext.portionSize} />
            )}
            {ext?.pricePaid && (
              <DetailRow label="Price" value={`$${ext.pricePaid}`} />
            )}
          </View>
        )}

        {note.type === NoteType.WINE && (
          <View style={styles.section}>
            <DetailRow label="Wine" value={ext?.wineName} />
            <DetailRow label="Type" value={ext?.wineType} />
            {ext?.vintage && <DetailRow label="Vintage" value={String(ext.vintage)} />}
            {ext?.region && <DetailRow label="Region" value={ext.region} />}
            {ext?.grapeVarietal?.length > 0 && (
              <DetailRow label="Grape" value={ext.grapeVarietal.join(', ')} />
            )}
            {ext?.finish && <DetailRow label="Finish" value={ext.finish} />}
            {ext?.pairingNotes && (
              <DetailRow label="Pairing" value={ext.pairingNotes} />
            )}
          </View>
        )}

        {note.type === NoteType.SPIRIT && (
          <View style={styles.section}>
            <DetailRow label="Spirit" value={ext?.spiritName} />
            <DetailRow label="Type" value={ext?.spiritType} />
            {ext?.subType && <DetailRow label="Sub-type" value={ext.subType} />}
            {ext?.distillery && (
              <DetailRow label="Distillery" value={ext.distillery} />
            )}
            {ext?.ageStatement && (
              <DetailRow label="Age" value={ext.ageStatement} />
            )}
            {ext?.abv && <DetailRow label="ABV" value={`${ext.abv}%`} />}
            {ext?.servingMethod && (
              <DetailRow label="Served" value={ext.servingMethod} />
            )}
          </View>
        )}

        {note.type === NoteType.WINERY_VISIT && (
          <View style={styles.section}>
            {ext?.ambianceRating && (
              <DetailRow label="Ambiance" value={`${ext.ambianceRating}/10`} />
            )}
            {ext?.serviceRating && (
              <DetailRow label="Service" value={`${ext.serviceRating}/10`} />
            )}
            <DetailRow
              label="Would Revisit"
              value={ext?.wouldRevisit ? 'Yes' : 'No'}
            />
            {ext?.reservationRequired !== undefined && (
              <DetailRow
                label="Reservation Required"
                value={ext.reservationRequired ? 'Yes' : 'No'}
              />
            )}
          </View>
        )}

        {/* Free text */}
        {note.freeText && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.freeText}>{note.freeText}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Delete"
            variant="outline"
            onPress={handleDelete}
            loading={deleteMutation.isPending}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  carouselImage: { width: SCREEN_WIDTH, height: 280 },
  content: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.sm },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  metaText: { ...typography.bodySmall, color: colors.textSecondary },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: spacing.md,
  },
  ratingNumber: { fontSize: 42, fontWeight: '700', color: colors.primary },
  ratingMax: { ...typography.h3, color: colors.textTertiary, marginLeft: 4 },
  section: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  freeText: { ...typography.body, color: colors.text, lineHeight: 26 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailLabel: { ...typography.bodySmall, color: colors.textSecondary },
  detailValue: { ...typography.bodySmall, color: colors.text, fontWeight: '500' },
  actions: {
    marginTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
