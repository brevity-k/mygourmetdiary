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
import { WINE_TYPES, WINE_FINISHES, PURCHASE_CONTEXTS } from '../../constants/tags.constants';
import { colors, typography, spacing } from '../../theme';

export function WineNoteFormScreen() {
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
  } = useNoteForm(NoteType.WINE, () => {
    navigation.getParent()?.goBack();
  });

  const { data: binders = [] } = useQuery({
    queryKey: ['binders'],
    queryFn: bindersApi.list,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags', 'WINE'],
    queryFn: () => tagsApi.list('WINE'),
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
      {/* ── The Wine ── */}
      <Text style={styles.sectionHeader}>The Wine</Text>

      <Input
        label="Wine Name *"
        placeholder="e.g., Opus One 2019"
        value={formData.extension.wineName || ''}
        onChangeText={(v) => updateExtension('wineName', v)}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Wine Type *</Text>
        <View style={styles.chipRow}>
          {WINE_TYPES.map((wt) => (
            <Text
              key={wt.value}
              style={[
                styles.chipOption,
                formData.extension.wineType === wt.value && styles.chipOptionSelected,
              ]}
              onPress={() => updateExtension('wineType', wt.value)}
            >
              {wt.label}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.inlineRow}>
        <View style={styles.half}>
          <Input
            label="Vintage"
            placeholder="e.g., 2019"
            keyboardType="number-pad"
            value={formData.extension.vintage?.toString() || ''}
            onChangeText={(v) => updateExtension('vintage', v ? parseInt(v) : undefined)}
          />
        </View>
        <View style={styles.half}>
          <Input
            label="Region"
            placeholder="e.g., Napa Valley"
            value={formData.extension.region || ''}
            onChangeText={(v) => updateExtension('region', v)}
          />
        </View>
      </View>

      <Input
        label="Grape / Varietal"
        placeholder="e.g., Cabernet Sauvignon, Merlot"
        value={formData.extension.grapeVarietal?.join(', ') || ''}
        onChangeText={(v) =>
          updateExtension(
            'grapeVarietal',
            v.split(',').map((s: string) => s.trim()).filter(Boolean),
          )
        }
      />

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
        <Text style={styles.label}>Finish</Text>
        <View style={styles.chipRow}>
          {WINE_FINISHES.map((f) => (
            <Text
              key={f.value}
              style={[
                styles.chipOption,
                formData.extension.finish === f.value && styles.chipOptionSelected,
              ]}
              onPress={() => updateExtension('finish', f.value)}
            >
              {f.label}
            </Text>
          ))}
        </View>
      </View>

      <Input
        label="Pairing Notes"
        placeholder="What did you pair this with?"
        value={formData.extension.pairingNotes || ''}
        onChangeText={(v) => updateExtension('pairingNotes', v)}
      />

      {/* ── Photos & Tags ── */}
      <Text style={styles.sectionHeader}>Photos & Tags</Text>

      <PhotoPicker photos={photos} onAdd={addPhoto} onRemove={removePhoto} />

      {tags.length > 0 && (
        <TagSelector
          label="Aroma & Palate Tags"
          tags={tags}
          selectedIds={formData.tagIds}
          onChange={(ids) => updateField('tagIds', ids)}
        />
      )}

      {/* ── Your Diary ── */}
      <Text style={styles.sectionHeader}>Your Diary</Text>

      <Input
        label="Your Thoughts"
        placeholder="Describe the color, aromas, how it evolved in the glass... What was the occasion?"
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

      <Input
        label="Price Paid"
        placeholder="$0.00"
        keyboardType="decimal-pad"
        value={formData.extension.pricePaid?.toString() || ''}
        onChangeText={(v) => updateExtension('pricePaid', v ? parseFloat(v) : undefined)}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Purchase Context</Text>
        <View style={styles.chipRow}>
          {PURCHASE_CONTEXTS.map((ctx) => (
            <Text
              key={ctx.value}
              style={[
                styles.chipOption,
                formData.extension.purchaseContext === ctx.value && styles.chipOptionSelected,
              ]}
              onPress={() => updateExtension('purchaseContext', ctx.value)}
            >
              {ctx.label}
            </Text>
          ))}
        </View>
      </View>

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
