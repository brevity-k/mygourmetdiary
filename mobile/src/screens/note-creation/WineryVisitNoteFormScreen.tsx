import React from 'react';
import { ScrollView, View, Text, Switch, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useNoteForm } from '../../hooks/useNoteForm';
import { NoteType, Visibility } from '../../types';
import { bindersApi } from '../../api/endpoints';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { RatingInput } from '../../components/forms/RatingInput';
import { PhotoPicker } from '../../components/forms/PhotoPicker';
import { VenueSearchInput } from '../../components/forms/VenueSearchInput';
import { BinderSelector } from '../../components/forms/BinderSelector';
import { DateInput } from '../../components/forms/DateInput';
import { colors, typography, spacing } from '../../theme';

export function WineryVisitNoteFormScreen() {
  const navigation = useNavigation();

  const {
    formData,
    photos,
    updateField,
    updateExtension,
    addPhoto,
    removePhoto,
    submit,
    isSubmitting,
    confirmDiscard,
  } = useNoteForm(NoteType.WINERY_VISIT, () => {
    navigation.getParent()?.goBack();
  });

  const { data: binders = [] } = useQuery({
    queryKey: ['binders'],
    queryFn: bindersApi.list,
  });

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Text
          style={styles.cancelButton}
          onPress={() => confirmDiscard(navigation.goBack)}
        >
          Cancel
        </Text>
      ),
    });
  }, [navigation, confirmDiscard]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── The Venue ── */}
      <Text style={styles.sectionHeader}>The Venue</Text>

      <VenueSearchInput
        value={
          formData.venueId
            ? { placeId: formData.venueId, name: formData.extension.venueName || '', address: '' }
            : null
        }
        onChange={(venue) => {
          updateField('venueId', venue?.placeId || null);
          updateExtension('venueName', venue?.name || '');
        }}
        label="Winery / Distillery *"
      />

      <Input
        label="Title *"
        placeholder="Give your visit a title"
        value={formData.title}
        onChangeText={(v) => updateField('title', v)}
      />

      {/* ── Your Experience ── */}
      <Text style={styles.sectionHeader}>Your Experience</Text>

      <RatingInput
        label="Overall Rating *"
        value={formData.rating}
        onChange={(v) => updateField('rating', v)}
      />

      <RatingInput
        label="Ambiance"
        value={formData.extension.ambianceRating || 0}
        onChange={(v) => updateExtension('ambianceRating', v)}
      />

      <RatingInput
        label="Service"
        value={formData.extension.serviceRating || 0}
        onChange={(v) => updateExtension('serviceRating', v)}
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Would Revisit?</Text>
        <Switch
          value={formData.extension.wouldRevisit || false}
          onValueChange={(v) => updateExtension('wouldRevisit', v)}
          trackColor={{ true: colors.primary }}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Reservation Required?</Text>
        <Switch
          value={formData.extension.reservationRequired || false}
          onValueChange={(v) => updateExtension('reservationRequired', v)}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {/* ── Photos ── */}
      <Text style={styles.sectionHeader}>Photos</Text>

      <PhotoPicker photos={photos} onAdd={addPhoto} onRemove={removePhoto} />

      {/* ── Your Diary ── */}
      <Text style={styles.sectionHeader}>Your Diary</Text>

      <Input
        label="Your Thoughts"
        placeholder="Describe the atmosphere, the tastings, what stood out... Would you recommend it?"
        multiline
        numberOfLines={6}
        style={styles.textArea}
        value={formData.freeText}
        onChangeText={(v) => updateField('freeText', v)}
      />

      {/* ── Save ── */}
      <Text style={styles.sectionHeader}>Save</Text>

      <BinderSelector
        binders={binders}
        selectedId={formData.binderId}
        onChange={(id) => updateField('binderId', id)}
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>
          {formData.visibility === Visibility.PUBLIC ? 'Public' : 'Private'}
        </Text>
        <Switch
          value={formData.visibility === Visibility.PUBLIC}
          onValueChange={(v) =>
            updateField('visibility', v ? Visibility.PUBLIC : Visibility.PRIVATE)
          }
          trackColor={{ true: colors.primary }}
        />
      </View>

      <DateInput
        label="Date of Visit"
        value={formData.experiencedAt}
        onChange={(iso) => updateField('experiencedAt', iso)}
      />

      <Button
        title="Save Note"
        onPress={() => submit()}
        loading={isSubmitting}
        disabled={!formData.title || !formData.rating || !formData.binderId}
        style={styles.saveButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  cancelButton: { ...typography.body, color: colors.primary },
  sectionHeader: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  textArea: { height: 160, textAlignVertical: 'top', paddingTop: spacing.sm },
  saveButton: { marginTop: spacing.md },
});
