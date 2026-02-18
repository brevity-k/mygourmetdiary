import React from 'react';
import { ScrollView, View, Text, Switch, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useNoteForm } from '../../hooks/useNoteForm';
import { NoteType, Visibility } from '../../types';
import { bindersApi, tagsApi } from '../../api/endpoints';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { RatingInput } from '../../components/forms/RatingInput';
import { TagSelector } from '../../components/forms/TagSelector';
import { PhotoPicker } from '../../components/forms/PhotoPicker';
import { BinderSelector } from '../../components/forms/BinderSelector';
import { DateInput } from '../../components/forms/DateInput';
import { SPIRIT_TYPES, SERVING_METHODS } from '../../constants/tags.constants';
import { colors, typography, spacing } from '../../theme';

export function SpiritNoteFormScreen() {
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
  } = useNoteForm(NoteType.SPIRIT, () => {
    navigation.getParent()?.goBack();
  });

  const { data: binders = [] } = useQuery({
    queryKey: ['binders'],
    queryFn: bindersApi.list,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags', 'SPIRIT'],
    queryFn: () => tagsApi.list('SPIRIT'),
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
      {/* ── The Spirit ── */}
      <Text style={styles.sectionHeader}>The Spirit</Text>

      <Input
        label="Spirit Name *"
        placeholder="e.g., Yamazaki 12 Year"
        value={formData.extension.spiritName || ''}
        onChangeText={(v) => updateExtension('spiritName', v)}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Spirit Type *</Text>
        <View style={styles.chipRow}>
          {SPIRIT_TYPES.map((st) => (
            <Text
              key={st.value}
              style={[
                styles.chipOption,
                formData.extension.spiritType === st.value && styles.chipOptionSelected,
              ]}
              onPress={() => updateExtension('spiritType', st.value)}
            >
              {st.label}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.inlineRow}>
        <View style={styles.half}>
          <Input
            label="Sub-type"
            placeholder="e.g., Bourbon"
            value={formData.extension.subType || ''}
            onChangeText={(v) => updateExtension('subType', v)}
          />
        </View>
        <View style={styles.half}>
          <Input
            label="Distillery"
            placeholder="e.g., Suntory"
            value={formData.extension.distillery || ''}
            onChangeText={(v) => updateExtension('distillery', v)}
          />
        </View>
      </View>

      <View style={styles.inlineRow}>
        <View style={styles.half}>
          <Input
            label="Age Statement"
            placeholder="e.g., 12 Year"
            value={formData.extension.ageStatement || ''}
            onChangeText={(v) => updateExtension('ageStatement', v)}
          />
        </View>
        <View style={styles.half}>
          <Input
            label="ABV %"
            placeholder="e.g., 43"
            keyboardType="decimal-pad"
            value={formData.extension.abv?.toString() || ''}
            onChangeText={(v) => updateExtension('abv', v ? parseFloat(v) : undefined)}
          />
        </View>
      </View>

      {/* ── Your Tasting ── */}
      <Text style={styles.sectionHeader}>Your Tasting</Text>

      <Input
        label="Title *"
        placeholder="Give your note a title"
        value={formData.title}
        onChangeText={(v) => updateField('title', v)}
      />

      <RatingInput
        label="Rating *"
        value={formData.rating}
        onChange={(v) => updateField('rating', v)}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Serving Method</Text>
        <View style={styles.chipRow}>
          {SERVING_METHODS.map((sm) => (
            <Text
              key={sm.value}
              style={[
                styles.chipOption,
                formData.extension.servingMethod === sm.value && styles.chipOptionSelected,
              ]}
              onPress={() => updateExtension('servingMethod', sm.value)}
            >
              {sm.label}
            </Text>
          ))}
        </View>
      </View>

      <Input
        label="Price Paid"
        placeholder="$0.00"
        keyboardType="decimal-pad"
        value={formData.extension.pricePaid?.toString() || ''}
        onChangeText={(v) => updateExtension('pricePaid', v ? parseFloat(v) : undefined)}
      />

      {/* ── Photos & Tags ── */}
      <Text style={styles.sectionHeader}>Photos & Tags</Text>

      <PhotoPicker photos={photos} onAdd={addPhoto} onRemove={removePhoto} />

      {tags.length > 0 && (
        <TagSelector
          label="Nose, Palate & Finish Tags"
          tags={tags}
          selectedIds={formData.tagIds}
          onChange={(ids) => updateField('tagIds', ids)}
        />
      )}

      {/* ── Your Diary ── */}
      <Text style={styles.sectionHeader}>Your Diary</Text>

      <Input
        label="Your Thoughts"
        placeholder="Describe the nose, palate, finish... Where and how did you enjoy it?"
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
        label="Date of Experience"
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
  row: { marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
  inlineRow: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  textArea: { height: 160, textAlignVertical: 'top', paddingTop: spacing.sm },
  saveButton: { marginTop: spacing.md },
});
