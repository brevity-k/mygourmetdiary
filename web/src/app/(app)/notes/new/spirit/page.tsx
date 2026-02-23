'use client';

import { useRouter } from 'next/navigation';
import { NoteType } from '@mygourmetdiary/shared-types';
import { SPIRIT_TYPES, SERVING_METHODS } from '@mygourmetdiary/shared-constants';
import { useNoteForm } from '@/hooks/use-note-form';
import { NoteFormLayout } from '@/components/note-form-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

export default function NewSpiritNotePage() {
  const router = useRouter();
  const form = useNoteForm(NoteType.SPIRIT, () => router.push('/feed'));

  return (
    <NoteFormLayout
      type={NoteType.SPIRIT}
      title="New Spirit Note"
      formData={form.formData}
      venue={form.venue}
      photos={form.photos}
      setPhotos={form.setPhotos}
      updateField={form.updateField as any}
      handleVenueChange={form.handleVenueChange}
      onSubmit={form.submit}
      isSubmitting={form.isSubmitting}
      showVenue={false}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="spiritName">Spirit Name *</Label>
          <Input
            id="spiritName"
            value={form.formData.extension.spiritName || ''}
            onChange={(e) => form.updateExtension('spiritName', e.target.value)}
            placeholder="e.g., Yamazaki 12"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="spiritType">Spirit Type *</Label>
            <Select
              id="spiritType"
              value={form.formData.extension.spiritType || ''}
              onChange={(e) => form.updateExtension('spiritType', e.target.value)}
              required
            >
              <option value="">Select type</option>
              {SPIRIT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subType">Sub-type</Label>
            <Input
              id="subType"
              value={form.formData.extension.subType || ''}
              onChange={(e) => form.updateExtension('subType', e.target.value)}
              placeholder="e.g., Single Malt"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="distillery">Distillery / Brewery</Label>
          <Input
            id="distillery"
            value={form.formData.extension.distillery || ''}
            onChange={(e) => form.updateExtension('distillery', e.target.value)}
            placeholder="e.g., Suntory"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ageStatement">Age</Label>
            <Input
              id="ageStatement"
              value={form.formData.extension.ageStatement || ''}
              onChange={(e) => form.updateExtension('ageStatement', e.target.value)}
              placeholder="12 Year"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="abv">ABV (%)</Label>
            <Input
              id="abv"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.formData.extension.abv || ''}
              onChange={(e) => form.updateExtension('abv', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="43.0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="spiritPrice">Price ($)</Label>
            <Input
              id="spiritPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.formData.extension.pricePaid || ''}
              onChange={(e) => form.updateExtension('pricePaid', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="servingMethod">Serving Method</Label>
          <Select
            id="servingMethod"
            value={form.formData.extension.servingMethod || ''}
            onChange={(e) => form.updateExtension('servingMethod', e.target.value || undefined)}
          >
            <option value="">Select method</option>
            {SERVING_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>
        </div>
      </div>
    </NoteFormLayout>
  );
}
