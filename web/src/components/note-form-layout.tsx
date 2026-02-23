'use client';

import { useQuery } from '@tanstack/react-query';
import { Visibility } from '@mygourmetdiary/shared-types';
import type { NoteType } from '@mygourmetdiary/shared-types';
import { bindersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RatingInput } from '@/components/rating-input';
import { VenueSearch } from '@/components/venue-search';
import { PhotoUploader, type PhotoFile } from '@/components/photo-uploader';
import { TagSelector } from '@/components/tag-selector';
import type { Venue } from '@mygourmetdiary/shared-types';

interface NoteFormLayoutProps {
  type: NoteType;
  title: string;
  formData: {
    title: string;
    binderId: string;
    rating: number;
    freeText: string;
    visibility: Visibility;
    tagIds: string[];
    experiencedAt: string;
  };
  venue: Venue | null;
  photos: PhotoFile[];
  setPhotos: (photos: PhotoFile[]) => void;
  updateField: (key: string, value: any) => void;
  handleVenueChange: (venue: Venue | null) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  showVenue?: boolean;
  children: React.ReactNode; // type-specific fields
}

export function NoteFormLayout({
  type,
  title,
  formData,
  venue,
  photos,
  setPhotos,
  updateField,
  handleVenueChange,
  onSubmit,
  isSubmitting,
  showVenue = true,
  children,
}: NoteFormLayoutProps) {
  const { data: binders } = useQuery({
    queryKey: ['binders'],
    queryFn: () => bindersApi.list(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-heading font-bold mb-6">{title}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Give this note a title"
            required
          />
        </div>

        {/* Venue Search */}
        {showVenue && (
          <div className="space-y-2">
            <Label>Venue</Label>
            <VenueSearch value={venue} onChange={handleVenueChange} />
          </div>
        )}

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.experiencedAt}
            onChange={(e) => updateField('experiencedAt', e.target.value)}
            required
          />
        </div>

        {/* Rating */}
        <div className="space-y-2">
          <Label>Rating * ({formData.rating}/10)</Label>
          <RatingInput value={formData.rating} onChange={(v) => updateField('rating', v)} />
        </div>

        <Separator />

        {/* Type-specific fields */}
        {children}

        <Separator />

        {/* Photos */}
        <div className="space-y-2">
          <Label>Photos</Label>
          <PhotoUploader photos={photos} onChange={setPhotos} maxPhotos={10} />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <TagSelector
            category={type}
            value={formData.tagIds}
            onChange={(v) => updateField('tagIds', v)}
          />
        </div>

        {/* Free text notes */}
        <div className="space-y-2">
          <Label htmlFor="freeText">Notes</Label>
          <Textarea
            id="freeText"
            value={formData.freeText}
            onChange={(e) => updateField('freeText', e.target.value)}
            placeholder="Your personal observations..."
            rows={4}
          />
        </div>

        {/* Binder */}
        <div className="space-y-2">
          <Label htmlFor="binder">Binder *</Label>
          <Select
            id="binder"
            value={formData.binderId}
            onChange={(e) => updateField('binderId', e.target.value)}
            required
          >
            <option value="">Select a binder</option>
            {binders?.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between">
          <Label>Public note</Label>
          <Switch
            checked={formData.visibility === Visibility.PUBLIC}
            onCheckedChange={(checked) =>
              updateField('visibility', checked ? Visibility.PUBLIC : Visibility.PRIVATE)
            }
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || !formData.title || formData.rating === 0 || !formData.binderId}>
          {isSubmitting ? 'Saving...' : 'Save Note'}
        </Button>
      </form>
    </div>
  );
}
