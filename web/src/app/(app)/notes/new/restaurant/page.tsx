'use client';

import { useRouter } from 'next/navigation';
import { NoteType } from '@mygourmetdiary/shared-types';
import { DISH_CATEGORIES, PORTION_SIZES } from '@mygourmetdiary/shared-constants';
import { useNoteForm } from '@/hooks/use-note-form';
import { NoteFormLayout } from '@/components/note-form-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function NewRestaurantNotePage() {
  const router = useRouter();
  const form = useNoteForm(NoteType.RESTAURANT, () => router.push('/feed'));

  return (
    <NoteFormLayout
      type={NoteType.RESTAURANT}
      title="New Restaurant Note"
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
          <Label htmlFor="dishName">Dish Name *</Label>
          <Input
            id="dishName"
            value={form.formData.extension.dishName || ''}
            onChange={(e) => form.updateExtension('dishName', e.target.value)}
            placeholder="e.g., Margherita Pizza"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dishCategory">Dish Category *</Label>
          <Select
            id="dishCategory"
            value={form.formData.extension.dishCategory || ''}
            onChange={(e) => form.updateExtension('dishCategory', e.target.value)}
            required
          >
            <option value="">Select category</option>
            {DISH_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label>Would Order Again *</Label>
          <Switch
            checked={form.formData.extension.wouldOrderAgain ?? false}
            onCheckedChange={(v) => form.updateExtension('wouldOrderAgain', v)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="portionSize">Portion Size</Label>
          <Select
            id="portionSize"
            value={form.formData.extension.portionSize || ''}
            onChange={(e) => form.updateExtension('portionSize', e.target.value)}
          >
            <option value="">Select size</option>
            {PORTION_SIZES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pricePaid">Price Paid ($)</Label>
          <Input
            id="pricePaid"
            type="number"
            min="0"
            step="0.01"
            value={form.formData.extension.pricePaid || ''}
            onChange={(e) => form.updateExtension('pricePaid', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0.00"
          />
        </div>
      </div>
    </NoteFormLayout>
  );
}
