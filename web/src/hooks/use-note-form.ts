'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NoteType, Visibility } from '@mygourmetdiary/shared-types';
import type { Venue } from '@mygourmetdiary/shared-types';
import { notesApi, photosApi, venuesApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import type { PhotoFile } from '@/components/photo-uploader';

interface NoteFormData {
  type: NoteType;
  title: string;
  binderId: string;
  rating: number;
  freeText: string;
  visibility: Visibility;
  tagIds: string[];
  extension: Record<string, any>;
  venueId: string | null;
  experiencedAt: string;
}

const DRAFT_KEY_PREFIX = 'web_note_draft_';

export function useNoteForm(type: NoteType, onSuccess: () => void) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState<NoteFormData>({
    type,
    title: '',
    binderId: '',
    rating: 0,
    freeText: '',
    visibility: Visibility.PRIVATE,
    tagIds: [],
    extension: {},
    venueId: null,
    experiencedAt: new Date().toISOString().split('T')[0],
  });

  const [venue, setVenue] = useState<Venue | null>(null);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const draftKey = `${DRAFT_KEY_PREFIX}${type}`;

  // Load draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        const parsed = JSON.parse(draft);
        setFormData(parsed.formData);
      }
    } catch {
      // ignore
    }
  }, [draftKey]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!isDirty) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({ formData }));
    }, 30000);
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [formData, isDirty, draftKey]);

  const updateField = useCallback(<K extends keyof NoteFormData>(key: K, value: NoteFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  const updateExtension = useCallback((key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      extension: { ...prev.extension, [key]: value },
    }));
    setIsDirty(true);
  }, []);

  const handleVenueChange = useCallback((v: Venue | null) => {
    setVenue(v);
    setFormData((prev) => ({ ...prev, venueId: v?.placeId ?? null }));
    setIsDirty(true);
    // Persist venue to backend DB so it exists when the note is created
    if (v?.placeId) {
      venuesApi.get(v.placeId).catch(() => {});
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      // Upload photos first
      const photoIds: string[] = [];
      for (const photo of photos) {
        const { uploadUrl, photo: photoRecord } = await photosApi.presign(
          photo.file.type,
          photo.file.size,
        );
        await photosApi.upload(uploadUrl, photo.file, photo.file.type);
        photoIds.push(photoRecord.id);
      }

      return notesApi.create({
        ...formData,
        experiencedAt: new Date(formData.experiencedAt).toISOString(),
        photoIds,
      });
    },
    onSuccess: () => {
      localStorage.removeItem(draftKey);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['binders'] });
      showToast('Note saved!', 'success');
      onSuccess();
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Failed to save note', 'error');
    },
  });

  return {
    formData,
    venue,
    photos,
    setPhotos,
    updateField,
    updateExtension,
    handleVenueChange,
    submit: () => mutation.mutate(),
    isSubmitting: mutation.isPending,
  };
}
