'use client';

import { useRouter } from 'next/navigation';
import { NoteType } from '@mygourmetdiary/shared-types';
import { useNoteForm } from '@/hooks/use-note-form';
import { NoteFormLayout } from '@/components/note-form-layout';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RatingInput } from '@/components/rating-input';

export default function NewWineryVisitNotePage() {
  const router = useRouter();
  const form = useNoteForm(NoteType.WINERY_VISIT, () => router.push('/feed'));

  return (
    <NoteFormLayout
      type={NoteType.WINERY_VISIT}
      title="New Winery Visit"
      formData={form.formData}
      venue={form.venue}
      photos={form.photos}
      setPhotos={form.setPhotos}
      updateField={form.updateField as any}
      handleVenueChange={form.handleVenueChange}
      onSubmit={form.submit}
      isSubmitting={form.isSubmitting}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Ambiance Rating ({form.formData.extension.ambianceRating || 0}/10)</Label>
          <RatingInput
            value={form.formData.extension.ambianceRating || 0}
            onChange={(v) => form.updateExtension('ambianceRating', v)}
          />
        </div>

        <div className="space-y-2">
          <Label>Service Rating ({form.formData.extension.serviceRating || 0}/10)</Label>
          <RatingInput
            value={form.formData.extension.serviceRating || 0}
            onChange={(v) => form.updateExtension('serviceRating', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Would Revisit *</Label>
          <Switch
            checked={form.formData.extension.wouldRevisit ?? false}
            onCheckedChange={(v) => form.updateExtension('wouldRevisit', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Reservation Required</Label>
          <Switch
            checked={form.formData.extension.reservationRequired ?? false}
            onCheckedChange={(v) => form.updateExtension('reservationRequired', v)}
          />
        </div>
      </div>
    </NoteFormLayout>
  );
}
