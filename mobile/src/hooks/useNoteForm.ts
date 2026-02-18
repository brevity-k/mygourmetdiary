import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi, photosApi } from '../api/endpoints';
import { NoteType, Visibility } from '../types';
import { useUIStore } from '../store/ui.store';

interface PhotoAsset {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
  fileSize: number;
}

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

const DRAFT_KEY_PREFIX = 'note_draft_';

export function useNoteForm(type: NoteType, onSuccess: () => void) {
  const queryClient = useQueryClient();
  const defaultVisibility = useUIStore((s) => s.defaultVisibility);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState<NoteFormData>({
    type,
    title: '',
    binderId: '',
    rating: 0,
    freeText: '',
    visibility: defaultVisibility,
    tagIds: [],
    extension: {},
    venueId: null,
    experiencedAt: new Date().toISOString(),
  });

  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const draftKey = `${DRAFT_KEY_PREFIX}${type}`;

  // Load draft on mount
  useEffect(() => {
    AsyncStorage.getItem(draftKey).then((draft) => {
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setFormData(parsed.formData);
          // Photos can't be restored from draft (temporary URIs)
        } catch {
          // Ignore invalid draft
        }
      }
    });
  }, [draftKey]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!isDirty) return;

    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      AsyncStorage.setItem(draftKey, JSON.stringify({ formData }));
    }, 30000);

    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [formData, isDirty, draftKey]);

  const updateField = useCallback(
    <K extends keyof NoteFormData>(key: K, value: NoteFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setIsDirty(true);
    },
    [],
  );

  const updateExtension = useCallback(
    (key: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        extension: { ...prev.extension, [key]: value },
      }));
      setIsDirty(true);
    },
    [],
  );

  const addPhoto = useCallback((photo: PhotoAsset) => {
    setPhotos((prev) => [...prev, photo]);
    setIsDirty(true);
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      // Upload photos first
      const photoIds: string[] = [];
      for (const photo of photos) {
        const { uploadUrl, photo: photoRecord } = await photosApi.presign(
          photo.mimeType,
          photo.fileSize,
        );
        await photosApi.upload(uploadUrl, photo.uri, photo.mimeType);
        photoIds.push(photoRecord.id);
      }

      // Create note
      return notesApi.create({
        ...formData,
        photoIds,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AsyncStorage.removeItem(draftKey);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['binders'] });
      onSuccess();
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to save note',
      );
    },
  });

  const confirmDiscard = useCallback(
    (goBack: () => void) => {
      if (!isDirty) {
        goBack();
        return;
      }
      Alert.alert('Discard note?', 'Your unsaved changes will be lost.', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            AsyncStorage.removeItem(draftKey);
            goBack();
          },
        },
      ]);
    },
    [isDirty, draftKey],
  );

  return {
    formData,
    photos,
    updateField,
    updateExtension,
    addPhoto,
    removePhoto,
    submit: mutation.mutate,
    isSubmitting: mutation.isPending,
    confirmDiscard,
  };
}
