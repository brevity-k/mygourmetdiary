import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useNoteForm } from '../../hooks/useNoteForm';
import { NoteType } from '../../types';
import { bindersApi, tagsApi } from '../../api/endpoints';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { RatingInput } from '../../components/forms/RatingInput';
import { TagSelector } from '../../components/forms/TagSelector';
import { PhotoPicker } from '../../components/forms/PhotoPicker';
import { VenueSearchInput } from '../../components/forms/VenueSearchInput';
import { BinderSelector } from '../../components/forms/BinderSelector';
import { DISH_CATEGORIES, PORTION_SIZES } from '../../constants/tags.constants';
import { colors, typography, spacing } from '../../theme';

export function RestaurantNoteFormScreen() {
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
  } = useNoteForm(NoteType.RESTAURANT, () => {
    navigation.getParent()?.goBack();
  });

  const { data: binders = [] } = useQuery({
    queryKey: ['binders'],
    queryFn: bindersApi.list,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags', 'RESTAURANT'],
    queryFn: () => tagsApi.list('RESTAURANT'),
  });

  const { data: cuisineTags = [] } = useQuery({
    queryKey: ['tags', 'CUISINE'],
    queryFn: () => tagsApi.list('CUISINE'),
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
      />

      <Input
        label="Dish Name *"
        placeholder="e.g., Spicy Tuna Roll"
        value={formData.extension.dishName || ''}
        onChangeText={(v) => updateExtension('dishName', v)}
      />

      <Input
        label="Title *"
        placeholder="Give your note a title"
        value={formData.title}
        onChangeText={(v) => updateField('title', v)}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Dish Category *</Text>
        <View style={styles.chipRow}>
          {DISH_CATEGORIES.map((cat) => (
            <Text
              key={cat.value}
              style={[
                styles.chipOption,
                formData.extension.dishCategory === cat.value &&
                  styles.chipOptionSelected,
              ]}
              onPress={() => updateExtension('dishCategory', cat.value)}
            >
              {cat.label}
            </Text>
          ))}
        </View>
      </View>

      <RatingInput
        label="Rating *"
        value={formData.rating}
        onChange={(v) => updateField('rating', v)}
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Would Order Again?</Text>
        <Switch
          value={formData.extension.wouldOrderAgain || false}
          onValueChange={(v) => updateExtension('wouldOrderAgain', v)}
          trackColor={{ true: colors.primary }}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Portion Size</Text>
        <View style={styles.chipRow}>
          {PORTION_SIZES.map((size) => (
            <Text
              key={size.value}
              style={[
                styles.chipOption,
                formData.extension.portionSize === size.value &&
                  styles.chipOptionSelected,
              ]}
              onPress={() => updateExtension('portionSize', size.value)}
            >
              {size.label}
            </Text>
          ))}
        </View>
      </View>

      <Input
        label="Price Paid"
        placeholder="$0.00"
        keyboardType="decimal-pad"
        value={formData.extension.pricePaid?.toString() || ''}
        onChangeText={(v) =>
          updateExtension('pricePaid', v ? parseFloat(v) : undefined)
        }
      />

      <PhotoPicker
        photos={photos}
        onAdd={addPhoto}
        onRemove={removePhoto}
      />

      {tags.length > 0 && (
        <TagSelector
          label="Flavor & Texture Tags"
          tags={tags}
          selectedIds={formData.tagIds}
          onChange={(ids) => updateField('tagIds', ids)}
        />
      )}

      <Input
        label="Notes"
        placeholder="Any thoughts about this dish..."
        multiline
        numberOfLines={4}
        style={styles.textArea}
        value={formData.freeText}
        onChangeText={(v) => updateField('freeText', v)}
      />

      <BinderSelector
        binders={binders}
        selectedId={formData.binderId}
        onChange={(id) => updateField('binderId', id)}
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  cancelButton: {
    ...typography.body,
    color: colors.primary,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  row: {
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...typography.bodySmall,
    color: colors.text,
    overflow: 'hidden',
  },
  chipOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    color: colors.textInverse,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
