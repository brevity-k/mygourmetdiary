'use client';

import { useRouter } from 'next/navigation';
import { NoteType } from '@mygourmetdiary/shared-types';
import { WINE_TYPES, WINE_FINISHES, PURCHASE_CONTEXTS } from '@mygourmetdiary/shared-constants';
import { useNoteForm } from '@/hooks/use-note-form';
import { NoteFormLayout } from '@/components/note-form-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function NewWineNotePage() {
  const router = useRouter();
  const form = useNoteForm(NoteType.WINE, () => router.push('/feed'));

  return (
    <NoteFormLayout
      type={NoteType.WINE}
      title="New Wine Note"
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
          <Label htmlFor="wineName">Wine Name *</Label>
          <Input
            id="wineName"
            value={form.formData.extension.wineName || ''}
            onChange={(e) => form.updateExtension('wineName', e.target.value)}
            placeholder="e.g., Opus One 2019"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wineType">Wine Type *</Label>
          <Select
            id="wineType"
            value={form.formData.extension.wineType || ''}
            onChange={(e) => form.updateExtension('wineType', e.target.value)}
            required
          >
            <option value="">Select type</option>
            {WINE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vintage">Vintage</Label>
            <Input
              id="vintage"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={form.formData.extension.vintage || ''}
              onChange={(e) => form.updateExtension('vintage', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="2020"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={form.formData.extension.region || ''}
              onChange={(e) => form.updateExtension('region', e.target.value)}
              placeholder="e.g., Napa Valley"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="varietal">Grape / Varietal</Label>
          <Input
            id="varietal"
            value={form.formData.extension.grapeVarietal?.join(', ') || ''}
            onChange={(e) => form.updateExtension('grapeVarietal', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
            placeholder="Cabernet Sauvignon, Merlot"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="finish">Finish</Label>
          <Select
            id="finish"
            value={form.formData.extension.finish || ''}
            onChange={(e) => form.updateExtension('finish', e.target.value || undefined)}
          >
            <option value="">Select finish</option>
            {WINE_FINISHES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="winePricePaid">Price Paid ($)</Label>
            <Input
              id="winePricePaid"
              type="number"
              min="0"
              step="0.01"
              value={form.formData.extension.pricePaid || ''}
              onChange={(e) => form.updateExtension('pricePaid', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchaseContext">Where Purchased</Label>
            <Select
              id="purchaseContext"
              value={form.formData.extension.purchaseContext || ''}
              onChange={(e) => form.updateExtension('purchaseContext', e.target.value || undefined)}
            >
              <option value="">Select</option>
              {PURCHASE_CONTEXTS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pairingNotes">Pairing Notes</Label>
          <Textarea
            id="pairingNotes"
            value={form.formData.extension.pairingNotes || ''}
            onChange={(e) => form.updateExtension('pairingNotes', e.target.value)}
            placeholder="What food paired well with this wine?"
            rows={2}
          />
        </div>
      </div>
    </NoteFormLayout>
  );
}
