'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { notesApi, photosApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RatingInput } from '@/components/rating-input';
import { PhotoUploader, type PhotoFile } from '@/components/photo-uploader';
import { Visibility } from '@mygourmetdiary/shared-types';
import { useState } from 'react';
import { bindersApi } from '@/lib/api';
import { Separator } from '@/components/ui/separator';

export default function EditNotePage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: note, isLoading } = useQuery({
    queryKey: ['notes', noteId],
    queryFn: () => notesApi.get(noteId),
  });

  const { data: binders } = useQuery({
    queryKey: ['binders'],
    queryFn: () => bindersApi.list(),
  });

  const [title, setTitle] = useState('');
  const [rating, setRating] = useState(0);
  const [freeText, setFreeText] = useState('');
  const [binderId, setBinderId] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(Visibility.PRIVATE);
  const [newPhotos, setNewPhotos] = useState<PhotoFile[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize form with note data once loaded
  if (note && !initialized) {
    setTitle(note.title);
    setRating(note.rating);
    setFreeText(note.freeText || '');
    setBinderId(note.binderId);
    setVisibility(note.visibility);
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: async () => {
      // Upload new photos
      const newPhotoIds: string[] = [];
      for (const photo of newPhotos) {
        const { uploadUrl, photo: photoRecord } = await photosApi.presign(
          photo.file.type,
          photo.file.size,
        );
        await photosApi.upload(uploadUrl, photo.file, photo.file.type);
        newPhotoIds.push(photoRecord.id);
      }

      const updated = await notesApi.update(noteId, {
        title,
        rating,
        freeText: freeText || null,
        binderId,
        visibility,
      });

      if (newPhotoIds.length > 0) {
        await notesApi.attachPhotos(noteId, newPhotoIds);
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      showToast('Note updated!', 'success');
      router.push(`/notes/${noteId}`);
    },
    onError: () => showToast('Failed to update note', 'error'),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!note) {
    return <div className="text-center py-16 text-muted-foreground">Note not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-heading font-bold mb-6">Edit Note</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label>Rating ({rating}/10)</Label>
          <RatingInput value={rating} onChange={setRating} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="freeText">Notes</Label>
          <Textarea
            id="freeText"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="binder">Binder</Label>
          <Select id="binder" value={binderId} onChange={(e) => setBinderId(e.target.value)}>
            {binders?.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label>Public note</Label>
          <Switch
            checked={visibility === Visibility.PUBLIC}
            onCheckedChange={(checked) => setVisibility(checked ? Visibility.PUBLIC : Visibility.PRIVATE)}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Add More Photos</Label>
          <PhotoUploader photos={newPhotos} onChange={setNewPhotos} maxPhotos={10 - (note.photos?.length || 0)} />
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
